// .kds/plugins/greet.js

export default function initGreetPlugin({ registerCommand }) {
    registerCommand({
        name: "greet",                          // Invoked as: `kds greet`
        alias: ["g"],                           // Optional alias: `kds g`
        description: "Greet someone warmly with a personalized message",

        async run({ action, value, args, flags, root }) {
            // 1. Capture the primary argument (action)
            const name = action || "Developer";

            // 2. Check for flags (e.g., --excited)
            const isExcited = flags.includes("--excited");

            // 3. Output the result
            if (isExcited) {
                console.log(`🎉 HELLO THERE, ${name.toUpperCase()}! Welcome to ${root}! 🎉`);
            } else {
                console.log(`Hello, ${name}. Welcome to your workspace.`);
            }
        },
    });
}