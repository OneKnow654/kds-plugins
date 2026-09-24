import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import sharpIco from "sharp-ico";

const SUPPORTED_FORMATS = new Set(["webp", "avif", "ico", "png", "jpeg", "jpg"]);

export function validateFormat(format) {
  const norm = format ? format.toLowerCase() : "";
  if (!SUPPORTED_FORMATS.has(norm)) {
    throw new Error(`Unsupported output format: ${format}. Supported: webp, avif, ico, png, jpeg`);
  }
  return norm;
}

export async function processImageBuffer(inputBuffer, options = {}) {
  const format = validateFormat(options.format || "webp");
  const quality = Math.max(1, Math.min(100, Number(options.quality) || 80));
  const width = options.width ? Number(options.width) : undefined;
  const height = options.height ? Number(options.height) : undefined;
  const lossless = Boolean(options.lossless);

  let pipeline = sharp(inputBuffer).autoOrient();

  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (format === "ico") {
    const pngBuf = await pipeline.png().toBuffer();
    const icoBuf = await sharpIco.sharpsToIco([sharp(pngBuf)], null, { sizes: "default" });
    return { buffer: icoBuf, format: "ico", mimeType: "image/x-icon" };
  }

  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality, lossless });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality, lossless });
      break;
    case "png":
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case "jpeg":
    case "jpg":
      pipeline = pipeline.jpeg({ quality });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();
  const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;

  return { buffer: outputBuffer, format, mimeType };
}

export async function getImageMetadata(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    space: meta.space,
    channels: meta.channels,
    hasAlpha: meta.hasAlpha,
    size: inputBuffer.length,
  };
}
