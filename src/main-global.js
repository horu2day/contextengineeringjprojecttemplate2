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

  // Setup drag & drop file loading
  setupFileLoading(scene);
  console.log("✓ File loading enabled (drag & drop / button)");

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

// Setup File Loading (Drag & Drop + Button)
let currentMeshes = []; // Track loaded meshes for cleanup

function setupFileLoading(scene) {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const body = document.body;

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    body.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop zone when item is dragged over
  ['dragenter', 'dragover'].forEach(eventName => {
    body.addEventListener(eventName, () => {
      dropZone.style.display = 'block';
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    body.addEventListener(eventName, () => {
      dropZone.style.display = 'none';
    }, false);
  });

  // Handle dropped files
  body.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files, scene);
  }, false);

  // Handle file input button
  fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    handleFiles(files, scene);
  }, false);
}

function handleFiles(files, scene) {
  if (files.length === 0) return;

  const file = files[0];
  const fileName = file.name.toLowerCase();

  // Check file extension
  if (!fileName.endsWith('.splat') && !fileName.endsWith('.ply')) {
    showErrorMessage('Invalid file format. Please upload .splat or .ply files only.');
    console.error('Invalid file format:', fileName);
    return;
  }

  console.log(`Loading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

  // Clear previous meshes
  clearPreviousMeshes();

  // Show loading indicator
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.textContent = `Loading ${file.name}...`;
    loadingElement.style.display = 'block';
  }

  // Read file as ArrayBuffer and load it
  const reader = new FileReader();

  reader.onload = function(event) {
    const arrayBuffer = event.target.result;

    // Convert ArrayBuffer to Blob with correct MIME type
    const blob = new Blob([arrayBuffer]);
    const blobUrl = URL.createObjectURL(blob);

    // CRITICAL: Append original filename so Babylon.js can detect file type
    // Use both methods for maximum compatibility
    const finalUrl = blobUrl + '#' + file.name;

    // Load using Babylon.js SceneLoader with explicit filename
    BABYLON.SceneLoader.ImportMesh(
      null,              // meshesNames (null = load all)
      blobUrl + '?',     // rootUrl (blob with separator)
      file.name,         // sceneFilename (original filename with extension)
      scene,
      function(meshes) {
        // Success callback
        if (meshes && meshes.length > 0) {
          console.log(`✓ Model loaded successfully: ${file.name}`);
          console.log(`  Meshes loaded: ${meshes.length}`);

          // Store meshes for later cleanup
          currentMeshes = meshes;

          const splatMesh = meshes[0];

          // Log bounding box info
          if (splatMesh.getBoundingInfo) {
            const boundingBox = splatMesh.getBoundingInfo().boundingBox;
            const size = boundingBox.maximum.subtract(boundingBox.minimum);
            console.log(`  Bounding box size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
          }

          // Auto-focus camera on the new model
          if (scene.activeCamera) {
            scene.activeCamera.setTarget(splatMesh.position);
          }

          // Show success notification
          showNotification(`✓ Loaded: ${file.name}`, 3000);
        } else {
          console.warn("⚠ Model loaded but no meshes found");
        }

        // Hide loading indicator
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
      },
      function(evt) {
        // Progress callback
        if (evt.lengthComputable) {
          const percent = (evt.loaded / evt.total * 100).toFixed(0);
          console.log(`Loading: ${percent}%`);
          if (loadingElement) {
            loadingElement.textContent = `Loading ${file.name}... ${percent}%`;
          }
        }
      },
      function(scene, message, exception) {
        // Error callback
        console.error("✗ Failed to load model:", message);
        console.error("Exception:", exception);
        showErrorMessage(`Failed to load ${file.name}. File may be corrupted or in unsupported format.`);

        if (loadingElement) {
          loadingElement.style.display = 'none';
        }

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl);
      }
    );
  };

  reader.onerror = function() {
    console.error("✗ Failed to read file");
    showErrorMessage(`Failed to read ${file.name}. Please try again.`);
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  };

  // Start reading the file
  reader.readAsArrayBuffer(file);
}

function clearPreviousMeshes() {
  if (currentMeshes.length > 0) {
    console.log(`Removing ${currentMeshes.length} previous mesh(es)`);
    currentMeshes.forEach(mesh => {
      mesh.dispose();
    });
    currentMeshes = [];
  }
}

function showNotification(message, duration = 3000) {
  const notification = document.createElement("div");
  notification.style.position = "absolute";
  notification.style.top = "50%";
  notification.style.left = "50%";
  notification.style.transform = "translate(-50%, -50%)";
  notification.style.background = "rgba(0, 200, 100, 0.9)";
  notification.style.color = "white";
  notification.style.padding = "15px 25px";
  notification.style.borderRadius = "8px";
  notification.style.fontSize = "16px";
  notification.style.zIndex = "1000";
  notification.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5)";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, duration);
}
