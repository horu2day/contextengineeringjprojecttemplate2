# Babylon.js Gaussian Splatting Viewer

A web-based 3D viewer for Gaussian Splatting data (.splat and .ply files) built with Babylon.js.

![Babylon.js](https://img.shields.io/badge/Babylon.js-8.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- ✅ Load and render `.splat` and `.ply` Gaussian Splatting files
- ✅ **Drag & Drop** file loading - just drag .splat or .ply files onto the viewer!
- ✅ **File Upload Button** - click to browse and load models from your computer
- ✅ Interactive 3D camera controls (rotate, zoom, pan)
- ✅ Click to display world coordinates of picked points
- ✅ Responsive full-viewport canvas
- ✅ Clean, modern UI with info overlay
- ✅ Automatic cleanup of previous models when loading new ones

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The viewer will automatically open in your default browser at `http://localhost:8080`.

## Usage

### Controls

- **Left Mouse Button**: Rotate camera
- **Mouse Wheel**: Zoom in/out
- **Right Mouse Button**: Pan camera
- **Click on Model**: Display world coordinates

### Loading Custom Models

**Method 1: Drag & Drop (Recommended)**
1. Simply drag any `.splat` or `.ply` file from your computer
2. Drop it anywhere on the viewer window
3. The model will automatically load and replace the current one

**Method 2: File Upload Button**
1. Click the "📁 Load Model" button in the top-right corner
2. Browse and select a `.splat` or `.ply` file from your computer
3. The model will load automatically

**Method 3: Place in Assets Folder**
1. Place your `.splat` or `.ply` file in the `assets/` folder
2. It will be loaded automatically on startup (edit `src/main-global.js:106` to change default file)

## Project Structure

```
babygaussianviewer/
├── src/
│   ├── main.js          # Application entry point
│   ├── viewer.js        # Core viewer logic
│   └── utils.js         # Utility functions (coordinate picking)
├── styles/
│   └── main.css         # Styling
├── assets/
│   └── train.splat      # Example Gaussian Splatting model (11MB)
├── index.html           # HTML entry point
└── package.json         # Dependencies
```

## Technical Details

### Dependencies

- **@babylonjs/core** (^8.0.0): Core rendering engine
- **@babylonjs/loaders** (^8.0.0): .splat/.ply file loaders
- **http-server** (^14.1.1): Development server

### Architecture

- **ES6 Modules**: Uses modern JavaScript `import/export`
- **Async Loading**: Non-blocking file loading with proper error handling
- **Left-Handed Coordinate System**: Required for Gaussian Splatting (Babylon.js default)

### Key Implementation Notes

1. **Coordinate System**: Gaussian Splatting only supports left-handed systems (don't set `scene.useRightHandedSystem = true`)
2. **Module Loading**: `@babylonjs/loaders` must be imported as side-effect for .splat support
3. **Canvas Resize**: Manual resize handling required via `engine.resize()`
4. **Memory Management**: Proper cleanup on page unload to prevent leaks

## Known Issues

- Some `.splat` files may exhibit rendering artifacts (see [Babylon.js forum](https://forum.babylonjs.com/t/corrupted-rendering-of-gaussian-splattings/60494))
- Right-handed coordinate system not supported (see [forum discussion](https://forum.babylonjs.com/t/gaussian-splatting-does-not-support-right-handed-system/50260))

## Development

### Debug Mode

Add `?debug` to the URL to enable FPS display in console:
```
http://localhost:8080?debug
```

### Project Commands

```bash
# Development server (auto-open browser, no caching)
npm run dev

# Production server (with caching)
npm start
```

## Documentation

- [Babylon.js Gaussian Splatting Guide](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting)
- [Gaussian Splatting Loader](https://doc.babylonjs.com/features/featuresDeepDive/importers/gaussianSplatting/)
- [Babylon.js 8.0 Blog](https://blogs.windows.com/windowsdeveloper/2025/03/31/part-2-babylon-js-8-0-audio-gaussian-splat-and-physics-updates/)

## Future Enhancements

- [ ] Drag-and-drop file loading
- [ ] UI controls for background color and splat size
- [ ] Multiple file support with layer management
- [ ] Camera position presets/bookmarks
- [ ] Screenshot export
- [ ] Performance metrics display

## License

MIT

## Contributing

This is a demonstration project. Feel free to fork and enhance!

---

**Built with ❤️ using Babylon.js 8.0**
