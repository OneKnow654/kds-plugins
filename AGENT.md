Yes — for an AI coding agent, you want a **strict development contract**, not just documentation. The AI should treat these rules as mandatory whenever it creates, modifies, reviews, or tests a KDS plugin.

 # KDS CLI Plugin Development Rules

 You are a coding AI responsible for developing plugins for `kds-cli` (`kds`).

 These rules are **mandatory**. Treat them as the development contract for every KDS plugin task.

 Do not ignore, bypass, or replace these rules unless the user explicitly provides updated KDS plugin API documentation.

---

 # 1\. Core Principle

 A KDS plugin must extend `kds-cli` through the official plugin API.

 **Never modify the KDS CLI core to implement plugin functionality.**

 Plugins must use:

```
registerCommand()
registerGenerator()
registerHook()
```

 through the plugin initialization context.

 The plugin should remain independently understandable, testable, and removable.

---

 # 2\. Mandatory Plugin Initialization

 Every plugin MUST export an initialization function.

 Supported forms:

```
export default function initPlugin(context) {
}
```

 or:

```
export function init(context) {
}
```

 or:

```
export function register(context) {
}
```

 The preferred form is:

```
export default function initPlugin({
  registerCommand,
  registerGenerator,
  registerHook,
  pluginManager,
  root,
}) {
}
```

 Do not create a plugin that exports unrelated functions without an initialization entry point.

---

 # 3\. Plugin Type Rules

 Before writing code, determine what type of functionality is required.

 ## Use `registerCommand()` when:

 The user wants a new top-level command:

```
kds deploy
kds seed
kds format
kds db:migrate
```

 Example:

```
registerCommand({
  name: "deploy",
  description: "Deploy the application",

  async run({ args, flags, root }) {
    // implementation
  },
});
```

---

 ## Use `registerGenerator()` when:

 The functionality creates project code/files through:

```
kds create <target>
```

 Example:

```
kds create store User
```

 Implementation:

```
registerGenerator({
  name: "store",
  description: "Generate a state store",

  async run({ name, options, args, flags, root }) {
    // implementation
  },
});
```

---

 ## Use `registerHook()` when:

 The functionality needs to execute during the CLI lifecycle.

 Example:

```
registerHook(
  "beforeCommand",
  async ({ command, action, args, flags }) => {
    // implementation
  }
);
```

 Do not use a lifecycle hook when a normal command or generator is more appropriate.

---

 # 4\. Plugin Location Rules

 KDS resolves plugins in this priority:

```
1. ./.kds/plugins/
2. ~/.kds/plugins/
3. node_modules/
```

 For project-specific development, prefer:

```
.kds/plugins/
```

 For globally reusable plugins:

```
~/.kds/plugins/
```

 For distributable npm plugins:

```
node_modules/kds-plugin-*/
```

 Never put project plugins in arbitrary directories and expect KDS to discover them automatically.

---

 # 5\. Plugin Structure Rules

 Choose the smallest structure that is appropriate.

 ## Simple plugin

 Use:

```
.kds/plugins/
└── my-plugin.js
```

 Use this when the plugin is small and self-contained.

---

 ## Multi-file plugin

 Use:

```
.kds/plugins/
└── my-plugin/
    ├── index.js
    ├── helpers.js
    └── config.json
```

 Use this when the plugin has reusable logic, configuration, or multiple implementation files.

---

 ## Complex plugin

 Use:

```
.kds/plugins/
└── my-plugin/
    ├── index.js
    ├── commands/
    ├── generators/
    ├── helpers/
    ├── templates/
    ├── config.json
    └── package.json
```

 Only create directories that are actually needed.

 Do not create unnecessary architecture.

---

 # 6\. Entry Point Rule

 For directory plugins, the entry point should normally be:

```
index.js
```

 Other supported entry files may include:

```
index.mjs
plugin.js
main.js
```

 If a `package.json` exists, respect its:

```
"main"
```

 or:

```
"module"
```

 field.

 The entry point is responsible primarily for plugin registration.

 Prefer:

```
export default function initPlugin({
  registerCommand,
  registerGenerator,
}) {
  registerCommand(...);
  registerGenerator(...);
}
```

 Avoid putting large amounts of business logic directly inside `index.js`.

---

 # 7\. Separation of Responsibilities

 For a multi-file plugin:

```
index.js
```

 should primarily handle:

 - Plugin initialization
- Command registration
- Generator registration
- Hook registration

 Implementation logic should be moved into:

```
helpers/
commands/
generators/
services/
templates/
```

 when appropriate.

 For example:

```
my-plugin/
├── index.js
├── commands/
│   └── deploy.js
├── generators/
│   └── store.js
└── helpers/
    └── filesystem.js
```

 Do not turn `index.js` into a large monolithic file when the plugin becomes complex.

---

 # 8\. Project Root Rule

 Always use the provided:

```
root
```

 to access the user's project.

 Example:

```
import path from "node:path";

const filePath = path.join(
  root,
  "src",
  "stores",
  "userStore.ts"
);
```

 Never hardcode:

```
/home/user/project
/Users/name/project
C:\Users\name\project
```

 The plugin must work from any project location.

---

 # 9\. File System Rules

 When creating directories, use recursive directory creation:

```
await fs.mkdir(directory, {
  recursive: true,
});
```

 When writing files:

```
await fs.writeFile(
  filePath,
  content,
  "utf-8"
);
```

 Always ensure the destination directory exists before writing.

 Do not silently overwrite important existing files unless the plugin explicitly supports an overwrite option.

---

 # 10\. Generator Safety Rules

 Generators modify the user's project.

 Therefore:

 - Validate required names.
- Validate paths.
- Avoid accidental destructive operations.
- Do not delete unrelated files.
- Do not overwrite existing files silently when doing so could destroy user work.
- Prefer explicit `--force` behavior for overwriting.

 Example:

```
if (!name) {
  throw new Error(
    "Usage: kds create store <Name>"
  );
}
```

 For potentially destructive operations:

```
if (!flags.includes("--force")) {
  // refuse overwrite
}
```

---

 # 11\. Naming Rules

 Plugin names should be descriptive.

 Good:

```
deploy
auth
prisma
zustand
database-tools
api-generator
```

 Bad:

```
plugin1
test
thing
custom
abc
```

 For npm plugins, use:

```
kds-plugin-<name>
```

 Example:

```
kds-plugin-prisma
kds-plugin-auth
kds-plugin-zustand
```

 Scoped packages may use:

```
@company/kds-plugin-auth
```

---

 # 12\. Command Naming Rules

 Commands should describe an action.

 Good:

```
kds deploy
kds seed
kds format
kds db:migrate
```

 Avoid unnecessary abbreviations.

 Aliases may be provided when useful:

```
alias: ["sd"]
```

 Do not create aliases that conflict with existing KDS commands.

---

 # 13\. Generator Naming Rules

 Generators should represent the thing being generated.

 Examples:

```
kds create store User
kds create page Dashboard
kds create service UserService
kds create controller User
```

 The generator must validate the required name.

---

 # 14\. Argument and Flag Rules

 Use the parameters supplied by KDS:

 For commands:

```
{
  action,
  value,
  args,
  flags,
  root
}
```

 For generators:

```
{
  name,
  options,
  args,
  flags,
  root
}
```

 Do not invent undocumented parameters.

 If the plugin requires functionality that depends on an undocumented API, stop and clearly identify the missing API instead of pretending it exists.

---

 # 15\. Do Not Invent KDS APIs

 This is a critical rule.

 Only use documented APIs:

```
registerCommand
registerGenerator
registerHook
pluginManager
root
```

 Do not assume KDS supports APIs such as:

```
registerMiddleware()
registerService()
registerRoute()
registerTemplate()
registerConfig()
```

 unless the actual KDS implementation/documentation confirms them.

 If a required capability is not documented, say:

```
The requested behavior requires a KDS API that is not present in the provided plugin specification.
```

 Then identify what API would be required.

---

 # 16\. Dependency Rules

 Do not add dependencies unless they are actually required.

 Prefer Node.js built-ins when sufficient:

```
node:path
node:fs
node:fs/promises
node:child_process
```

 For example:

```
import path from "node:path";
import fs from "node:fs/promises";
```

 If an external dependency is necessary:

 1. Explain why.
2. Add it to `package.json`.
3. Do not assume it is already installed.

---

 # 17\. Generated Code Rules

 If a generator creates source files:

 - Generate valid code.
- Follow the target project's existing conventions when known.
- Preserve formatting conventions.
- Use appropriate file extensions.
- Avoid hardcoded absolute paths.
- Make generated names deterministic.
- Avoid unnecessary generated files.

 For example:

```
src/
└── stores/
    └── userStore.ts
```

 is preferable to generating files in arbitrary locations.

---

 # 18\. Existing Project Rules

 Before generating files, inspect the project when possible.

 Look for:

```
package.json
tsconfig.json
src/
app/
pages/
components/
```

 and existing project conventions.

 If the project already has:

```
src/stores/
```

 use that convention rather than inventing:

```
src/state/
```

 Do not restructure the user's project unnecessarily.

---

 # 19\. Template Rules

 For plugins that generate files from templates, keep templates separate from implementation code.

 Example:

```
my-plugin/
├── index.js
├── generators/
│   └── store.js
└── templates/
    └── store.ts
```

 Do not put large template strings directly into `index.js` when a dedicated template file would make the plugin easier to maintain.

 For very small templates, inline strings are acceptable.

---

 # 20\. Configuration Rules

 If configuration is required, isolate it.

 Example:

```
my-plugin/
├── index.js
├── config.json
└── helpers.js
```

 Do not hardcode large configuration structures throughout the plugin.

 Configuration should be easy to locate and modify.

---

 # 21\. Error Handling

 Errors must be understandable to the developer.

 Bad:

```
throw new Error("Error");
```

 Better:

```
throw new Error(
  "Store name is required. Usage: kds create store <Name>"
);
```

 When a file already exists:

```
File already exists: src/stores/userStore.ts
Use --force to overwrite it.
```

 Do not swallow errors silently.

 Avoid:

```
try {
  // ...
} catch {
}
```

 unless there is a deliberate reason to ignore the error.

---

 # 22\. Logging Rules

 CLI output should clearly communicate what happened.

 Good:

```
✓ Created src/stores/userStore.ts
✓ Registered authentication generator
✗ Failed to create src/services/userService.ts
```

 Avoid excessive logging.

 Do not print sensitive information such as:

 - Passwords
- API keys
- Tokens
- Secrets
- Environment credentials

---

 # 23\. Testing Rules

 Every plugin implementation must include a testing strategy.

 At minimum, test:

```
kds plugin list
```

 Then test the plugin's actual functionality.

 For a command:

```
kds deploy
```

 For a generator:

```
kds create store User
```

 For flags:

```
kds deploy --prod
```

 Verify:

 - Plugin discovery
- Command/generator registration
- Argument handling
- Flag handling
- Generated files
- Error handling
- Existing-file behavior

---

 # 24\. Plugin Discovery Verification

 After creating a plugin, always verify:

```
kds plugin list
```

 The plugin should appear in the active plugin list.

 If it does not appear:

 1. Check the plugin location.
2. Check the entry point.
3. Check the export.
4. Check syntax errors.
5. Check package resolution.
6. Check the plugin name.
7. Check the KDS CLI version/API.

 Do not claim that a plugin works if discovery has not been verified.

---

 # 25\. Repository Rules

 A repository containing multiple plugins should follow:

```
your-plugins-repo/
├── README.md
├── plugins.json
└── plugins/
```

 All plugins should live under:

```
plugins/
```

 Example:

```
plugins/
├── deploy.js
├── auth-module/
│   ├── index.js
│   ├── helpers.js
│   └── config.json
└── prisma/
    ├── index.js
    └── helpers.js
```

 Do not mix unrelated repository files directly into `plugins/`.

---

 # 26\. README Rules

 Every distributable plugin should have documentation.

 Document:

 - Plugin name
- Purpose
- Installation
- Commands
- Generators
- Arguments
- Flags
- Examples
- Generated files
- Configuration
- Requirements
- Development/testing instructions

 Example:

```
# KDS Prisma Plugin

Adds Prisma-related commands to KDS.

## Installation

npm install --save-dev kds-plugin-prisma

## Usage

kds db:migrate

## Commands

kds db:migrate
```

---

 # 27\. `plugins.json` Rule

 When working with a plugin repository that uses a plugin registry, maintain:

```
plugins.json
```

 at the repository root.

 Keep plugin metadata consistent with the actual plugin files.

 Do not advertise a plugin in the registry if its implementation does not exist.

---

 # 28\. NPM Plugin Rules

 For npm-distributed plugins:

```
kds-plugin-<name>
```

 should be the package naming convention.

 The package should include:

```
package.json
README.md
entry point
```

 Example:

```
kds-plugin-prisma/
├── package.json
├── README.md
└── index.js
```

 `package.json` should identify the plugin entry point:

```
{
  "name": "kds-plugin-prisma",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}
```

---

 # 29\. Backward Compatibility Rule

 Do not assume the user's installed KDS version supports functionality beyond the provided API.

 When introducing a feature:

 - Check the documented API.
- Preserve existing plugin behavior.
- Avoid changing command names unnecessarily.
- Avoid breaking existing generators.
- Avoid changing generated file formats without a reason.

---

 # 30\. Minimal Architecture Rule

 Do not over-engineer plugins.

 If the plugin only needs one file:

```
my-plugin.js
```

 do not create:

```
commands/
services/
repositories/
controllers/
adapters/
factories/
```

 for no reason.

 Architecture should grow with actual complexity.

---

 # 31\. Maintainability Rule

 A developer unfamiliar with the plugin should be able to understand:

```
What does this plugin do?
Where is it registered?
Where is the command implementation?
Where are generated files defined?
Where is configuration stored?
How do I test it?
```

 The folder structure should make these answers obvious.

---

 # 32\. Modification Rules

 When modifying an existing plugin:

 1. Inspect the current implementation first.
2. Preserve existing functionality.
3. Follow the existing plugin's conventions.
4. Make the smallest reasonable change.
5. Do not rewrite unrelated files.
6. Do not introduce unnecessary dependencies.
7. Test the affected functionality.
8. Check that existing commands/generators still work.

---

 # 33\. New Plugin Development Workflow

 Always follow this workflow:

```
Step 1
Understand the requested functionality.

        ↓

Step 2
Determine:
Command / Generator / Hook

        ↓

Step 3
Choose:
Single-file / Directory / NPM

        ↓

Step 4
Inspect existing project conventions.

        ↓

Step 5
Design the folder structure.

        ↓

Step 6
Create the plugin entry point.

        ↓

Step 7
Register the required command/generator/hook.

        ↓

Step 8
Implement the functionality.

        ↓

Step 9
Add helpers/templates/configuration if needed.

        ↓

Step 10
Validate errors and edge cases.

        ↓

Step 11
Run plugin discovery.

        ↓

Step 12
Run the actual plugin command/generator.

        ↓

Step 13
Verify generated/modified files.

        ↓

Step 14
Document usage.
```

---

 # 34\. Mandatory Final Checklist

 Before considering a KDS plugin task complete, verify every applicable item:

 ### Plugin API

 - [ ] Plugin exports an initialization function.
- [ ] Correct KDS registration API is used.
- [ ] No undocumented KDS API is assumed.
- [ ] `root` is used for project-relative paths.

 ### Structure

 - [ ] Plugin is in a supported discovery location.
- [ ] Entry point is valid.
- [ ] Structure is no more complex than necessary.
- [ ] Multi-file logic is appropriately separated.

 ### Commands

 - [ ] Command name is clear.
- [ ] Arguments are validated.
- [ ] Flags are handled correctly.
- [ ] Errors are understandable.

 ### Generators

 - [ ] Generator name is clear.
- [ ] Required `name` is validated.
- [ ] Output paths are correct.
- [ ] Directories are created when required.
- [ ] Existing files are handled safely.
- [ ] Generated code is valid.

 ### Filesystem

 - [ ] No hardcoded project paths.
- [ ] No accidental destructive operations.
- [ ] No unrelated files are modified.

 ### Dependencies

 - [ ] Dependencies are actually necessary.
- [ ] New dependencies are documented.
- [ ] Node built-ins are preferred when appropriate.

 ### Testing

 - [ ] `kds plugin list` was checked.
- [ ] Plugin command/generator was tested.
- [ ] Error cases were considered.
- [ ] Generated files were verified.

 ### Documentation

 - [ ] Usage is documented.
- [ ] Commands/generators are documented.
- [ ] Installation is documented when applicable.
- [ ] Repository metadata is consistent.

---

 # 35\. Hard Rules

 The following rules must **never** be violated unless the user explicitly provides new KDS documentation that changes them:

 1. **Do not modify KDS core to implement a plugin.**
2. **Do not invent undocumented plugin APIs.**
3. **Every plugin must have an initialization entry point.**
4. **Use `registerCommand` for top-level commands.**
5. **Use `registerGenerator` for `kds create` functionality.**
6. **Use `registerHook` for lifecycle behavior.**
7. **Use `root` for project-relative filesystem operations.**
8. **Do not hardcode the user's project path.**
9. **Do not silently destroy or overwrite user files.**
10. **Validate generator names and required arguments.**
11. **Do not add unnecessary dependencies.**
12. **Keep simple plugins simple.**
13. **Separate complex plugin logic into appropriate modules.**
14. **Verify plugin discovery with `kds plugin list`.**
15. **Test the actual command or generator before declaring the implementation complete.**
16. **Do not claim functionality was tested if it was not actually tested.**
17. **Do not create files or folders that are not needed.**
18. **Preserve existing project conventions whenever possible.**
19. **Do not modify unrelated project code.**
20. **When the documented API is insufficient, identify the limitation instead of inventing an API.**

---

 # 36\. AI Response Format for Plugin Tasks

 When implementing a new KDS plugin, structure the response as:

```
1. Implementation summary

2. Folder structure

3. Plugin files

4. Installation/setup

5. Usage

6. Testing

7. Verification checklist
```

 For example:

```
Implementation summary:
This plugin is implemented as a generator because it creates project files.

Folder structure:

.kds/plugins/store/
├── index.js
└── templates/
    └── store.ts

Usage:

kds create store User

Testing:

kds plugin list
kds create store User
```

 Do not provide unnecessary architecture or unrelated explanations.

---

 # 37\. Priority of Rules

 When multiple requirements exist, follow this priority:

```
1. Actual KDS CLI API/documentation
2. Existing project conventions
3. These development rules
4. User's requested implementation details
5. AI architectural preferences
```

 The AI's personal preference must never override the actual KDS API or existing project requirements.

---

 # 38\. Official Registered Plugins & Installation

 The repository `kds-plugins` maintains official KDS plugins available via the online registry:

 ### Available Plugins
 1. **`greet`** (`type: "file"`)
    - Description: Demo greet command (`kds greet`)
    - Installation: `kds plugin install greet`

 2. **`image`** (`type: "folder"`)
    - Description: Image processing CLI (`kds image convert`, `kds image compress`)
    - Installation: `kds plugin install image`

 3. **`image-ui`** (`type: "folder"`)
    - Description: Visual Web Studio dashboard (`kds image-ui`, `kds iui`, `kds img-ui`)
    - Installation: `kds plugin install image-ui`
    - Options: `--port=4500`, `--no-open`

 ### Agent Verification Workflow for `image-ui`:
 ```bash
 # 1. Discover online registry plugins
 kds plugin list --online

 # 2. Install image-ui plugin (automatically fetches 10 files and runs npm install)
 kds plugin install image-ui

 # 3. Verify loaded active plugins
 kds plugin list

 # 4. Test Web UI dashboard server launch
 kds image-ui --no-open
 ```

---

 # FINAL INSTRUCTION

 Treat this document as a **persistent development contract for KDS CLI plugin development**.

 Before creating or modifying any KDS plugin, mentally validate the planned implementation against these rules.

 After implementation, perform the mandatory checklist.

 If a requested implementation conflicts with these rules, do not silently violate the rules. Explain the specific conflict and use the closest compliant implementation.

 The goal is:

 **Correct KDS API → Minimal architecture → Safe file operations → Maintainable structure → Tested plugin → Clear documentation.**

 This is the version I’d use as the **“Rules / Instructions” layer** for a coding AI. It is stricter than the original guide because it tells the AI not only _what KDS supports_, but also **how it must behave while developing plugins and what it must verify before declaring the work complete**.