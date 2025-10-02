// main-global.js - Babylon.js Gaussian Splatting Viewer (Global BABYLON object)

// Wait for DOM and Babylon.js to be ready
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Babylon.js viewer...');

  // Get canvas element
  const canvas = document.getElementById("renderCanvas");
  const loadingElement = document.getElementById("loading");

  if (!canvas) {
    throw new Error("Fatal: Canvas element 'renderCanvas' not found in DOM");
  }

  if (!window.BABYLON) {
    throw new Error("Fatal: Babylon.js library not loaded");
  }

  console.log('✓ Babylon.js library loaded');

  // Initialize Babylon.js Engine
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
  });

  console.log("✓ Babylon.js Engine initialized");

  // Create the scene
  const scene = createScene(engine, canvas);
  console.log("✓ Scene created successfully");

  // Hide loading indicator after scene is created
  setTimeout(() => {
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }, 1000);

  // Setup coordinate picking
  setupCoordinatePicking(scene, canvas);
  console.log("✓ Coordinate picking enabled");

  // Start the render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  console.log("✓ Render loop started");

  // Handle window resize
  window.addEventListener("resize", () => {
    engine.resize();
  });

  // Cleanup on page unload
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
});

// Create Scene Function
function createScene(engine, canvas) {
  const scene = new BABYLON.Scene(engine);

  // Set background color
  scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.15);

  // Create ArcRotateCamera
  const camera = new BABYLON.ArcRotateCamera(
    "mainCamera",
    -Math.PI / 2,
    Math.PI / 3,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );

  camera.lowerRadiusLimit = 0.5;
  camera.upperRadiusLimit = 100;
  camera.wheelPrecision = 50;
  camera.panningSensibility = 100;
  camera.attachControl(canvas, true);

  // Add ambient light
  const light = new BABYLON.HemisphericLight(
    "ambientLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.7;

  // Load Gaussian Splatting model
  loadGaussianSplatModel(scene);

  return scene;
}

// Load Gaussian Splatting Model
function loadGaussianSplatModel(scene) {
  console.log("Loading Gaussian Splatting model: assets/train.splat");

  BABYLON.SceneLoader.ImportMesh(
    null,
    "assets/",
    "train.splat",
    scene,
    function(meshes) {
      // Success callback
      if (meshes && meshes.length > 0) {
        console.log(`✓ Gaussian Splatting model loaded successfully`);
        console.log(`  Meshes loaded: ${meshes.length}`);

        const splatMesh = meshes[0];

        // Log bounding box info
        if (splatMesh.getBoundingInfo) {
          const boundingBox = splatMesh.getBoundingInfo().boundingBox;
          const size = boundingBox.maximum.subtract(boundingBox.minimum);
          console.log(`  Bounding box size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        }
      } else {
        console.warn("⚠ Model loaded but no meshes found");
      }
    },
    function(evt) {
      // Progress callback
      if (evt.lengthComputable) {
        const percent = (evt.loaded / evt.total * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      }
    },
    function(scene, message, exception) {
      // Error callback
      console.error("✗ Failed to load Gaussian Splatting model:", message);
      showErrorMessage(
        "Failed to load 3D model. Please check:\n" +
        "1. train.splat file exists in assets/ folder\n" +
        "2. File is a valid .splat format\n" +
        "3. Browser console for details"
      );
    }
  );
}

// Setup Coordinate Picking
function setupCoordinatePicking(scene, canvas) {
  const coordinatesDiv = document.getElementById("coordinates");

  if (!coordinatesDiv) {
    console.warn("⚠ Coordinates display element not found");
    return;
  }

  canvas.addEventListener("click", function(event) {
    const pickResult = scene.pick(scene.pointerX, scene.pointerY);

    if (pickResult.hit && pickResult.pickedPoint) {
      const point = pickResult.pickedPoint;

      const coords = {
        x: point.x.toFixed(3),
        y: point.y.toFixed(3),
        z: point.z.toFixed(3)
      };

      coordinatesDiv.innerHTML = `
        <strong>World Coordinates:</strong><br>
        X: ${coords.x}<br>
        Y: ${coords.y}<br>
        Z: ${coords.z}
      `;
      coordinatesDiv.style.display = "block";

      console.log("Picked Point:", coords);

      setTimeout(() => {
        coordinatesDiv.style.display = "none";
      }, 5000);

    } else {
      coordinatesDiv.style.display = "none";
      console.log("No object picked");
    }
  });
}

// Show Error Message
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 10000);
}
