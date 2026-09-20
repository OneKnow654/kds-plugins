import { runImageCommand } from "./commands/image.js";

function parseSubArgs(args = []) {
    const rawSubArgs = args[0] === "image" ? args.slice(1) : args;
    const subArgs = [];
    const subFlags = [];

    for (let i = 0; i < rawSubArgs.length; i++) {
        const arg = rawSubArgs[i];
        if (arg.startsWith("-")) {
            subFlags.push(arg);
            if (
                ["--format", "--quality", "--width", "--height", "--output"].includes(arg) &&
                i + 1 < rawSubArgs.length &&
                !rawSubArgs[i + 1].startsWith("-")
            ) {
                subFlags.push(rawSubArgs[i + 1]);
                i++;
            }
        } else {
            subArgs.push(arg);
        }
    }

    return { subArgs, subFlags };
}

export default function initPlugin({
    registerCommand,
    root,
}) {
    registerCommand({
        name: "image",
        description: "Convert, compress, and process images",

        async run({ action, value, args = [], flags = [], root: commandRoot }) {
            const { subArgs, subFlags } = parseSubArgs(args);

            return runImageCommand({
                args: subArgs,
                flags: subFlags,
                root: commandRoot ?? root,
            });
        },
    });
}
