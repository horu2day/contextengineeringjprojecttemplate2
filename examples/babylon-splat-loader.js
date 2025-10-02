/**
 * Babylon.js Gaussian Splatting Viewer - Complete Implementation Example
 *
 * This example demonstrates the recommended approach for loading and viewing
 * Nerfstudio .ply files using Babylon.js native support, with fallback
 * to custom parser if needed.
 *
 * Based on analysis of:
 * - antimatter15/splat (PLY parsing logic)
 * - mkkellogg/GaussianSplats3D (Three.js best practices)
 * - Babylon.js V8 native support
 */

import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    Color3,
    GaussianSplattingMesh,
    SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

/**
 * Main viewer class for Gaussian Splat visualization
 */
export class GaussianSplatViewer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element '${canvasId}' not found`);
        }

        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.splatMesh = null;
        this.loadingUI = null;
    }

    /**
     * Initialize the Babylon.js engine and scene
     */
    async initialize() {
        // Create engine
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        // Create scene
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color3(0, 0, 0);

        // Setup camera
        this.camera = new ArcRotateCamera(
            "camera",
            -Math.PI / 2,
            Math.PI / 2.5,
            5,
            Vector3.Zero(),
            this.scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.wheelPrecision = 50;
        this.camera.minZ = 0.1;
        this.camera.maxZ = 1000;

        // Add light (for UI elements, not needed for splats)
        new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);

        // Setup render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        console.log("Babylon.js viewer initialized");
        return this;
    }

    /**
     * Load a Gaussian Splat PLY file from URL
     * Uses Babylon.js native loader (recommended)
     *
     * @param {string} url - URL to the .ply file
     * @param {Object} options - Loading options
     */
    async loadPLYFromUrl(url, options = {}) {
        const defaultOptions = {
            showLoadingUI: true,
            onProgress: null,
            onError: null
        };

        const opts = { ...defaultOptions, ...options };

        try {
            if (opts.showLoadingUI) {
                this.showLoadingUI("Loading Gaussian Splat...");
            }

            console.log(`Loading PLY from: ${url}`);

            // Method 1: Using GaussianSplattingMesh.CreateFromUrlAsync (Recommended)
            this.splatMesh = await GaussianSplattingMesh.CreateFromUrlAsync(
                "splatMesh",
                url,
                this.scene
            );

            console.log("Splat loaded successfully!");
            console.log("Splat info:", {
                vertices: this.splatMesh.getTotalVertices(),
                position: this.splatMesh.position,
                scaling: this.splatMesh.scaling
            });

            // Auto-adjust camera to view the splat
            this.adjustCameraToSplat();

            if (opts.showLoadingUI) {
                this.hideLoadingUI();
            }

            return this.splatMesh;

        } catch (error) {
            console.error("Failed to load PLY with native loader:", error);

            if (opts.onError) {
                opts.onError(error);
            }

            // Try fallback method
            console.log("Attempting fallback loading method...");
            return this.loadPLYWithFallback(url, opts);
        }
    }

    /**
     * Alternative loading method using SceneLoader
     */
    async loadPLYWithSceneLoader(url, filename, options = {}) {
        try {
            this.showLoadingUI("Loading with SceneLoader...");

            const result = await SceneLoader.ImportMeshAsync(
                null,
                url,
                filename,
                this.scene
            );

            this.splatMesh = result.meshes[0];
            console.log("Loaded with SceneLoader:", this.splatMesh);

            this.adjustCameraToSplat();
            this.hideLoadingUI();

            return this.splatMesh;

        } catch (error) {
            console.error("SceneLoader failed:", error);
            throw error;
        }
    }

    /**
     * Load PLY from File object (for drag & drop)
     *
     * @param {File} file - File object from drag & drop or file input
     */
    async loadPLYFromFile(file) {
        if (!file.name.endsWith('.ply')) {
            throw new Error('File must be a .ply file');
        }

        try {
            this.showLoadingUI(`Loading ${file.name}...`);

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Convert to Blob URL for Babylon.js loader
            const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            // Load using native method
            await this.loadPLYFromUrl(url, { showLoadingUI: false });

            // Clean up blob URL
            URL.revokeObjectURL(url);

            this.hideLoadingUI();

            console.log(`File ${file.name} loaded successfully`);
            return this.splatMesh;

        } catch (error) {
            console.error("Failed to load file:", error);

            // Try custom parser as fallback
            console.log("Attempting custom PLY parser...");
            const arrayBuffer = await file.arrayBuffer();
            return this.parsePLYCustom(arrayBuffer);
        }
    }

    /**
     * Fallback: Custom PLY parser based on antimatter15/splat
     * Used when native Babylon.js loader fails
     */
    async parsePLYCustom(arrayBuffer) {
        try {
            this.showLoadingUI("Parsing PLY with custom parser...");

            const parser = new CustomPLYParser();
            const splatData = await parser.parse(arrayBuffer);

            // Create mesh from parsed data
            // Note: This would require custom mesh creation
            // For now, this is a placeholder showing the structure

            console.log("Custom parser extracted:", {
                vertexCount: splatData.vertexCount,
                hasColors: splatData.hasColors,
                hasSH: splatData.hasSH
            });

            this.hideLoadingUI();

            // TODO: Create custom GaussianSplattingMesh from parsed data
            // This would require deeper integration with Babylon.js internals

            throw new Error("Custom parser extraction successful, but mesh creation not yet implemented");

        } catch (error) {
            this.hideLoadingUI();
            console.error("Custom parser failed:", error);
            throw error;
        }
    }

    /**
     * Fallback loading when native loader fails
     */
    async loadPLYWithFallback(url, options) {
        // Fetch the file manually
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        return this.parsePLYCustom(arrayBuffer);
    }

    /**
     * Adjust camera to properly frame the loaded splat
     */
    adjustCameraToSplat() {
        if (!this.splatMesh) return;

        // Get bounding info
        const boundingInfo = this.splatMesh.getBoundingInfo();
        const center = boundingInfo.boundingBox.centerWorld;
        const size = boundingInfo.boundingBox.extendSizeWorld;

        // Set camera target to center of splat
        this.camera.target = center;

        // Adjust camera distance based on size
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.radius = maxDim * 3;

        console.log("Camera adjusted:", {
            target: center,
            radius: this.camera.radius,
            size: size
        });
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            this.canvas.style.opacity = '0.5';
        });

        this.canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.opacity = '1.0';
        });

        this.canvas.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.opacity = '1.0';

            const files = e.dataTransfer.files;
            if (files.length === 0) return;

            const file = files[0];
            if (!file.name.endsWith('.ply')) {
                alert('Please drop a .ply file');
                return;
            }

            try {
                await this.loadPLYFromFile(file);
                console.log("Drag & drop load successful!");
            } catch (error) {
                console.error("Drag & drop load failed:", error);
                alert(`Failed to load file: ${error.message}`);
            }
        });

        console.log("Drag & drop enabled on canvas");
    }

    /**
     * Show loading UI
     */
    showLoadingUI(message = "Loading...") {
        if (!this.loadingUI) {
            this.loadingUI = document.createElement('div');
            this.loadingUI.id = 'loadingUI';
            this.loadingUI.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                z-index: 1000;
            `;
            document.body.appendChild(this.loadingUI);
        }
        this.loadingUI.textContent = message;
        this.loadingUI.style.display = 'block';
    }

    /**
     * Hide loading UI
     */
    hideLoadingUI() {
        if (this.loadingUI) {
            this.loadingUI.style.display = 'none';
        }
    }

    /**
     * Dispose and cleanup
     */
    dispose() {
        if (this.engine) {
            this.engine.dispose();
        }
        if (this.loadingUI && this.loadingUI.parentElement) {
            this.loadingUI.parentElement.removeChild(this.loadingUI);
        }
    }
}

/**
 * Custom PLY Parser (Fallback)
 * Based on antimatter15/splat implementation
 * Only used when Babylon.js native loader fails
 */
class CustomPLYParser {
    async parse(arrayBuffer) {
        const headerData = this.parseHeader(arrayBuffer);
        const vertices = this.parseVertices(arrayBuffer, headerData);

        return {
            vertexCount: headerData.vertexCount,
            vertices: vertices,
            hasColors: headerData.hasColors,
            hasSH: headerData.hasSH,
            properties: headerData.properties
        };
    }

    parseHeader(arrayBuffer) {
        const decoder = new TextDecoder();
        const headerText = decoder.decode(arrayBuffer.slice(0, 4096));

        const endHeader = 'end_header\n';
        const endHeaderIndex = headerText.indexOf(endHeader);

        if (endHeaderIndex === -1) {
            throw new Error('Invalid PLY file: end_header not found');
        }

        const headerLines = headerText.slice(0, endHeaderIndex).split('\n');

        // Check if PLY
        if (!headerLines[0].startsWith('ply')) {
            throw new Error('Invalid PLY file: missing ply header');
        }

        // Get vertex count
        const vertexLine = headerLines.find(l => l.startsWith('element vertex'));
        if (!vertexLine) {
            throw new Error('Invalid PLY file: element vertex not found');
        }
        const vertexCount = parseInt(vertexLine.split(' ')[2]);

        // Parse properties
        const properties = [];
        let offset = 0;

        headerLines.forEach(line => {
            if (line.startsWith('property')) {
                const parts = line.split(' ');
                const type = parts[1];
                const name = parts[2];

                properties.push({
                    name: name,
                    type: type,
                    offset: offset
                });

                offset += this.getTypeSize(type);
            }
        });

        // Detect data format
        const hasSH = properties.some(p => p.name.startsWith('f_dc_'));
        const hasColors = properties.some(p => p.name === 'red' || p.name === 'r');

        return {
            headerEndIndex: endHeaderIndex + endHeader.length,
            vertexCount: vertexCount,
            properties: properties,
            rowSize: offset,
            hasSH: hasSH,
            hasColors: hasColors
        };
    }

    getTypeSize(type) {
        const sizes = {
            'char': 1,
            'uchar': 1,
            'short': 2,
            'ushort': 2,
            'int': 4,
            'uint': 4,
            'float': 4,
            'double': 8
        };
        return sizes[type] || 4;
    }

    parseVertices(arrayBuffer, headerData) {
        const dataView = new DataView(arrayBuffer, headerData.headerEndIndex);
        const vertices = [];

        for (let i = 0; i < headerData.vertexCount; i++) {
            const vertex = {};
            const baseOffset = i * headerData.rowSize;

            headerData.properties.forEach(prop => {
                const offset = baseOffset + prop.offset;
                vertex[prop.name] = this.readProperty(dataView, offset, prop.type);
            });

            vertices.push(vertex);
        }

        return vertices;
    }

    readProperty(dataView, offset, type) {
        const littleEndian = true;

        switch (type) {
            case 'float':
                return dataView.getFloat32(offset, littleEndian);
            case 'double':
                return dataView.getFloat64(offset, littleEndian);
            case 'uchar':
                return dataView.getUint8(offset);
            case 'char':
                return dataView.getInt8(offset);
            case 'ushort':
                return dataView.getUint16(offset, littleEndian);
            case 'short':
                return dataView.getInt16(offset, littleEndian);
            case 'uint':
                return dataView.getUint32(offset, littleEndian);
            case 'int':
                return dataView.getInt32(offset, littleEndian);
            default:
                return 0;
        }
    }
}

/**
 * Usage example
 */

// Example 1: Basic usage with URL
async function example1() {
    const viewer = new GaussianSplatViewer('renderCanvas');
    await viewer.initialize();
    await viewer.loadPLYFromUrl('assets/train.ply');
}

// Example 2: With drag and drop
async function example2() {
    const viewer = new GaussianSplatViewer('renderCanvas');
    await viewer.initialize();
    viewer.setupDragAndDrop();

    // Optionally load initial file
    await viewer.loadPLYFromUrl('assets/train.ply');
}

// Example 3: With error handling and progress
async function example3() {
    const viewer = new GaussianSplatViewer('renderCanvas');
    await viewer.initialize();

    try {
        await viewer.loadPLYFromUrl('assets/train.ply', {
            showLoadingUI: true,
            onProgress: (progress) => {
                console.log(`Loading progress: ${progress * 100}%`);
            },
            onError: (error) => {
                console.error('Load error:', error);
                alert(`Failed to load: ${error.message}`);
            }
        });

        console.log('Successfully loaded splat!');

    } catch (error) {
        console.error('Critical error:', error);
    }
}

// Export for use
export { CustomPLYParser };
