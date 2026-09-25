import { runImageUICommand } from "./commands/image-ui.js";

console.log("🧪 Launching KDS Image UI in standalone test mode...");

runImageUICommand({
  flags: [],
  root: process.cwd(),
});
