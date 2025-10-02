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

  // Initialize Babylon.js Engine with performance optimizations
  const engine = new BABYLON.Engine(canvas, false, {  // antialiasing OFF for performance
    preserveDrawingBuffer: false,  // OFF for better performance
    stencil: false,  // OFF for better performance
    powerPreference: "high-performance"  // Use high-performance GPU
  });

  // Additional performance settings
  engine.enableOfflineSupport = false;  // Disable offline support
  engine.doNotHandleContextLost = true;  // Skip context lost handling

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

  // FPS display
  const fpsElement = document.getElementById('fpsValue');
  if (fpsElement) {
    setInterval(() => {
      const fps = engine.getFps().toFixed(0);
      fpsElement.textContent = fps;

      // Color code based on performance
      if (fps >= 30) {
        fpsElement.style.color = '#0f0';
      } else if (fps >= 15) {
        fpsElement.style.color = '#ff0';
      } else {
        fpsElement.style.color = '#f00';
      }
    }, 500);
  }

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

  // Performance optimizations for scene
  scene.autoClear = false;  // Don't clear every frame
  scene.autoClearDepthAndStencil = false;  // Skip depth/stencil clear
  scene.blockMaterialDirtyMechanism = true;  // Disable material dirty checks
  scene.skipFrustumClipping = true;  // Skip frustum culling for Gaussian Splatting

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

  // Create coordinate axes
  createAxes(scene);

  // Load Gaussian Splatting model
  // loadGaussianSplatModel(scene);

  return scene;
}

// Create Coordinate Axes
function createAxes(scene) {
  const axisX = BABYLON.MeshBuilder.CreateLines("axisX", {
    points: [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(1, 0, 0),
    ],
    colors: [
      new BABYLON.Color4(1, 0, 0, 1), new BABYLON.Color4(1, 0, 0, 1),
    ]
  }, scene);

  const axisY = BABYLON.MeshBuilder.CreateLines("axisY", {
    points: [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 1, 0),
    ],
    colors: [
      new BABYLON.Color4(0, 1, 0, 1), new BABYLON.Color4(0, 1, 0, 1),
    ]
  }, scene);

  const axisZ = BABYLON.MeshBuilder.CreateLines("axisZ", {
    points: [
      new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, 1),
    ],
    colors: [
      new BABYLON.Color4(0, 0, 1, 1), new BABYLON.Color4(0, 0, 1, 1),
    ]
  }, scene);
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
let performanceSettings = {
  maxSplatCount: 100000,  // 훨씬 더 낮은 기본값
  qualityMode: 0  // Low quality 기본값
};

function setupFileLoading(scene) {
  // Setup performance controls UI
  setupPerformanceControls(scene);
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

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const dataUrl = event.target.result;
      const fileExtension = "." + file.name.split(".").pop();

      // Set loader options for Gaussian Splatting performance optimization
      const loaderOptions = {
          maxSplatCount: 500000,  // Limit splat count for performance (default: unlimited)
      };

      BABYLON.SceneLoader.ImportMesh(
          null,
          "",
          dataUrl,
          scene,
          function (meshes) {
              // Success callback
              if (meshes && meshes.length > 0) {
                  console.log(`✓ Model loaded successfully: ${file.name}`);
                  console.log(`  Total meshes: ${meshes.length}`);
                  currentMeshes = meshes;

                  // Diagnostic logging
                  meshes.forEach((mesh, index) => {
                      console.log(`  Mesh ${index}:`, mesh.name);
                      if (mesh.getBoundingInfo) {
                          const boundingBox = mesh.getBoundingInfo().boundingBox;
                          const min = boundingBox.minimum;
                          const max = boundingBox.maximum;
                          const center = boundingBox.center;
                          const size = max.subtract(min);

                          console.log(`    Bounding Box Min: (${min.x.toFixed(3)}, ${min.y.toFixed(3)}, ${min.z.toFixed(3)})`);
                          console.log(`    Bounding Box Max: (${max.x.toFixed(3)}, ${max.y.toFixed(3)}, ${max.z.toFixed(3)})`);
                          console.log(`    Center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
                          console.log(`    Size: (${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)})`);
                      }
                  });

                  // Optimize Gaussian Splatting meshes
                  meshes.forEach(mesh => {
                      // Check if it's a Gaussian Splatting mesh
                      if (mesh.getClassName && mesh.getClassName() === 'GaussianSplattingMesh') {
                          console.log('  Optimizing Gaussian Splatting mesh...');

                          // Set worker count for parallel processing
                          if (mesh.setWorkerCount) {
                              mesh.setWorkerCount(navigator.hardwareConcurrency || 4);
                          }

                          // Apply current performance settings
                          if (mesh.setQualityMode) {
                              mesh.setQualityMode(performanceSettings.qualityMode);
                              console.log('  Quality mode:', performanceSettings.qualityMode);
                          }
                      }
                  });

                  // Dispatch event to show performance controls
                  window.dispatchEvent(new Event('modelLoaded'));

                  // Auto-frame the loaded model
                  frameMeshInCamera(meshes, scene);

                  showNotification(`✓ Loaded ${file.name}`);
              } else {
                  console.warn('⚠ Model loaded but no meshes found');
              }
              if (loadingElement) {
                  loadingElement.style.display = 'none';
              }
          },
          null,
          function (scene, message, exception) {
              // Error callback
              console.error(`✗ Failed to load model: ${message}`, exception);
              showErrorMessage(`Failed to load ${file.name}. The file may be corrupted or in an unsupported format. Please check the console for more details.`);
              if (loadingElement) {
                  loadingElement.style.display = 'none';
              }
          },
          fileExtension
      );
    } catch (error) {
        console.error("An unexpected error occurred during file processing:", error);
        showErrorMessage("An unexpected error occurred. Please check the console for details.");
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
  };
  reader.readAsDataURL(file);
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

// Auto-frame the loaded mesh in the camera view
function frameMeshInCamera(meshes, scene) {
  if (!meshes || meshes.length === 0) {
    console.warn('No meshes to frame');
    return;
  }

  const camera = scene.activeCamera;
  if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) {
    console.warn('Camera is not an ArcRotateCamera, cannot auto-frame');
    return;
  }

  // Calculate combined bounding box for all meshes
  let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
  let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

  meshes.forEach(mesh => {
    if (mesh.getBoundingInfo) {
      const boundingBox = mesh.getBoundingInfo().boundingBox;
      min = BABYLON.Vector3.Minimize(min, boundingBox.minimum);
      max = BABYLON.Vector3.Maximize(max, boundingBox.maximum);
    }
  });

  // Calculate center and size
  const center = BABYLON.Vector3.Center(min, max);
  const size = max.subtract(min);
  const maxDimension = Math.max(size.x, size.y, size.z);

  console.log('Auto-framing camera:');
  console.log(`  Combined bounding box center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
  console.log(`  Max dimension: ${maxDimension.toFixed(3)}`);

  // Set camera target to center of bounding box
  camera.setTarget(center);

  // Set camera radius based on bounding box size
  // Use a multiplier to ensure the entire model is visible
  const radiusMultiplier = 2.5;
  camera.radius = maxDimension * radiusMultiplier;

  console.log(`  Camera target set to: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
  console.log(`  Camera radius set to: ${camera.radius.toFixed(3)}`);
}

// Setup Performance Controls UI
function setupPerformanceControls(scene) {
  const controlsDiv = document.getElementById('performanceControls');
  const maxSplatCountSlider = document.getElementById('maxSplatCount');
  const maxSplatCountValue = document.getElementById('maxSplatCountValue');
  const qualityModeSelect = document.getElementById('qualityMode');
  const applyButton = document.getElementById('applySettings');

  // Update slider value display
  maxSplatCountSlider.addEventListener('input', (e) => {
    maxSplatCountValue.textContent = parseInt(e.target.value).toLocaleString();
  });

  // Apply settings button
  applyButton.addEventListener('click', () => {
    performanceSettings.maxSplatCount = parseInt(maxSplatCountSlider.value);
    performanceSettings.qualityMode = parseInt(qualityModeSelect.value);

    console.log('Performance settings updated:');
    console.log('  Max Splat Count:', performanceSettings.maxSplatCount);
    console.log('  Quality Mode:', performanceSettings.qualityMode);

    // Apply to current meshes
    if (currentMeshes.length > 0) {
      applyPerformanceSettings(currentMeshes);
      showNotification('⚙️ Settings applied! Reload model for Max Splats change.');
    } else {
      showNotification('⚙️ Settings saved! Load a model to apply.');
    }
  });

  // Show controls when file is loaded
  window.addEventListener('modelLoaded', () => {
    controlsDiv.style.display = 'block';
  });
}

// Apply performance settings to loaded meshes
function applyPerformanceSettings(meshes) {
  meshes.forEach(mesh => {
    if (mesh.getClassName && mesh.getClassName() === 'GaussianSplattingMesh') {
      console.log('Applying performance settings to mesh:', mesh.name);

      // Set quality mode
      if (mesh.setQualityMode) {
        mesh.setQualityMode(performanceSettings.qualityMode);
        console.log('  Quality mode:', performanceSettings.qualityMode);
      }

      // Note: maxSplatCount applies at load time, not runtime
      // User needs to reload the model for this to take effect
    }
  });
}
