import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { processImageBuffer, getImageMetadata } from "../helpers/image.js";
import { loadConfig, saveConfig } from "../helpers/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_DIR = path.join(__dirname, "static");

async function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const bodyBuffer = Buffer.concat(chunks);
      const contentType = req.headers["content-type"] || "";
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      
      if (!boundaryMatch) {
        return reject(new Error("Invalid multipart content type"));
      }

      const boundary = boundaryMatch[1] || boundaryMatch[2];
      const parts = parseMultipartBuffer(bodyBuffer, boundary);
      resolve(parts);
    });
    req.on("error", reject);
  });
}

function parseMultipartBuffer(buffer, boundary) {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const result = { fields: {}, files: {} };
  let start = 0;

  while (start < buffer.length) {
    const boundaryIdx = buffer.indexOf(boundaryBuf, start);
    if (boundaryIdx === -1) break;

    const nextBoundaryIdx = buffer.indexOf(boundaryBuf, boundaryIdx + boundaryBuf.length);
    if (nextBoundaryIdx === -1) break;

    const partBuf = buffer.slice(boundaryIdx + boundaryBuf.length + 2, nextBoundaryIdx - 2);
    const headerEndIdx = partBuf.indexOf("\r\n\r\n");

    if (headerEndIdx !== -1) {
      const headerText = partBuf.slice(0, headerEndIdx).toString("utf-8");
      const bodyData = partBuf.slice(headerEndIdx + 4);

      const dispMatch = headerText.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
      if (dispMatch) {
        const fieldName = dispMatch[1];
        const filename = dispMatch[2];

        if (filename) {
          result.files[fieldName] = { filename, data: bodyData };
        } else {
          result.fields[fieldName] = bodyData.toString("utf-8").trim();
        }
      }
    }

    start = nextBoundaryIdx;
  }

  return result;
}

async function scanWorkspaceImages(dir, rootDir, filesList = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanWorkspaceImages(fullPath, rootDir, filesList);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".ico"].includes(ext)) {
          const stat = await fs.stat(fullPath);
          filesList.push({
            name: entry.name,
            relPath: path.relative(rootDir, fullPath),
            size: stat.size,
          });
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return filesList;
}

export function createUIServer(rootDir) {
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;

    // REST API ENDPOINTS
    if (pathname === "/api/config" && req.method === "GET") {
      const config = await loadConfig(rootDir);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(config));
      return;
    }

    if (pathname === "/api/config" && req.method === "POST") {
      try {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", async () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const updated = await saveConfig(rootDir, parsed);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Config saved", config: updated }));
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: err.message }));
          }
        });
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: error.message }));
      }
      return;
    }

    if (pathname === "/api/scan" && req.method === "GET") {
      const files = await scanWorkspaceImages(rootDir, rootDir);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ files }));
      return;
    }

    if (pathname === "/api/file" && req.method === "GET") {
      const relPath = parsedUrl.searchParams.get("path");
      if (!relPath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Missing path parameter" }));
        return;
      }

      const filePath = path.resolve(rootDir, relPath);
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Access denied" }));
        return;
      }

      try {
        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = ext === ".svg" ? "image/svg+xml" : `image/${ext.replace(".", "")}`;
        res.writeHead(200, { "Content-Type": mime });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "File not found" }));
      }
      return;
    }

    if (pathname === "/api/process" && req.method === "POST") {
      try {
        const { fields, files } = await parseMultipartForm(req);
        const fileObj = files.image || Object.values(files)[0];

        if (!fileObj || !fileObj.data) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "No image file uploaded" }));
          return;
        }

        const config = await loadConfig(rootDir);
        const processed = await processImageBuffer(fileObj.data, {
          format: fields.format || config.defaultFormat || "webp",
          quality: fields.quality || config.defaultQuality || 80,
          width: fields.width,
          height: fields.height,
          lossless: fields.lossless === "true",
        });

        res.writeHead(200, {
          "Content-Type": processed.mimeType,
          "Content-Length": processed.buffer.length,
          "X-Image-Format": processed.format,
        });
        res.end(processed.buffer);
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: error.message }));
      }
      return;
    }

    if (pathname === "/api/save" && req.method === "POST") {
      try {
        const { fields, files } = await parseMultipartForm(req);
        const fileObj = files.image || Object.values(files)[0];

        if (!fileObj || !fileObj.data) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "No image file uploaded" }));
          return;
        }

        const config = await loadConfig(rootDir);
        const customSubPath = fields.saveLocation || config.saveLocation || ".kds/output";
        const outputDir = path.isAbsolute(customSubPath)
          ? customSubPath
          : path.join(rootDir, customSubPath);

        await fs.mkdir(outputDir, { recursive: true });
        const savePath = path.join(outputDir, fileObj.filename || "optimized.webp");
        await fs.writeFile(savePath, fileObj.data);

        res.writeHead(200, {
          "Content-Type": "application/json",
        });
        res.end(
          JSON.stringify({
            message: "File saved",
            path: path.relative(rootDir, savePath) || savePath,
          })
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: error.message }));
      }
      return;
    }

    // STATIC ASSETS
    let filePath = path.join(STATIC_DIR, pathname === "/" ? "index.html" : pathname);
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
      };

      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  return server;
}
