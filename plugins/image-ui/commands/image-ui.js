import { exec } from "node:child_process";
import os from "node:os";
import { createUIServer } from "../server/app.js";
import { loadConfig } from "../helpers/config.js";

function openBrowser(url) {
  const platform = os.platform();
  let cmd = "";

  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd, () => {
    // Ignore browser open errors
  });
}

export async function runImageUICommand({ flags = [], root }) {
  const config = await loadConfig(root);

  const portFlag = flags.find((f) => f.startsWith("--port="));
  const port = portFlag ? Number(portFlag.split("=")[1]) : config.port || 4500;

  const noOpen = flags.includes("--no-open");

  const server = createUIServer(root);

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log("");
    console.log("🎨 KDS Image Studio UI Server");
    console.log("──────────────────────────────────────────────────");
    console.log(`  • Status:      Running ✓`);
    console.log(`  • Local URL:   ${url}`);
    console.log(`  • Workspace:   ${root}`);
    console.log("──────────────────────────────────────────────────");
    console.log("  Press Ctrl+C to stop the UI server.");
    console.log("");

    if (!noOpen && config.autoOpen) {
      openBrowser(url);
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`✗ Port ${port} is already in use. Try passing a different port: --port=${port + 1}`);
    } else {
      console.error(`✗ Failed to start UI server: ${err.message}`);
    }
  });
}
