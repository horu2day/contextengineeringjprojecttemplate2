name: "Babylon.js Gaussian Splatting Viewer - Initial Implementation"
description: |

## Purpose
Implement a web-based 3D Gaussian Splatting viewer using Babylon.js that allows users to load .splat and .ply files, navigate with camera controls, and view world coordinates of selected points.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Build a functional web-based Gaussian Splatting viewer that can load and display 3D point cloud data (.splat, .ply files) with interactive camera controls and world coordinate display.

## Why
- **User Value**: Provides an easy-to-use web interface for viewing 3D Gaussian Splatting data without specialized software
- **Technical Value**: Demonstrates Babylon.js capabilities for handling modern 3D formats
- **Use Case**: Researchers and developers working with 3D reconstruction need quick visualization tools

## What
A browser-based application that:
- Loads .splat and .ply files from local assets
- Displays 3D Gaussian Splatting data with proper rendering
- Allows mouse-based camera navigation (rotate, zoom, pan)
- Shows world coordinates when clicking on points in the scene

### Success Criteria
- [x] Project initialized with proper package.json and dependencies
- [ ] HTML canvas renders Babylon.js scene
- [ ] Camera controls work smoothly (ArcRotateCamera)
- [ ] Example train.splat file loads and displays correctly
- [ ] Mouse click returns world coordinates of selected point
- [ ] No console errors during normal operation
- [ ] Responsive canvas that handles window resize

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting
  why: Core documentation for Gaussian Splatting in Babylon.js

- url: https://doc.babylonjs.com/features/featuresDeepDive/importers/gaussianSplatting/
  why: Specific loader documentation for .splat and .ply files

- url: https://blogs.windows.com/windowsdeveloper/2025/03/31/part-2-babylon-js-8-0-audio-gaussian-splat-and-physics-updates/
  why: Babylon.js 8.0 improvements for Gaussian Splatting

- file: examples/basic-splat-scene.js
  why: Reference implementation pattern using SceneLoader.ImportMeshAsync

- file: .claude/CLAUDE.md
  why: Project structure, code standards, and known gotchas

# Known Issues to be aware of
- url: https://forum.babylonjs.com/t/corrupted-rendering-of-gaussian-splattings/60494
  why: Troubleshooting corrupted rendering issues

- url: https://forum.babylonjs.com/t/gaussian-splatting-does-not-support-right-handed-system/50260
  critical: Gaussian Splatting ONLY works with left-handed coordinate system (Babylon.js default)

- url: https://forum.babylonjs.com/t/gaussian-splatting-in-babylon-native/58611
  why: Limitations in Babylon Native environment
```

### Current Codebase Tree
```bash
babygaussianviewer/
├── .claude/
│   └── CLAUDE.md              # Project guidelines
├── assets/
│   └── train.splat            # Example Gaussian Splatting data (EXISTS)
├── examples/
│   └── basic-splat-scene.js   # Reference implementation (EXISTS)
├── Architecture.md            # Legacy Flet architecture docs
├── INITIAL.md                 # Feature requirements
└── PRPs/
    └── templates/
        └── prp_base.md        # This template
```

### Desired Codebase Tree
```bash
babygaussianviewer/
├── src/
│   ├── main.js                # Application entry point - Engine, Scene setup, render loop
│   ├── viewer.js              # Core viewer logic - load models, camera setup
│   └── utils.js               # Helper functions - coordinate picking, UI utilities
├── styles/
│   └── main.css               # Basic styling - full viewport canvas, loading indicators
├── index.html                 # HTML entry point - canvas element, module script
├── package.json               # Dependencies: @babylonjs/core, @babylonjs/loaders, http-server
└── .gitignore                 # Ignore node_modules, etc.
```

### Known Gotchas & Library Quirks
```javascript
// CRITICAL: Babylon.js Gaussian Splatting specific issues

// 1. Coordinate System: MUST use left-handed (Babylon.js default)
// Gaussian Splatting does NOT support right-handed systems
// Don't change scene.useRightHandedSystem = true;

// 2. Async Loading: ALWAYS use async/await or promises
// SceneLoader.ImportMeshAsync returns a promise
// Handle errors with try/catch

// 3. Canvas Sizing: Engine doesn't auto-resize
window.addEventListener("resize", () => {
  engine.resize(); // REQUIRED for responsive canvas
});

// 4. Module System: package.json must have "type": "module"
// Use import/export, not require()

// 5. File Loading: .splat files are binary, .ply can be text or binary
// SceneLoader handles both but requires @babylonjs/loaders package

// 6. Camera Target: ArcRotateCamera needs a target point
// Usually Vector3.Zero() or the loaded mesh's position

// 7. Scene Disposal: Clean up on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  engine.dispose();
  scene.dispose();
});
```

## Implementation Blueprint

### Data Models and Structure
```javascript
// No complex data models needed for initial implementation
// Babylon.js handles mesh data internally

// Future: Could add ViewerState class for managing:
// - Loaded models array
// - Current camera settings
// - UI state (background color, splat size)
```

### Task List (in order)

```yaml
Task 1: Project Initialization
  CREATE package.json:
    - name: "babygaussianviewer"
    - type: "module" (CRITICAL for ES6 imports)
    - dependencies: @babylonjs/core@^8.0.0, @babylonjs/loaders@^8.0.0
    - devDependencies: http-server@^14.1.1
    - scripts: { "dev": "http-server -o -c-1" }

  CREATE .gitignore:
    - node_modules/
    - .DS_Store
    - *.log

Task 2: HTML Entry Point
  CREATE index.html:
    - DOCTYPE html, basic structure
    - STYLE: body { margin: 0; overflow: hidden; }
    - STYLE: #renderCanvas { width: 100%; height: 100vh; }
    - CANVAS element with id="renderCanvas"
    - SCRIPT tag with type="module" src="src/main.js"

Task 3: CSS Styling
  CREATE styles/main.css:
    - Full viewport canvas (no scrollbars)
    - Loading indicator (optional, for UX)
    - Minimal styling, no frameworks

Task 4: Main Application Entry
  CREATE src/main.js:
    - IMPORT Engine from @babylonjs/core
    - IMPORT createBasicSplatScene from examples/basic-splat-scene.js
    - GET canvas element by id
    - CREATE Engine instance
    - CALL createBasicSplatScene(engine, canvas)
    - START render loop: engine.runRenderLoop(() => scene.render())
    - HANDLE window resize event
    - HANDLE cleanup on beforeunload

Task 5: Viewer Core Logic
  MODIFY examples/basic-splat-scene.js → src/viewer.js:
    - EXPORT createScene function
    - SETUP Scene, ArcRotateCamera, HemisphericLight
    - LOAD assets/train.splat using SceneLoader.ImportMeshAsync
    - HANDLE success: position mesh, log success
    - HANDLE error: log error, show user message
    - RETURN scene object

Task 6: World Coordinate Picking (Enhancement)
  CREATE src/utils.js:
    - EXPORT setupCoordinatePicking(scene, canvas) function
    - ADD event listener for canvas click
    - USE scene.pick() to get picked point
    - DISPLAY world coordinates in UI (console for MVP)

Task 7: Testing & Validation
  RUN npm install
  RUN npm run dev
  VERIFY in browser:
    - Scene renders with train.splat
    - Camera rotates with mouse drag
    - Zoom with mouse wheel
    - No console errors
```

### Task Pseudocode

```javascript
// Task 4: src/main.js
import { Engine } from "@babylonjs/core";
import { createScene } from "./viewer.js";

const canvas = document.getElementById("renderCanvas");
if (!canvas) {
  throw new Error("Canvas element not found");
}

// CRITICAL: Anti-alias = true for better quality
const engine = new Engine(canvas, true);

// Create scene using our viewer module
const scene = createScene(engine, canvas);

// PATTERN: Standard Babylon.js render loop
engine.runRenderLoop(() => {
  scene.render();
});

// GOTCHA: Must manually resize engine
window.addEventListener("resize", () => {
  engine.resize();
});

// PATTERN: Cleanup to prevent memory leaks
window.addEventListener("beforeunload", () => {
  engine.dispose();
  scene.dispose();
});
```

```javascript
// Task 5: src/viewer.js
import {
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders"; // CRITICAL: Side-effect import for .splat/.ply support

export const createScene = function (engine, canvas) {
  const scene = new Scene(engine);

  // PATTERN: ArcRotateCamera for 3D viewers
  // alpha, beta, radius, target, scene
  const camera = new ArcRotateCamera(
    "camera1",
    -Math.PI / 2,  // Start facing front
    Math.PI / 3,   // Elevated view
    10,            // Distance from target
    Vector3.Zero(), // Look at origin
    scene
  );

  // CRITICAL: Attach controls to canvas
  camera.attachControl(canvas, true);

  // Basic ambient light
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // ASYNC: Load Gaussian Splatting data
  SceneLoader.ImportMeshAsync(
    null,                    // Load all meshes
    "assets/",               // Root URL (relative path works with http-server)
    "train.splat",           // Filename
    scene
  )
    .then((result) => {
      // GOTCHA: Check if meshes exist
      if (result.meshes && result.meshes[0]) {
        console.log("✓ Gaussian Splatting model loaded successfully");
        console.log(`  Loaded ${result.meshes.length} mesh(es)`);

        // Optional: Adjust position if needed
        // result.meshes[0].position.y = 0;
      }
    })
    .catch((error) => {
      console.error("✗ Failed to load Gaussian Splatting model:", error);
      // TODO: Show user-friendly error message in UI
    });

  return scene;
};
```

```javascript
// Task 6: src/utils.js
export function setupCoordinatePicking(scene, canvas) {
  canvas.addEventListener("click", (event) => {
    // Get picking ray from camera through click point
    const pickResult = scene.pick(
      scene.pointerX,
      scene.pointerY
    );

    if (pickResult.hit) {
      const point = pickResult.pickedPoint;
      console.log("World Coordinates:", {
        x: point.x.toFixed(3),
        y: point.y.toFixed(3),
        z: point.z.toFixed(3)
      });

      // TODO: Display in UI overlay instead of console
    }
  });
}
```

### Integration Points
```yaml
ASSETS:
  - existing: assets/train.splat (already present)
  - future: Support drag-and-drop for additional files

HTML:
  - add to: index.html
  - element: <canvas id="renderCanvas"></canvas>
  - script: <script type="module" src="src/main.js"></script>

PACKAGE:
  - add to: package.json
  - pattern: "type": "module" (CRITICAL for imports)
  - dependencies: @babylonjs/core, @babylonjs/loaders
```

## Validation Loop

### Level 1: Syntax & Module Loading
```bash
# NO linter configured yet (ESLint is optional for this project)
# Validation is done by browser console

# Check for module errors:
# - Open browser dev tools (F12)
# - Look for "Failed to load module" errors
# - Verify import paths are correct (relative paths start with ./ or ../)
```

### Level 2: Visual Testing
```bash
# Start development server
npm run dev

# Browser should open to http://localhost:8080

# Visual Checklist:
# [ ] Canvas fills entire viewport (no scrollbars)
# [ ] Scene background is visible (default gray)
# [ ] Gaussian Splatting model appears in view
# [ ] Mouse drag rotates camera smoothly
# [ ] Mouse wheel zooms in/out
# [ ] Window resize adjusts canvas size

# Console Checklist:
# [ ] No red errors in console
# [ ] Success message: "✓ Gaussian Splatting model loaded successfully"
# [ ] Click on model shows world coordinates in console
```

### Level 3: Integration Test
```bash
# Manual test sequence:

# 1. Fresh start
rm -rf node_modules package-lock.json
npm install
npm run dev

# 2. Camera controls
# - Drag with left mouse: rotates camera ✓
# - Scroll wheel: zooms in/out ✓
# - Right mouse drag: pans camera ✓

# 3. Performance
# - FPS should be smooth (>30 FPS)
# - No jank when rotating
# - Check Performance tab in DevTools if issues

# 4. Error handling
# - Rename train.splat temporarily
# - Reload page
# - Should see error message in console
# - Restore train.splat

# 5. Coordinate picking (if implemented)
# - Click on different parts of model
# - Console should show different coordinates
# - X, Y, Z values should be reasonable (not NaN or Infinity)
```

## Final Validation Checklist
- [ ] Browser opens automatically with `npm run dev`
- [ ] Canvas fills entire viewport (100vw x 100vh)
- [ ] train.splat loads and renders correctly
- [ ] Camera controls are smooth and intuitive
- [ ] Console shows success message, no errors
- [ ] Window resize doesn't break rendering
- [ ] Code follows ES6 module pattern (import/export)
- [ ] Error handling for file loading failures
- [ ] World coordinates display on click (console MVP)

---

## Anti-Patterns to Avoid
- ❌ Don't use `require()` - use ES6 `import/export` only
- ❌ Don't forget `"type": "module"` in package.json
- ❌ Don't skip window resize handler - canvas won't resize
- ❌ Don't use right-handed coordinate system - breaks Gaussian Splatting
- ❌ Don't load files synchronously - always use async/await
- ❌ Don't hardcode absolute paths - use relative paths for assets
- ❌ Don't skip error handling in SceneLoader.ImportMeshAsync
- ❌ Don't forget to import "@babylonjs/loaders" side-effect
- ❌ Don't dispose scene/engine without cleanup (memory leaks)

## Progressive Enhancement Path
1. **MVP** (This PRP): Load single .splat file, basic camera controls
2. **Phase 2**: Drag-and-drop file loading
3. **Phase 3**: UI controls (background color, splat size slider)
4. **Phase 4**: Multiple file support with layer management
5. **Phase 5**: Camera presets and bookmarks
6. **Phase 6**: Export screenshots and camera positions
