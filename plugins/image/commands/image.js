import path from "node:path";
import fs from "node:fs/promises";

import {
    loadConfig,
    printConfig,
} from "../helpers/config.js";

import {
    showHelp,
} from "../helpers/help.js";

import {
    validateFormat,
    parseNumber,
    ensureInputExists,
    buildOutputPath,
    ensureParentDirectory,
    assertSafeOutput,
    convertImage,
} from "../helpers/image.js";

const KEY_VALUE_FLAGS = new Set(["format", "quality", "width", "height", "output"]);

function parseKeyValueFlag(flag, nextValue) {
    if (flag.includes("=")) {
        const [keyWithDashes, ...valueParts] = flag.split("=");
        const key = keyWithDashes.replace(/^--/, "");
        const value = valueParts.join("=");

        if (KEY_VALUE_FLAGS.has(key)) {
            if (!value) {
                throw new Error(`${keyWithDashes} requires a value.`);
            }
            return { key, value, consumedNext: false };
        }
    }

    if (flag.startsWith("--")) {
        const key = flag.slice(2);
        if (KEY_VALUE_FLAGS.has(key)) {
            if (nextValue === undefined || nextValue.startsWith("--")) {
                throw new Error(`${flag} requires a value.`);
            }
            return { key, value: nextValue, consumedNext: true };
        }
    }

    return null;
}

function normalizeFlags(flags = []) {
    const result = {};

    for (let index = 0; index < flags.length; index += 1) {
        const flag = flags[index];

        if (flag === "--force") {
            result.force = true;
            continue;
        }

        if (flag === "--lossless") {
            result.lossless = true;
            continue;
        }

        if (flag === "--help" || flag === "-h") {
            result.help = true;
            continue;
        }

        const parsed = parseKeyValueFlag(flag, flags[index + 1]);
        if (parsed) {
            result[parsed.key] = parsed.value;
            if (parsed.consumedNext) {
                index += 1;
            }
            continue;
        }

        throw new Error(
            `Unknown option: ${flag}\n\n` +
            `Run "kds image help" for usage.`
        );
    }

    return result;
}

async function runConvert({
    args,
    flags,
    root,
    config,
}) {
    const input = args[0];

    if (!input) {
        throw new Error(
            "Image input is required.\n\n" +
            "Usage: kds image convert <input> --format webp"
        );
    }

    const inputPath = path.resolve(root, input);

    await ensureInputExists(inputPath);

    const format = flags.format ?? config.format;

    validateFormat(format);

    const quality = flags.quality
        ? parseNumber(
            flags.quality,
            "Quality",
            1,
            100
        )
        : config.quality;

    const width = flags.width
        ? parseNumber(
            flags.width,
            "Width",
            1,
            100000
        )
        : undefined;

    const height = flags.height
        ? parseNumber(
            flags.height,
            "Height",
            1,
            100000
        )
        : undefined;

    const outputPath = buildOutputPath(
        inputPath,
        format,
        flags.output
            ? path.resolve(root, flags.output)
            : undefined
    );

    await assertSafeOutput(
        outputPath,
        Boolean(flags.force) || config.overwrite
    );

    await ensureParentDirectory(outputPath);

    const before = await fs.stat(inputPath);

    await convertImage({
        inputPath,
        outputPath,
        format,
        quality,
        width,
        height,
        lossless: Boolean(flags.lossless),
        preserveMetadata: config.preserveMetadata,
    });

    const after = await fs.stat(outputPath);

    console.log(`✓ Converted ${inputPath}`);
    console.log(`  Format: ${format}`);
    console.log(`  Quality: ${quality}`);
    console.log(
        `  Size: ${formatBytes(before.size)} → ${formatBytes(after.size)}`
    );
    console.log(`  Output: ${outputPath}`);
}

async function runCompress({
    args,
    flags,
    root,
    config,
}) {
    const input = args[0];

    if (!input) {
        throw new Error(
            "Image input is required.\n\n" +
            "Usage: kds image compress <input>"
        );
    }

    const inputPath = path.resolve(root, input);

    await ensureInputExists(inputPath);

    const format = flags.format ?? config.format;

    validateFormat(format);

    const quality = flags.quality
        ? parseNumber(
            flags.quality,
            "Quality",
            1,
            100
        )
        : config.quality;

    const outputPath = buildOutputPath(
        inputPath,
        format,
        flags.output
            ? path.resolve(root, flags.output)
            : undefined
    );

    await assertSafeOutput(
        outputPath,
        Boolean(flags.force) || config.overwrite
    );

    await ensureParentDirectory(outputPath);

    const before = await fs.stat(inputPath);

    await convertImage({
        inputPath,
        outputPath,
        format,
        quality,
        lossless: Boolean(flags.lossless),
        preserveMetadata: config.preserveMetadata,
    });

    const after = await fs.stat(outputPath);

    const saved = before.size > 0
        ? ((before.size - after.size) / before.size) * 100
        : 0;

    console.log(`✓ Compressed ${inputPath}`);
    console.log(
        `  Size: ${formatBytes(before.size)} → ${formatBytes(after.size)}`
    );
    console.log(`  Saved: ${saved.toFixed(1)}%`);
    console.log(`  Output: ${outputPath}`);
}

async function runRemoveBackground() {
    throw new Error(
        "Background removal is not implemented yet.\n" +
        "The plugin needs a documented/local background-removal " +
        "engine before this command can be implemented safely."
    );
}

async function runConfig({
    root,
}) {
    const config = await loadConfig(root);

    printConfig(config);
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function runImageCommand({
    args = [],
    flags = [],
    root,
}) {
    const normalizedFlags = normalizeFlags(flags);

    if (
        normalizedFlags.help ||
        args.length === 0 ||
        args[0] === "help"
    ) {
        showHelp();
        return;
    }

    const [command, ...commandArgs] = args;

    const config = await loadConfig(root);

    switch (command) {
        case "convert":
            await runConvert({
                args: commandArgs,
                flags: normalizedFlags,
                root,
                config,
            });
            return;

        case "compress":
            await runCompress({
                args: commandArgs,
                flags: normalizedFlags,
                root,
                config,
            });
            return;

        case "remove-bg":
            await runRemoveBackground({
                args: commandArgs,
                flags: normalizedFlags,
                root,
                config,
            });
            return;

        case "config":
            await runConfig({
                root,
            });
            return;

        default:
            throw new Error(
                `Unknown image command: ${command}\n\n` +
                `Run "kds image help" for available commands.`
            );
    }
}
