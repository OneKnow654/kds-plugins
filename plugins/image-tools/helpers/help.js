export function showHelp() {
    console.log(`
KDS Image Tools

Usage:
  kds image <command> <input> [options]

Commands:

  convert <input>
      Convert an image to another format.

  compress <input>
      Compress an image.

  remove-bg <input>
      Remove the background from an image.

  config
      Show image plugin configuration.

  help
      Show this help message.

Conversion:

  kds image convert photo.jpg --format webp
  kds image convert photo.jpg --format avif
  kds image convert photo.jpg --format ico

Compression:

  kds image compress photo.jpg
  kds image compress photo.jpg --quality 80
  kds image compress photo.jpg --format webp --quality 75

Options:

  --format <format>
      Output format:
      webp, avif, ico

  --quality <1-100>
      Output quality.

  --width <pixels>
      Resize output width.

  --height <pixels>
      Resize output height.

  --output <path>
      Output file or directory.

  --force
      Allow overwriting an existing file.

  --lossless
      Use lossless compression when supported.

  --help
      Show help.

Examples:

  kds image help
  kds image convert ./photo.jpg --format webp
  kds image convert ./photo.jpg --format avif --quality 70
  kds image convert ./logo.png --format ico
  kds image compress ./photo.jpg --quality 75
  kds image compress ./photo.jpg --format webp --quality 80
  kds image convert ./photo.jpg \\
      --format webp \\
      --quality 80 \\
      --width 1600

Notes:

  Existing files are never overwritten unless --force is supplied.
`);
}
