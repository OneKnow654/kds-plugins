# KDS Image UI Plugin (`kds image-ui`)

An interactive Web Studio dashboard built on top of the KDS Image CLI for visual image conversion, real-time quality compression, side-by-side preview comparisons, workspace file scanning, multi-file **Batch Processing**, and customizable **Save Location & Plugin Configuration** with a modern **FluidMinimal** design theme.

---

## ✨ Features

- 🎨 **FluidMinimal Theme & Tailwind CSS**: Modern dark background (`zinc-950`), translucent glassmorphic cards (`zinc-900/60`), subtle ambient glow gradients (`indigo`/`violet`), and clean Inter typography.
- ⚙️ **Configurable Save Location & Settings**: Configure save directory (e.g., `.kds/output` or custom path), default format, default quality, server port, and auto-open preferences directly from UI or `.kds/image-ui.config.json`.
- 📦 **Batch Processing Queue**: Drag & drop multiple images or add them into a unified queue with itemized status tracking (`Pending`, `Processing`, `Done`, `Failed`).
- 🎛️ **Global & Individual Controls**: Apply global target format/quality presets across all batch items or customize options per item.
- ⚡ **Real-Time Live Previews**: Side-by-side visual comparison between original image and processed output in Single Studio mode.
- 📉 **Instant Size Savings & Summary**: Live calculation of total original size, total optimized size, and overall percentage reduction.
- 🔄 **Multi-Format Support**: WebP, AVIF, ICO, PNG, JPEG.
- 📐 **Dimension Resizing**: Width and height controls with proportional aspect ratio preservation.
- 🔍 **Workspace Image Scanner**: Automatically scans project workspace for image files.
- 📥 **One-Click Batch Output**: Save individual files or batch process and save all output images directly to your configured save location.

---

## 🚀 Installation & Usage

### 1. Install via KDS Plugin Manager
```bash
kds plugin install image-ui
```

### 2. Launch the Web Studio UI
```bash
kds image-ui
```
*Alias shortcuts:*
```bash
kds iui
kds img-ui
```

### 3. Command Flags
- `--port=4500`: Specify custom port for Web UI server.
- `--no-open`: Start UI server without automatically opening the default browser.

```bash
kds image-ui --port=8080 --no-open
```

---

## 📁 Directory Structure

```text
image-ui/
├── index.js                  # Main plugin entry point (registers `kds image-ui`)
├── package.json              # Package definition and dependencies (sharp, sharp-ico)
├── README.md                 # Documentation
├── commands/
│   └── image-ui.js           # Server launcher & browser opener
├── helpers/
│   ├── config.js             # Configuration loader & persistence helper
│   └── image.js              # Sharp image conversion & metadata engine
└── server/
    ├── app.js                # Native HTTP server & REST API endpoints (/api/config)
    └── static/
        ├── index.html        # FluidMinimal HTML dashboard with Settings modal
        ├── style.css         # Custom slider & scrollbar tweaks
        └── app.js            # Frontend single, batch & config management engine
```

---

## ⚙️ Configuration (`.kds/image-ui.config.json`)

Configuration is persisted in your project workspace at `.kds/image-ui.config.json` and can be edited via the interactive **⚙️ Settings** modal in the UI or directly via JSON:

```json
{
  "port": 4500,
  "autoOpen": true,
  "defaultQuality": 80,
  "defaultFormat": "webp",
  "saveLocation": ".kds/output"
}
```
