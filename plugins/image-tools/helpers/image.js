import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import sharpIco from "sharp-ico";

const SUPPORTED_FORMATS = new Set([
    "webp",
    "avif",
    "ico",
]);

export function validateFormat(format) {
    if (!SUPPORTED_FORMATS.has(format)) {
        throw new Error(
            `Unsupported output format: ${format}\n` +
            `Supported formats: webp, avif, ico`
        );
    }
}

export function parseNumber(value, name, min, max) {
    const number = Number(value);

    if (!Number.isInteger(number)) {
        throw new Error(
            `${name} must be an integer between ${min} and ${max}.`
        );
    }

    if (number < min || number > max) {
        throw new Error(
            `${name} must be between ${min} and ${max}.`
        );
    }

    return number;
}

export async function ensureInputExists(inputPath) {
    try {
        const stat = await fs.stat(inputPath);

        if (!stat.isFile()) {
            throw new Error(
                `Input is not a file: ${inputPath}`
            );
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new Error(
                `Input file does not exist: ${inputPath}`
            );
        }

        throw error;
    }
}

export function buildOutputPath(
    inputPath,
    format,
    output
) {
    const inputName = path.basename(inputPath);
    const baseName = path.parse(inputName).name;

    if (!output) {
        return path.join(
            path.dirname(inputPath),
            `${baseName}.${format}`
        );
    }

    const outputExtension = path.extname(output);

    if (outputExtension) {
        return output;
    }

    return path.join(
        output,
        `${baseName}.${format}`
    );
}

export async function ensureParentDirectory(filePath) {
    await fs.mkdir(
        path.dirname(filePath),
        {
            recursive: true,
        }
    );
}

export async function assertSafeOutput(
    outputPath,
    force
) {
    try {
        await fs.access(outputPath);

        if (!force) {
            throw new Error(
                `File already exists: ${outputPath}\n` +
                `Use --force to overwrite it.`
            );
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            return;
        }

        throw error;
    }
}

function applyResize(image, options) {
    const width = options.width;
    const height = options.height;

    if (!width && !height) {
        return image;
    }

    return image.resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
    });
}

function applyOutputFormat(
    image,
    format,
    quality,
    lossless
) {
    switch (format) {
        case "webp":
            return image.webp({
                quality,
                lossless,
            });

        case "avif":
            return image.avif({
                quality,
                lossless,
            });

        default:
            return image;
    }
}

export async function convertImage({
    inputPath,
    outputPath,
    format,
    quality,
    width,
    height,
    lossless,
    preserveMetadata,
}) {
    validateFormat(format);

    const input = sharp(inputPath)
        .autoOrient();

    let pipeline = applyResize(input, {
        width,
        height,
    });

    if (format === "ico") {
        const pngBuffer = await pipeline
            .png()
            .toBuffer();

        const icoBuffer = await sharpIco.sharpsToIco(
            [
                sharp(pngBuffer),
            ],
            outputPath,
            {
                sizes: "default",
            }
        );

        return icoBuffer;
    }

    pipeline = applyOutputFormat(
        pipeline,
        format,
        quality,
        lossless
    );

    if (preserveMetadata) {
        pipeline = pipeline.keepMetadata();
    }

    return pipeline.toFile(outputPath);
}

export async function getImageInfo(filePath) {
    return sharp(filePath).metadata();
}
