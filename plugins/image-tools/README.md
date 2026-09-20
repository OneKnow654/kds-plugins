KDS Image Plugin

Image conversion and compression tools for kds-cli
 projects.

The plugin adds a single image command to KDS with support for:

Image conversion

WebP output

AVIF output

ICO output

Image compression

Quality control

Image resizing

Safe file overwriting

Persistent image configuration

Built-in help

Background removal is planned but is not yet implemented.

Features
Image conversion

Convert supported images to:

WebP

AVIF

ICO

Examples:

kds image convert photo.jpg --format webp

kds image convert photo.jpg --format avif --quality 70

kds image convert logo.png --format ico

Image compression

Compress an image while controlling output quality:

kds image compress photo.jpg --quality 75


Convert and compress to another format:

kds image compress photo.jpg --format webp --quality 80

Image resizing

Resize an image while converting it:

kds image convert photo.jpg \
  --format webp \
  --quality 80 \
  --width 1600


You can also specify height:

kds image convert photo.jpg \
  --format webp \
  --width 1600 \
  --height 900


The plugin avoids enlarging images when resizing.

Safe overwriting

Existing files are not overwritten by default.

If the output file already exists, the plugin reports:

File already exists: photo.webp
Use --force to overwrite it.


To explicitly overwrite:

kds image convert photo.jpg --format webp --force

Installation
Local KDS plugin

Place the plugin inside the project's KDS plugin directory:

.kds/
└── plugins/
    └── image/
        ├── index.js
        ├── package.json
        ├── commands/
        │   └── image.js
        └── helpers/
            ├── image.js
            ├── config.js
            └── help.js


Then install the plugin dependencies:

cd .kds/plugins/image
npm install


KDS should discover the plugin automatically from:

.kds/plugins/


Verify discovery:

kds plugin list


The image plugin should appear in the active plugin list.

Requirements

The plugin requires:

kds-cli

Node.js 20.9 or newer

sharp

sharp-ico

The image-processing functionality is implemented using Sharp.

Sharp provides image processing support for formats including JPEG, PNG, WebP and AVIF.

Usage

The main command is:

kds image


Show the help menu:

kds image help


or:

kds image --help

Commands
kds image convert

Convert an image to another format.

Syntax
kds image convert <input> --format <format>

WebP
kds image convert photo.jpg --format webp


Output:

photo.webp

AVIF
kds image convert photo.jpg --format avif


Output:

photo.avif

ICO
kds image convert logo.png --format ico


Output:

logo.ico

Compression
kds image compress

Compress an image.

Basic usage
kds image compress photo.jpg


The default format and quality are taken from the plugin configuration.

Specify quality
kds image compress photo.jpg --quality 75


Quality must be between:

1-100

Convert while compressing
kds image compress photo.jpg \
  --format webp \
  --quality 80


The command reports the original and resulting file sizes:

✓ Compressed photo.jpg
  Size: 2.40 MB → 486.2 KB
  Saved: 80.2%
  Output: photo.webp

Quality

The --quality option controls output quality.

Example:

kds image convert photo.jpg \
  --format webp \
  --quality 80


Lower values generally produce smaller files with lower visual quality.

Higher values generally produce larger files with higher visual quality.

Valid values:

1-100


Example:

--quality 60
--quality 75
--quality 80
--quality 90

Resize

Images can be resized during conversion.

Width
kds image convert photo.jpg \
  --format webp \
  --width 1200

Height
kds image convert photo.jpg \
  --format webp \
  --height 800

Width and height
kds image convert photo.jpg \
  --format webp \
  --width 1200 \
  --height 800


The plugin uses proportional resizing and avoids enlarging smaller images.

Output

Use --output to control the output location.

Example:

kds image convert photo.jpg \
  --format webp \
  --output ./dist


The resulting file will be:

dist/photo.webp


You can also specify an exact output filename:

kds image convert photo.jpg \
  --format webp \
  --output ./dist/product.webp

Lossless Compression

Where supported, use:

kds image convert photo.png \
  --format webp \
  --lossless


or:

kds image compress photo.png \
  --format webp \
  --lossless


Lossless output generally produces larger files than lossy compression.

Force Overwrite

The plugin protects existing files by default.

For example:

kds image convert photo.jpg --format webp


If:

photo.webp


already exists, the operation fails safely.

To overwrite:

kds image convert photo.jpg \
  --format webp \
  --force

Configuration

The plugin supports persistent configuration.

Configuration is stored in the project at:

.kds/image.config.json


Default configuration:

{
  "quality": 80,
  "format": "webp",
  "overwrite": false,
  "preserveMetadata": false
}


View the current configuration:

kds image config


Example output:

KDS Image Configuration

Quality: 80
Format: webp
Overwrite: false
Preserve metadata: false


Command-line options can override configuration values for individual operations.

For example, if the default quality is:

{
  "quality": 80
}


you can temporarily use:

kds image convert photo.jpg \
  --format avif \
  --quality 65


without changing the configuration.

Supported Output Formats
Format	Supported
WebP	Yes
AVIF	Yes
ICO	Yes

The plugin may accept additional input formats supported by the underlying image-processing engine.

Output formats are intentionally restricted to formats explicitly supported by the plugin.

Background Removal

Background removal is planned for a future version.

The intended command is:

kds image remove-bg <input>


However, the current version does not implement background removal.

The feature requires an actual background-removal/segmentation engine. The plugin will not claim to provide background removal until a supported implementation is integrated.

Future configuration may look similar to:

{
  "backgroundRemoval": {
    "provider": "local"
  }
}


Possible future providers could include a local model or another explicitly supported processing backend.

Help

Display the complete command help:

kds image help


The help menu covers:

Available commands

Conversion

Compression

Quality

Resize options

Output options

Force overwrite

Examples

You can also use:

kds image --help

Examples
Convert JPG to WebP
kds image convert photo.jpg --format webp

Convert JPG to AVIF
kds image convert photo.jpg --format avif

Convert PNG to ICO
kds image convert logo.png --format ico

Compress JPEG
kds image compress photo.jpg --quality 75

Convert and resize
kds image convert photo.jpg \
  --format webp \
  --quality 80 \
  --width 1600

Save to another directory
kds image convert photo.jpg \
  --format webp \
  --output ./dist

Overwrite an existing file
kds image convert photo.jpg \
  --format webp \
  --force

View configuration
kds image config

Show help
kds image help

Plugin Architecture

The plugin follows the KDS plugin API and uses a single top-level command:

image


The entry point is:

index.js


The command implementation is separated into:

commands/


Image-processing helpers are contained in:

helpers/


The structure is intentionally kept small so the plugin remains easy to understand and maintain.

Project Structure
image/
├── index.js
├── package.json
├── commands/
│   └── image.js
└── helpers/
    ├── image.js
    ├── config.js
    └── help.js

Development

Install dependencies:

npm install


Make the plugin available to the development KDS project under:

.kds/plugins/image/


Verify plugin discovery:

kds plugin list


Run the help command:

kds image help


Test conversion:

kds image convert ./test.jpg --format webp


Test AVIF:

kds image convert ./test.jpg --format avif --quality 70


Test ICO:

kds image convert ./test.png --format ico


Test compression:

kds image compress ./test.jpg --quality 75


Test overwrite protection:

kds image convert ./test.jpg --format webp


Run the same command again and verify that the existing output file is protected.

Then test explicit overwrite:

kds image convert ./test.jpg \
  --format webp \
  --force

Error Handling

The plugin validates:

Missing input files

Missing image names

Unsupported output formats

Invalid quality values

Invalid width values

Invalid height values

Existing output files

Unknown command options

Examples of errors:

Input file does not exist: ./missing.jpg

Unsupported output format: bmp
Supported formats: webp, avif, ico

Quality must be between 1 and 100.

File already exists: ./photo.webp
Use --force to overwrite it.

Safety

The plugin follows these principles:

Never hardcode the user's project path.

Use KDS-provided root for project-relative paths.

Do not overwrite files silently.

Require --force for explicit overwriting.

Create required directories recursively.

Do not delete unrelated files.

Validate user-provided values.

Do not expose credentials or sensitive information.

Do not claim unsupported functionality.

Roadmap

Planned features:

 Background removal

 Batch image conversion

 Recursive directory processing

 Improved configuration commands

 Per-format quality settings

 WebP effort settings

 AVIF effort settings

 Metadata controls

 Dry-run mode

 Image information command

 Progress reporting

 Automated test suite

 NPM distribution

Potential future commands:

kds image info <input>
kds image resize <input>
kds image optimize <input>
kds image remove-bg <input>

License

Add the project's chosen license here.

For example:

MIT


if the plugin is released under the MIT license.