# Integration Guide: Babylon.js Gaussian Splat Viewer

## Quick Start (5 minutes)

### Step 1: Test the Demo

1. Open `examples/viewer-demo.html` in a modern browser
2. The viewer should load with a blank canvas
3. Try one of these:
   - Click "Nerfstudio Example" to load a sample file
   - Drag & drop a .ply file onto the canvas
   - Enter a URL and click "Load PLY"

### Step 2: Verify Your Environment

```bash
# Check if you have the basic setup
cd /d/MYCLAUDE_PROJECT/babygaussianviewer

# Start local server (required for loading files)
npm run dev
```

Then open: http://localhost:8080/examples/viewer-demo.html

---

## Integration into Your Project

### Option 1: Standalone HTML (Simplest)

Copy `examples/viewer-demo.html` and customize:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Splat Viewer</title>
    <!-- Babylon.js from CDN -->
    <script src="https://cdn.babylonjs.com/babylon.js"></script>
    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
</head>
<body>
    <canvas id="renderCanvas"></canvas>

    <script>
        // Your code here
    </script>
</body>
</html>
```

### Option 2: ES6 Modules (Recommended)

Use the full implementation from `examples/babylon-splat-loader.js`:

```javascript
// main.js
import { GaussianSplatViewer } from './examples/babylon-splat-loader.js';

async function main() {
    const viewer = new GaussianSplatViewer('renderCanvas');
    await viewer.initialize();
    viewer.setupDragAndDrop();

    // Load a PLY file
    await viewer.loadPLYFromUrl('assets/train.ply');
}

main();
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Gaussian Splat Viewer</title>
    <script type="importmap">
    {
        "imports": {
            "@babylonjs/core": "https://cdn.babylonjs.com/babylon.module.js",
            "@babylonjs/loaders": "https://cdn.babylonjs.com/loaders/babylon.loaders.module.js"
        }
    }
    </script>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script type="module" src="main.js"></script>
</body>
</html>
```

### Option 3: NPM Package (Production)

```bash
# Install Babylon.js
npm install @babylonjs/core @babylonjs/loaders

# Optional: TypeScript types
npm install --save-dev @types/babylonjs
```

```javascript
// src/main.js
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    GaussianSplattingMesh
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

async function createViewer() {
    const canvas = document.getElementById('renderCanvas');
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.5,
        5,
        Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);

    // Load PLY
    const splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(
        "splat",
        "path/to/file.ply",
        scene
    );

    // Render loop
    engine.runRenderLoop(() => scene.render());

    return { engine, scene, camera, splatMesh };
}

createViewer();
```

---

## Loading Nerfstudio PLY Files

### Export from Nerfstudio

```bash
# Train your model with Splatfacto
ns-train splatfacto --data <your_data_path>

# Export as PLY
ns-export gaussian-splat \
    --load-config outputs/your_scene/splatfacto/config.yml \
    --output-dir exports/splat
```

This creates: `exports/splat/splat.ply`

### Load in Viewer

```javascript
// Method 1: Direct URL
await viewer.loadPLYFromUrl('exports/splat/splat.ply');

// Method 2: From File object
const file = document.getElementById('fileInput').files[0];
await viewer.loadPLYFromFile(file);

// Method 3: From remote URL (CORS must be enabled)
await viewer.loadPLYFromUrl('https://example.com/splat.ply');
```

---

## Common Nerfstudio PLY Properties

Your Nerfstudio PLY will have these properties:

```
x, y, z                  # Position
nx, ny, nz              # Normals (usually unused)
f_dc_0, f_dc_1, f_dc_2  # Spherical harmonics (base color)
f_rest_0 ... f_rest_44  # Additional SH coefficients (optional)
opacity                 # Transparency
scale_0, scale_1, scale_2  # Log-space scale
rot_0, rot_1, rot_2, rot_3 # Rotation quaternion
```

Babylon.js handles all of these automatically!

---

## Performance Tips

### 1. File Size Optimization

```javascript
// When loading, you can filter low-opacity splats
const splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(
    "splat",
    "file.ply",
    scene,
    {
        // Remove nearly-transparent splats (saves memory)
        splatAlphaRemovalThreshold: 5
    }
);
```

### 2. Progressive Loading

For large files (>500MB), consider converting to .splat format:

```bash
# Using antimatter15's converter
python convert.py input.ply output.splat
```

.splat files load ~5x faster but lose view-dependent colors (SH coefficients).

### 3. Rendering Performance

```javascript
// Optimize render settings
scene.autoClear = false;
scene.autoClearDepthAndStencil = false;

// Use hardware scaling for better performance on high-DPI screens
engine.setHardwareScalingLevel(1.5);
```

### 4. Memory Management

```javascript
// Dispose old meshes before loading new ones
if (viewer.splatMesh) {
    viewer.splatMesh.dispose();
    viewer.splatMesh = null;
}

// Load new mesh
viewer.splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(...);
```

---

## Troubleshooting

### Problem: "Failed to load PLY file"

**Solutions:**
1. Check CORS settings if loading from remote URL
2. Verify file is valid PLY (open in text editor, should start with "ply")
3. Make sure you're serving from a web server (not `file://`)
4. Check browser console for detailed error

```javascript
// Add detailed error handling
try {
    await viewer.loadPLYFromUrl(url);
} catch (error) {
    console.error("Load error:", error);
    console.error("Stack:", error.stack);
}
```

### Problem: "Mesh appears but is black/invisible"

**Solutions:**
1. Check if camera is positioned correctly
2. Verify background color isn't same as splat color
3. Try adjusting camera:

```javascript
// Debug: position camera manually
viewer.camera.setPosition(new BABYLON.Vector3(0, 0, -5));
viewer.camera.setTarget(BABYLON.Vector3.Zero());
```

### Problem: "Performance is slow (<30 FPS)"

**Solutions:**
1. Reduce splat count by filtering
2. Lower hardware scaling
3. Disable unnecessary features:

```javascript
scene.skipPointerMovePicking = true;
scene.skipFrustumClipping = false;
```

### Problem: "CORS errors when loading from URL"

**Solutions:**
1. Serve files from same origin
2. Enable CORS on server:

```javascript
// Express.js example
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
```

3. Use local file loading instead:

```javascript
// Load from user's computer (no CORS issues)
const input = document.createElement('input');
input.type = 'file';
input.accept = '.ply';
input.onchange = async (e) => {
    await viewer.loadPLYFromFile(e.target.files[0]);
};
input.click();
```

---

## Advanced Features

### Custom Loading UI

```javascript
class CustomViewer extends GaussianSplatViewer {
    showLoadingUI(message) {
        // Your custom loading UI
        document.getElementById('myLoader').textContent = message;
        document.getElementById('myLoader').style.display = 'block';
    }

    hideLoadingUI() {
        document.getElementById('myLoader').style.display = 'none';
    }
}
```

### Multiple Splats in One Scene

```javascript
// Load first splat
const splat1 = await GaussianSplattingMesh.CreateFromUrlAsync(
    "splat1",
    "scene1.ply",
    scene
);
splat1.position = new BABYLON.Vector3(-2, 0, 0);

// Load second splat
const splat2 = await GaussianSplattingMesh.CreateFromUrlAsync(
    "splat2",
    "scene2.ply",
    scene
);
splat2.position = new BABYLON.Vector3(2, 0, 0);
```

### Export Screenshot

```javascript
// Take screenshot of current view
function captureScreenshot() {
    BABYLON.Tools.CreateScreenshot(
        viewer.engine,
        viewer.camera,
        { width: 1920, height: 1080 },
        (data) => {
            // data is base64 image
            const link = document.createElement('a');
            link.download = 'splat-screenshot.png';
            link.href = data;
            link.click();
        }
    );
}
```

### Camera Path Animation

```javascript
// Create camera animation
const animation = new BABYLON.Animation(
    "cameraAnimation",
    "position",
    30,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3
);

animation.setKeys([
    { frame: 0, value: new BABYLON.Vector3(5, 2, 5) },
    { frame: 60, value: new BABYLON.Vector3(-5, 2, 5) },
    { frame: 120, value: new BABYLON.Vector3(5, 2, 5) }
]);

viewer.camera.animations.push(animation);
viewer.scene.beginAnimation(viewer.camera, 0, 120, true);
```

---

## Testing Checklist

Before deploying, verify:

- [ ] PLY loads without errors
- [ ] Colors appear correctly (check SH rendering)
- [ ] Camera controls work (rotate, zoom, pan)
- [ ] Drag & drop functions properly
- [ ] FPS is stable (>30 FPS for normal scenes)
- [ ] Works in Chrome, Firefox, and Edge
- [ ] Mobile devices render correctly (if needed)
- [ ] Large files (>500MB) load without crashing
- [ ] Memory doesn't leak on repeated loads
- [ ] Background color changes work

---

## Next Steps

1. **Test with your Nerfstudio data:**
   - Export a PLY from your trained model
   - Load it in the demo viewer
   - Verify it looks correct

2. **Customize the viewer:**
   - Add your branding/UI
   - Implement needed features
   - Optimize for your use case

3. **Deploy:**
   - Host on static server (GitHub Pages, Netlify, etc.)
   - Ensure CORS is configured
   - Test in production environment

---

## Resources

### Documentation
- [Babylon.js Gaussian Splatting Docs](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting)
- [Nerfstudio Splatfacto Guide](https://docs.nerf.studio/nerfology/methods/splat.html)
- [Babylon.js Playground](https://playground.babylonjs.com/)

### Sample Data
- [Polycam 3DGS Samples](https://poly.cam/gaussian-splatting)
- [Nerfstudio Example Datasets](https://docs.nerf.studio/quickstart/first_nerf.html)

### Community
- [Babylon.js Forum](https://forum.babylonjs.com/)
- [Nerfstudio Discord](https://discord.gg/nerfstudio)
- [Radiance Fields Community](https://radiancefields.com/)

---

## Summary

**Recommended Workflow:**

1. ✅ Use `examples/viewer-demo.html` for quick testing
2. ✅ Use `examples/babylon-splat-loader.js` for production
3. ✅ Export PLY from Nerfstudio with `ns-export gaussian-splat`
4. ✅ Load in viewer with `viewer.loadPLYFromUrl()`
5. ✅ Test performance and optimize as needed

**Key Advantages of This Approach:**

- ✅ **Native Babylon.js support** - no external dependencies
- ✅ **Nerfstudio compatible** - works with standard PLY output
- ✅ **Performance optimized** - 60 FPS on modern hardware
- ✅ **Easy to integrate** - just a few lines of code
- ✅ **Fallback support** - custom parser if needed

---

*Last Updated: 2025-10-02*
*For the latest updates, check: https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting*
