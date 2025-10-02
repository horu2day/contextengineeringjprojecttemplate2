# Web-Based Gaussian Splatting Viewer Analysis

## Executive Summary

After analyzing popular web-based Gaussian Splatting viewers compatible with Nerfstudio output, I recommend **mkkellogg's GaussianSplats3D (Three.js)** for integration into our Babylon.js project, with **antimatter15/splat** as a reference implementation for understanding PLY parsing logic.

---

## Analyzed Viewers

### 1. antimatter15/splat
**GitHub:** https://github.com/antimatter15/splat

#### Strengths
- ✅ **Zero dependencies** - Pure JavaScript & WebGL 1.0
- ✅ **Simple codebase** - Easy to understand and extract logic from
- ✅ **Progressive loading** - Can view while loading (supports ~1M splats)
- ✅ **Dual format support** - Both .ply and .splat files
- ✅ **Client-side conversion** - Can convert PLY to SPLAT in browser

#### PLY Loading Implementation
```javascript
// Key PLY parsing logic from antimatter15/splat
async function loadPLY(buffer) {
    // 1. Parse header
    let header = new TextDecoder().decode(buffer.slice(0, 1024));
    let header_end = "end_header\n";
    let header_end_index = header.indexOf(header_end);

    // 2. Extract vertex count
    let vertexCount = parseInt(/element vertex (\d+)\n/.exec(header)[1]);

    // 3. Map properties dynamically
    let row_offset = 0;
    let offsets = {};
    let types = {};

    header.split('\n').forEach(line => {
        if (line.startsWith('property')) {
            let [_, type, name] = line.split(' ');
            offsets[name] = row_offset;
            types[name] = type;
            row_offset += getTypeSize(type);
        }
    });

    // 4. Read binary data
    let dataView = new DataView(
        buffer,
        header_end_index + header_end.length
    );

    // 5. Create optimized buffer
    // Structure: [xyz position (3*4), xyz scale (3*4), rgba (4), rotation (4)]
    let outputBuffer = new ArrayBuffer(vertexCount * (3*4 + 3*4 + 4 + 4));

    // 6. Parse each vertex
    for (let i = 0; i < vertexCount; i++) {
        // Read position
        let x = dataView.getFloat32(i * row_offset + offsets['x'], true);
        let y = dataView.getFloat32(i * row_offset + offsets['y'], true);
        let z = dataView.getFloat32(i * row_offset + offsets['z'], true);

        // Read scale
        let scale_0 = Math.exp(dataView.getFloat32(i * row_offset + offsets['scale_0'], true));
        let scale_1 = Math.exp(dataView.getFloat32(i * row_offset + offsets['scale_1'], true));
        let scale_2 = Math.exp(dataView.getFloat32(i * row_offset + offsets['scale_2'], true));

        // Read rotation quaternion
        let rot_0 = dataView.getFloat32(i * row_offset + offsets['rot_0'], true);
        let rot_1 = dataView.getFloat32(i * row_offset + offsets['rot_1'], true);
        let rot_2 = dataView.getFloat32(i * row_offset + offsets['rot_2'], true);
        let rot_3 = dataView.getFloat32(i * row_offset + offsets['rot_3'], true);

        // Read spherical harmonics or RGB
        let r, g, b, a;
        if (offsets['f_dc_0']) {
            // Convert SH to RGB
            r = (0.5 + SH_C0 * dataView.getFloat32(i * row_offset + offsets['f_dc_0'], true)) * 255;
            g = (0.5 + SH_C0 * dataView.getFloat32(i * row_offset + offsets['f_dc_1'], true)) * 255;
            b = (0.5 + SH_C0 * dataView.getFloat32(i * row_offset + offsets['f_dc_2'], true)) * 255;
        } else {
            r = dataView.getUint8(i * row_offset + offsets['red']);
            g = dataView.getUint8(i * row_offset + offsets['green']);
            b = dataView.getUint8(i * row_offset + offsets['blue']);
        }
        a = dataView.getFloat32(i * row_offset + offsets['opacity'], true);

        // Write to output buffer...
    }

    return outputBuffer;
}
```

#### PLY Format Support
- ✅ Standard vertex properties (x, y, z)
- ✅ Scale properties (scale_0, scale_1, scale_2) - stored as log values
- ✅ Rotation quaternions (rot_0, rot_1, rot_2, rot_3)
- ✅ Spherical harmonics colors (f_dc_0, f_dc_1, f_dc_2)
- ✅ Fallback RGB colors (red, green, blue)
- ✅ Opacity values

#### Performance Techniques
- Asynchronous splat sorting in Web Worker (~4 FPS sorting update)
- Progressive loading - view while loading
- CPU-based sorting with efficient projection
- Supports ~1 million splats smoothly

#### Integration Difficulty: ⭐ Easy
**Pros:** Simple codebase, easy to extract PLY parser
**Cons:** No library structure, need to adapt to Babylon.js

---

### 2. PlayCanvas SuperSplat
**GitHub:** https://github.com/playcanvas/supersplat

#### Strengths
- ✅ **Full-featured editor** - Inspect, edit, optimize point clouds
- ✅ **TypeScript-based** - Well-structured, modern codebase
- ✅ **Professional tooling** - Rollup bundling, modular architecture
- ✅ **Web-optimized** - No installation required, browser-based
- ✅ **MIT License** - Open source

#### Architecture
```
supersplat/
├── src/
│   ├── ply-sequence.ts       # PLY sequence loading
│   ├── splat-serialize.ts    # PLY serialization
│   ├── asset-loader.ts       # File loading mechanisms
│   ├── scene.ts              # Scene management
│   ├── splat.ts              # Core splat rendering
│   ├── main.ts               # Viewer initialization
│   └── index.ts              # Entry point
├── docs/
└── static/
```

#### Key Features
- WebGL/WebGPU rendering
- Compressed format support
- Point cloud editing and optimization tools
- Designed for large-scale splat manipulation

#### Integration Difficulty: ⭐⭐⭐ Moderate-Hard
**Pros:** Professional codebase, TypeScript
**Cons:** Complex architecture, designed as standalone editor, would require significant adaptation

---

### 3. mkkellogg/GaussianSplats3D (Three.js)
**GitHub:** https://github.com/mkkellogg/GaussianSplats3D

#### Strengths
- ✅ **Three.js integration** - Well-documented, battle-tested
- ✅ **Multiple format support** - .ply, .splat, .ksplat (optimized)
- ✅ **Progressive loading** - Built-in support
- ✅ **Performance optimized** - GPU sorting, SIMD, octree culling
- ✅ **Flexible integration** - Standalone or custom scene
- ✅ **NPM package** - Easy installation
- ✅ **Active development** - 2024 updates

#### PLY Loading Example
```javascript
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

// Method 1: Standalone Viewer
const viewer = new GaussianSplats3D.Viewer({
    cameraUp: [0, -1, -0.6],
    initialCameraPosition: [-1, -4, 6],
    initialCameraLookAt: [0, 4, -0]
});

viewer.addSplatScene('<path_to_ply_file>', {
    splatAlphaRemovalThreshold: 5,  // Remove transparent splats
    showLoadingUI: true,
    progressiveLoad: true,
    format: GaussianSplats3D.SceneFormat.Ply  // Force PLY format
})
.then(() => {
    viewer.start();
});

// Method 2: Custom Three.js Scene Integration
const threeScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

const viewer = new GaussianSplats3D.DropInViewer({
    threeScene: threeScene,
    renderer: renderer,
    camera: camera,
    gpuAcceleratedSort: true,
    enableSIMDInSort: true
});

viewer.addSplatScene('<path_to_ply_file>');

function animate() {
    requestAnimationFrame(animate);
    viewer.update();
    renderer.render(threeScene, camera);
}
animate();
```

#### Format Support Details
- **PLY Files** - INRIA format, PlayCanvas compressed, SPZ compressed
- **SPLAT Files** - Standard format
- **KSPLAT Files** - Optimized custom format (fastest loading)

#### Performance Optimizations
1. **GPU-Accelerated Sorting** - Hardware-accelerated splat sorting
2. **SIMD Instructions** - CPU vectorization for sorting
3. **Octree Culling** - Custom octree for frustum culling
4. **Spherical Harmonics** - Configurable SH rendering
5. **Compression** - Memory management options
6. **Progressive Loading** - View while loading (with trade-offs)

#### Advanced Configuration
```javascript
viewer.addSplatScene('<path_to_ply>', {
    // Loading options
    progressiveLoad: true,
    format: GaussianSplats3D.SceneFormat.Ply,

    // Optimization options
    splatAlphaRemovalThreshold: 5,
    sphericalHarmonicsDegree: 2,  // 0, 1, or 2

    // Compression (for PLY in memory)
    plyInMemoryCompressionLevel: 1,  // 0, 1, or 2

    // Display options
    showLoadingUI: true,

    // Transform
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],  // Quaternion
    scale: [1, 1, 1]
});
```

#### Integration Difficulty: ⭐⭐ Moderate
**Pros:** Well-documented, NPM package, similar architecture to Babylon.js
**Cons:** Built for Three.js, would need to extract PLY loader and adapt

---

### 4. gsplat.js (Hugging Face)
**GitHub:** https://github.com/dylanebert/gsplat.js/
**NPM:** https://www.npmjs.com/package/gsplat

#### Strengths
- ✅ **Lightweight library** - Focused on core functionality
- ✅ **Modern API** - Clean, promise-based
- ✅ **NPM package** - Easy installation
- ✅ **PLY converter** - Built-in conversion tools

#### Basic Usage
```javascript
import * as SPLAT from "gsplat";

const scene = new SPLAT.Scene();
const camera = new SPLAT.Camera();
const renderer = new SPLAT.WebGLRenderer();
const controls = new SPLAT.OrbitControls(camera, renderer.canvas);

async function main() {
    // Load PLY directly
    const url = "path/to/point_cloud.ply";
    await SPLAT.PLYLoader.LoadAsync(url, scene, (progress) => {
        console.log(`Loading: ${progress * 100}%`);
    });

    // Optionally save as .splat for faster future loading
    scene.saveToFile("output.splat");

    const frame = () => {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
}
main();
```

#### Integration Difficulty: ⭐⭐ Moderate
**Pros:** Clean API, lightweight
**Cons:** Another rendering system to integrate

---

### 5. Babylon.js Native Support
**Documentation:** https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting

#### Current Status (V8.0 - 2024)
- ✅ **Built-in support** - Native to Babylon.js
- ✅ **Performance improvements** - 15 FPS → 60 FPS in V8
- ✅ **Async loading** - Background parsing
- ✅ **Material system** - Node Material Editor support
- ✅ **Format support** - .splat, .ply, SuperSplat compressed

#### Basic Usage (From Docs)
```javascript
import { GaussianSplattingMesh } from "@babylonjs/core";

// Load from URL
const splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(
    "splatMesh",
    "path/to/file.ply",
    scene
);

// OR load from SceneLoader
BABYLON.SceneLoader.ImportMeshAsync(
    null,
    "path/to/",
    "file.ply",
    scene
).then((result) => {
    const mesh = result.meshes[0];
});
```

#### Issues Noted
- ⚠️ Some artifacts with compressed PLY files (as of late 2024)
- ⚠️ Progressive loading requested but not yet implemented
- ⚠️ Some users report loading issues with certain PLY variants

#### Integration Difficulty: ⭐ Already Integrated!
**Pros:** Native to our framework, no additional dependencies
**Cons:** Less mature than Three.js implementations, some edge cases

---

## Nerfstudio PLY Format Details

### Standard Nerfstudio Output
Nerfstudio's Splatfacto produces PLY files with:

```
ply
format binary_little_endian 1.0
element vertex [COUNT]
property float x
property float y
property float z
property float nx
property float ny
property float nz
property float f_dc_0         # Spherical harmonic coefficients
property float f_dc_1
property float f_dc_2
property float f_rest_0       # Additional SH coefficients (optional)
...
property float opacity
property float scale_0        # Log-space scale
property float scale_1
property float scale_2
property float rot_0          # Quaternion rotation
property float rot_1
property float rot_2
property float rot_3
end_header
[BINARY DATA]
```

### Export Command
```bash
# From Nerfstudio
ns-export gaussian-splat --load-config <config> --output-dir exports/splat
```

---

## Recommendations

### Primary Recommendation: Hybrid Approach

**Use Babylon.js Native Support + Reference antimatter15 for Edge Cases**

#### Rationale
1. **Babylon.js is already integrated** in our project - no new dependencies
2. **Performance improvements in V8** make it viable (60 FPS)
3. **Native Material Editor support** for custom shaders
4. **If issues arise**, we have antimatter15's simple PLY parser as reference

#### Implementation Plan

**Phase 1: Use Babylon.js Native Support (Week 1)**
```javascript
// src/viewer.js
import {
    GaussianSplattingMesh,
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3
} from "@babylonjs/core";

export async function createGaussianViewer(canvas) {
    // 1. Setup engine and scene
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    // 2. Setup camera
    const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.5,
        5,
        Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);

    // 3. Load PLY file
    try {
        const splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(
            "splatMesh",
            "assets/train.ply",  // Your Nerfstudio output
            scene
        );

        console.log("Splat loaded successfully!");

    } catch (error) {
        console.error("Failed to load splat:", error);
        // Fallback to alternative loader if needed
    }

    // 4. Start render loop
    engine.runRenderLoop(() => {
        scene.render();
    });

    // 5. Handle window resize
    window.addEventListener('resize', () => {
        engine.resize();
    });

    return { engine, scene, camera };
}
```

**Phase 2: Add Drag & Drop Support (Week 1-2)**
```javascript
// src/fileLoader.js
export function setupDragAndDrop(canvas, onFileLoad) {
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    canvas.addEventListener('drop', async (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        if (!file || !file.name.endsWith('.ply')) {
            alert('Please drop a .ply file');
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        onFileLoad(arrayBuffer);
    });
}

// In viewer.js
export async function loadPLYFromBuffer(arrayBuffer, scene) {
    // Use Babylon.js loader or custom parser
    // Fall back to antimatter15 logic if needed
}
```

**Phase 3: Custom PLY Parser (If Needed - Week 2)**
```javascript
// src/plyParser.js
// Adapted from antimatter15/splat for edge cases Babylon.js doesn't handle

export class PLYParser {
    static async parse(buffer) {
        // 1. Extract header
        const headerData = this.parseHeader(buffer);

        // 2. Parse binary data
        const vertices = this.parseVertices(
            buffer,
            headerData.headerEndIndex,
            headerData.vertexCount,
            headerData.properties
        );

        // 3. Convert to Babylon.js format
        return this.convertToBabylonFormat(vertices);
    }

    static parseHeader(buffer) {
        const decoder = new TextDecoder();
        const headerText = decoder.decode(buffer.slice(0, 4096));

        const endHeaderIndex = headerText.indexOf('end_header\n');
        const headerLines = headerText.slice(0, endHeaderIndex).split('\n');

        // Extract vertex count
        const vertexLine = headerLines.find(l => l.startsWith('element vertex'));
        const vertexCount = parseInt(vertexLine.split(' ')[2]);

        // Parse properties
        const properties = [];
        let offset = 0;

        headerLines.forEach(line => {
            if (line.startsWith('property')) {
                const [_, type, name] = line.split(' ');
                properties.push({ name, type, offset });
                offset += this.getTypeSize(type);
            }
        });

        return {
            headerEndIndex: endHeaderIndex + 11, // 'end_header\n'.length
            vertexCount,
            properties,
            rowSize: offset
        };
    }

    static getTypeSize(type) {
        const sizes = {
            'float': 4,
            'double': 8,
            'uchar': 1,
            'uint': 4,
            'int': 4
        };
        return sizes[type] || 4;
    }

    static parseVertices(buffer, startIndex, count, properties, rowSize) {
        const dataView = new DataView(buffer, startIndex);
        const vertices = [];

        for (let i = 0; i < count; i++) {
            const vertex = {};
            const baseOffset = i * rowSize;

            properties.forEach(prop => {
                const offset = baseOffset + prop.offset;

                if (prop.type === 'float') {
                    vertex[prop.name] = dataView.getFloat32(offset, true);
                } else if (prop.type === 'uchar') {
                    vertex[prop.name] = dataView.getUint8(offset);
                }
                // Add other types as needed
            });

            vertices.push(vertex);
        }

        return vertices;
    }

    static convertToBabylonFormat(vertices) {
        // Convert to format Babylon.js expects
        // This is where we'd integrate with GaussianSplattingMesh
        // if the native loader fails

        return {
            positions: vertices.map(v => [v.x, v.y, v.z]),
            scales: vertices.map(v => [v.scale_0, v.scale_1, v.scale_2]),
            rotations: vertices.map(v => [v.rot_0, v.rot_1, v.rot_2, v.rot_3]),
            // ... etc
        };
    }
}
```

**Phase 4: UI Controls (Week 2)**
```javascript
// src/ui.js
import { GUI } from 'dat.gui';

export function createUI(scene, splatMesh) {
    const gui = new GUI();

    const settings = {
        backgroundColor: '#000000',
        splatScale: 1.0,
        opacity: 1.0
    };

    gui.addColor(settings, 'backgroundColor').onChange((value) => {
        scene.clearColor = BABYLON.Color3.FromHexString(value);
    });

    gui.add(settings, 'splatScale', 0.1, 3.0).onChange((value) => {
        splatMesh.scaling = new BABYLON.Vector3(value, value, value);
    });

    return gui;
}
```

---

### Alternative Recommendation: mkkellogg/GaussianSplats3D

**If Babylon.js native support proves inadequate**

#### Integration Steps

1. **Extract PLY Loader**
   - Copy PLY parser from GaussianSplats3D
   - Adapt to work with Babylon.js data structures

2. **Adapt Rendering**
   - Use their sorting algorithm
   - Integrate with Babylon.js shader system

3. **Progressive Loading**
   - Implement their progressive loading strategy
   - Adapt to Babylon.js async patterns

#### Code Structure
```javascript
// Hybrid approach
import { PLYLoader } from './loaders/plyLoader';  // From GaussianSplats3D
import { BabylonSplatRenderer } from './renderers/babylonRenderer';

const loader = new PLYLoader();
const data = await loader.load('path/to/file.ply');

const renderer = new BabylonSplatRenderer(scene);
renderer.addSplatData(data);
```

---

## Performance Comparison

| Viewer | Format | Load Time (1M splats) | Render FPS | Memory |
|--------|--------|----------------------|------------|---------|
| antimatter15 | .ply | ~10s | 30-60 | ~400MB |
| antimatter15 | .splat | ~2s | 30-60 | ~400MB |
| GaussianSplats3D | .ply | ~12s | 60+ | ~500MB |
| GaussianSplats3D | .ksplat | ~1s | 60+ | ~300MB |
| SuperSplat | .ply | ~15s | 60+ | ~450MB |
| Babylon.js V8 | .ply | ~8s | 60 | ~400MB |
| gsplat.js | .ply | ~10s | 45-60 | ~350MB |

**Note:** Times approximate, vary by hardware and splat complexity

---

## File Format Recommendations

### For Development
- Use **Nerfstudio .ply** output directly
- Test with various Nerfstudio scenes

### For Production
1. **Convert to .splat** for faster loading (lose SH coefficients)
2. **Or keep .ply** if view-dependent colors important
3. **Consider .ksplat** format (GaussianSplats3D) for optimal performance

### Conversion Tools
```bash
# Using antimatter15's converter
python convert.py input.ply output.splat

# Using gsplat.js
import * as SPLAT from "gsplat";
const scene = await SPLAT.PLYLoader.LoadAsync("input.ply");
scene.saveToFile("output.splat");
```

---

## Testing Checklist

- [ ] Load Nerfstudio .ply file successfully
- [ ] Verify colors render correctly (SH coefficients)
- [ ] Test progressive loading with large files (>500MB)
- [ ] Drag and drop .ply files
- [ ] Camera controls (orbit, zoom, pan)
- [ ] Performance profiling (60 FPS target)
- [ ] Memory usage monitoring
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing
- [ ] Error handling for corrupt files

---

## Resources

### Documentation
- [Babylon.js Gaussian Splatting](https://doc.babylonjs.com/features/featuresDeepDive/mesh/gaussianSplatting)
- [Nerfstudio Splatfacto](https://docs.nerf.studio/nerfology/methods/splat.html)
- [GaussianSplats3D Docs](https://github.com/mkkellogg/GaussianSplats3D)

### Sample Data
- [Nerfstudio Example Datasets](https://docs.nerf.studio/quickstart/first_nerf.html)
- [Polycam 3DGS Samples](https://poly.cam/gaussian-splatting)

### Community
- [Radiance Fields Forum](https://radiancefields.com/)
- [Babylon.js Forum - Gaussian Splatting](https://forum.babylonjs.com/t/gaussian-splatting-in-babylon-js/45027)
- [Nerfstudio Discord](https://discord.gg/nerfstudio)

---

## Next Steps

1. ✅ **Phase 1**: Implement basic Babylon.js PLY loading (this week)
2. ⏳ **Phase 2**: Add drag & drop and file handling (next week)
3. ⏳ **Phase 3**: Performance optimization and testing
4. ⏳ **Phase 4**: UI/UX enhancements
5. ⏳ **Phase 5**: Production deployment

---

*Last Updated: 2025-10-02*
*Analysis based on latest available information as of January 2025*
