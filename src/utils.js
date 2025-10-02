// utils.js - Utility functions for Gaussian Splatting Viewer

/**
 * Sets up coordinate picking functionality - displays world coordinates on click
 * @param {Scene} scene - Babylon.js scene
 * @param {HTMLCanvasElement} canvas - HTML canvas element
 */
export function setupCoordinatePicking(scene, canvas) {
  const coordinatesDiv = document.getElementById("coordinates");

  if (!coordinatesDiv) {
    console.warn("⚠ Coordinates display element not found");
    return;
  }

  // Add click event listener to canvas
  canvas.addEventListener("click", (event) => {
    // Perform ray picking from camera through click point
    const pickResult = scene.pick(
      scene.pointerX,
      scene.pointerY
    );

    // Check if we hit something
    if (pickResult.hit && pickResult.pickedPoint) {
      const point = pickResult.pickedPoint;

      // Format coordinates to 3 decimal places
      const coords = {
        x: point.x.toFixed(3),
        y: point.y.toFixed(3),
        z: point.z.toFixed(3)
      };

      // Display in the coordinates div
      coordinatesDiv.innerHTML = `
        <strong>World Coordinates:</strong><br>
        X: ${coords.x}<br>
        Y: ${coords.y}<br>
        Z: ${coords.z}
      `;
      coordinatesDiv.style.display = "block";

      // Also log to console for debugging
      console.log("Picked Point:", coords);

      // Optional: Add a marker at the picked point
      // createMarker(scene, point);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        coordinatesDiv.style.display = "none";
      }, 5000);

    } else {
      // No hit - hide coordinates
      coordinatesDiv.style.display = "none";
      console.log("No object picked");
    }
  });
}

/**
 * Creates a visual marker at a specific point (optional enhancement)
 * @param {Scene} scene - Babylon.js scene
 * @param {Vector3} position - Position to place marker
 */
export function createMarker(scene, position) {
  // This is an optional enhancement for future implementation
  // Could create a small sphere or point marker at the clicked location

  // Example implementation (requires importing MeshBuilder):
  // import { MeshBuilder } from "@babylonjs/core";
  // const marker = MeshBuilder.CreateSphere("marker", { diameter: 0.1 }, scene);
  // marker.position = position;
  // marker.material = new StandardMaterial("markerMat", scene);
  // marker.material.emissiveColor = new Color3(1, 0, 0);
}

/**
 * Formats a number to fixed decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default 3)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 3) {
  return value.toFixed(decimals);
}

/**
 * Calculates distance between two Vector3 points
 * @param {Vector3} point1 - First point
 * @param {Vector3} point2 - Second point
 * @returns {number} Distance between points
 */
export function getDistance(point1, point2) {
  return point1.subtract(point2).length();
}

/**
 * Shows a temporary notification message
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
export function showNotification(message, duration = 3000) {
  const notification = document.createElement("div");
  notification.style.position = "absolute";
  notification.style.top = "50%";
  notification.style.left = "50%";
  notification.style.transform = "translate(-50%, -50%)";
  notification.style.background = "rgba(0, 0, 0, 0.8)";
  notification.style.color = "white";
  notification.style.padding = "15px 25px";
  notification.style.borderRadius = "8px";
  notification.style.fontSize = "16px";
  notification.style.zIndex = "1000";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, duration);
}
