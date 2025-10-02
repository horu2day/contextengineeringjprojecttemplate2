// viewer.js - Core Gaussian Splatting Viewer Logic

import {
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Color3,
  SceneLoader
} from "@babylonjs/core";

// CRITICAL: Import loaders as side-effect to register .splat/.ply support
import "@babylonjs/loaders";

/**
 * Creates and configures the main Babylon.js scene with Gaussian Splatting support
 * @param {Engine} engine - Babylon.js rendering engine
 * @param {HTMLCanvasElement} canvas - HTML canvas element
 * @returns {Scene} Configured Babylon.js scene
 */
export function createScene(engine, canvas) {
  // Create scene
  const scene = new Scene(engine);

  // Set background color (dark gray for better visibility)
  scene.clearColor = new Color3(0.1, 0.1, 0.15);

  // CRITICAL: Use left-handed coordinate system (default)
  // Gaussian Splatting does NOT support right-handed systems
  // scene.useRightHandedSystem = false; // This is default, just noting it

  // Create ArcRotateCamera for 3D viewer
  // Parameters: name, alpha (horizontal), beta (vertical), radius, target, scene
  const camera = new ArcRotateCamera(
    "mainCamera",
    -Math.PI / 2,      // Start facing forward
    Math.PI / 3,       // Slightly elevated view (~60 degrees)
    10,                // Distance from target
    Vector3.Zero(),    // Look at origin
    scene
  );

  // Camera configuration
  camera.lowerRadiusLimit = 0.5;    // Minimum zoom distance
  camera.upperRadiusLimit = 100;    // Maximum zoom distance
  camera.wheelPrecision = 50;       // Zoom sensitivity
  camera.panningSensibility = 100;  // Pan sensitivity

  // Attach camera controls to canvas
  camera.attachControl(canvas, true);

  // Add ambient light (Gaussian Splatting doesn't need strong lighting)
  const light = new HemisphericLight(
    "ambientLight",
    new Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.7;

  // Load Gaussian Splatting model asynchronously
  loadGaussianSplatModel(scene);

  return scene;
}

/**
 * Loads Gaussian Splatting model from assets folder
 * @param {Scene} scene - Babylon.js scene to add model to
 */
async function loadGaussianSplatModel(scene) {
  try {
    console.log("Loading Gaussian Splatting model: assets/train.splat");

    // Use SceneLoader.ImportMeshAsync for loading .splat files
    // Parameters: meshesNames (null = all), rootUrl, sceneFilename, scene
    const result = await SceneLoader.ImportMeshAsync(
      null,              // Load all meshes
      "assets/",         // Root URL (relative to index.html)
      "train.splat",     // Filename
      scene
    );

    // Check if meshes were loaded
    if (result.meshes && result.meshes.length > 0) {
      console.log(`✓ Gaussian Splatting model loaded successfully`);
      console.log(`  Meshes loaded: ${result.meshes.length}`);

      // Get the main mesh
      const splatMesh = result.meshes[0];

      // Optional: Adjust mesh position if needed
      // splatMesh.position.y = 0;

      // Log mesh information
      if (splatMesh.getBoundingInfo) {
        const boundingBox = splatMesh.getBoundingInfo().boundingBox;
        const size = boundingBox.maximum.subtract(boundingBox.minimum);
        console.log(`  Bounding box size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      }

      // Auto-adjust camera to fit the model
      if (scene.activeCamera) {
        const camera = scene.activeCamera;
        if (camera.useAutoRotationBehavior !== undefined) {
          // Optionally enable auto-rotation
          // camera.useAutoRotationBehavior = true;
        }
      }

    } else {
      console.warn("⚠ Model loaded but no meshes found");
    }

  } catch (error) {
    console.error("✗ Failed to load Gaussian Splatting model:", error);

    // Display user-friendly error message
    showErrorMessage(
      "Failed to load 3D model. Please check:\n" +
      "1. train.splat file exists in assets/ folder\n" +
      "2. File is a valid .splat format\n" +
      "3. Browser console for details"
    );

    throw error;
  }
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 10000);
}
