import path from "node:path";
import fs from "node:fs/promises";

const CONFIG_DIRECTORY = ".kds";
const CONFIG_FILE = "image.config.json";

export const DEFAULT_CONFIG = {
    quality: 80,
    format: "webp",
    overwrite: false,
    preserveMetadata: false,
};

export async function loadConfig(root) {
    const configPath = path.join(
        root,
        CONFIG_DIRECTORY,
        CONFIG_FILE
    );

    try {
        const contents = await fs.readFile(configPath, "utf-8");
        const userConfig = JSON.parse(contents);

        return {
            ...DEFAULT_CONFIG,
            ...userConfig,
        };
    } catch (error) {
        if (error.code === "ENOENT") {
            return {
                ...DEFAULT_CONFIG,
            };
        }

        throw new Error(
            `Unable to read image configuration: ${error.message}`
        );
    }
}

export async function saveConfig(root, config) {
    const directory = path.join(root, CONFIG_DIRECTORY);
    const configPath = path.join(directory, CONFIG_FILE);

    await fs.mkdir(directory, {
        recursive: true,
    });

    await fs.writeFile(
        configPath,
        `${JSON.stringify(config, null, 2)}\n`,
        "utf-8"
    );

    return configPath;
}

export function printConfig(config) {
    console.log("KDS Image Configuration");
    console.log("");
    console.log(`Quality: ${config.quality}`);
    console.log(`Format: ${config.format}`);
    console.log(`Overwrite: ${config.overwrite}`);
    console.log(`Preserve metadata: ${config.preserveMetadata}`);
}
