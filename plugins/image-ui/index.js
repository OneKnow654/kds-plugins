import { runImageUICommand } from "./commands/image-ui.js";

export default function initPlugin({ registerCommand, root }) {
  registerCommand({
    name: "image-ui",
    alias: ["iui", "img-ui"],
    description: "Launch interactive Web UI dashboard for visual image conversion, compression & preview",

    async run({ flags = [], root: commandRoot }) {
      return runImageUICommand({
        flags,
        root: commandRoot ?? root,
      });
    },
  });
}
