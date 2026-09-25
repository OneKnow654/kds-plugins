import path from "node:path";
import fs from "node:fs/promises";

const CONFIG_FILE = ".kds/image-ui.config.json";

export const DEFAULT_CONFIG = {
  port: 4500,
  autoOpen: true,
  defaultQuality: 80,
  defaultFormat: "webp",
  saveLocation: ".kds/output",
  preserveFilename: true,
  filenamePrefix: "",
  filenameSuffix: "-optimized",
};

export async function loadConfig(root) {
  const configPath = path.join(root, CONFIG_FILE);
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(root, newConfig) {
  const configDir = path.join(root, ".kds");
  const configPath = path.join(configDir, "image-ui.config.json");
  try {
    await fs.mkdir(configDir, { recursive: true });
    const current = await loadConfig(root);
    const updated = { ...current, ...newConfig };
    await fs.writeFile(configPath, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    throw new Error(`Failed to save config: ${err.message}`);
  }
}
