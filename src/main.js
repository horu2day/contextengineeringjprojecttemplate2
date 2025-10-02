// main.js - Babylon.js Gaussian Splatting Viewer Entry Point

import { Engine } from "@babylonjs/core";
import { createScene } from "./viewer.js";
import { setupCoordinatePicking } from "./utils.js";

// Get canvas element
const canvas = document.getElementById("renderCanvas");
const loadingElement = document.getElementById("loading");

if (!canvas) {
  throw new Error("Fatal: Canvas element 'renderCanvas' not found in DOM");
}

// Initialize Babylon.js Engine
// Anti-alias = true for better visual quality
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,  // Enable screenshots
  stencil: true                 // Enable stencil buffer
});

console.log("✓ Babylon.js Engine initialized");

// Create the scene using our viewer module
let scene;
try {
  scene = createScene(engine, canvas);
  console.log("✓ Scene created successfully");

  // Hide loading indicator after scene is created
  setTimeout(() => {
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }, 1000);

  // Setup coordinate picking functionality
  setupCoordinatePicking(scene, canvas);
  console.log("✓ Coordinate picking enabled");

} catch (error) {
  console.error("✗ Failed to create scene:", error);
  if (loadingElement) {
    loadingElement.textContent = "Error: Failed to initialize viewer";
    loadingElement.style.color = "#ff4444";
  }
  throw error;
}

// Start the render loop
engine.runRenderLoop(() => {
  scene.render();
});

console.log("✓ Render loop started");

// Handle window resize
window.addEventListener("resize", () => {
  engine.resize();
});

// Cleanup on page unload to prevent memory leaks
window.addEventListener("beforeunload", () => {
  console.log("Cleaning up Babylon.js resources...");
  scene.dispose();
  engine.dispose();
});

// Optional: Display FPS in console (debug mode)
if (window.location.search.includes("debug")) {
  setInterval(() => {
    console.log(`FPS: ${engine.getFps().toFixed(1)}`);
  }, 1000);
}

console.log("✓ Babylon.js Gaussian Splatting Viewer initialized");
console.log("  Controls: Left Mouse = Rotate, Scroll = Zoom, Right Mouse = Pan");
