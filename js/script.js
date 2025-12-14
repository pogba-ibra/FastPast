// Lamp Rope Toggle Interactive Functionality
document.addEventListener("DOMContentLoaded", function () {
  const ropeToggle = document.querySelector(".lamp-rope-toggle");
  if (!ropeToggle) return;

  let isDragging = false;
  let startAngle = 0;
  let currentAngle = 0;

  // Get the center point of the rope base
  function getRopeCenter() {
    const rect = ropeToggle.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    };
  }

  // Calculate angle from rope center to mouse position
  function calculateAngle(mouseX, mouseY) {
    const center = getRopeCenter();
    const deltaX = mouseX - center.x;
    const deltaY = mouseY - center.y;

    // Calculate angle in degrees
    let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);

    // Limit angle to reasonable swing range (-45 to 45 degrees)
    angle = Math.max(-45, Math.min(45, angle));

    return angle;
  }

  // Mouse events
  ropeToggle.addEventListener("mousedown", function (e) {
    isDragging = true;
    ropeToggle.style.cursor = "grabbing";
    ropeToggle.style.animation = "none"; // Stop automatic swing
    startAngle = calculateAngle(e.clientX, e.clientY);
    currentAngle = startAngle;
    // ropeRect = ropeToggle.getBoundingClientRect(); // Unused

    // Force restart pulling animation
    ropeToggle.classList.remove("pulling");
    ropeToggle.offsetHeight; // Force reflow
    ropeToggle.classList.add("pulling");
  });

  document.addEventListener("mousemove", function (e) {
    if (!isDragging) return;

    currentAngle = calculateAngle(e.clientX, e.clientY);

    // Apply rotation
    ropeToggle.style.transform = `translateX(-50%) rotate(${currentAngle}deg)`;
  });

  document.addEventListener("mouseup", function () {
    if (!isDragging) return;

    isDragging = false;
    ropeToggle.style.cursor = "grab";
    ropeToggle.classList.remove("pulling");

    // Resume automatic swing after a short delay
    setTimeout(() => {
      ropeToggle.style.animation =
        "swing 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite";
      ropeToggle.style.transform = "";
    }, 500);
  });

  // Touch events for mobile
  ropeToggle.addEventListener("touchstart", function (e) {
    e.preventDefault();
    const touch = e.touches[0];
    isDragging = true;
    ropeToggle.style.cursor = "grabbing";
    ropeToggle.style.animation = "none";
    startAngle = calculateAngle(touch.clientX, touch.clientY);
    currentAngle = startAngle;

    // Force restart pulling animation
    ropeToggle.classList.remove("pulling");
    ropeToggle.offsetHeight; // Force reflow
    ropeToggle.classList.add("pulling");
  });

  document.addEventListener("touchmove", function (e) {
    if (!isDragging) return;

    e.preventDefault();
    const touch = e.touches[0];
    currentAngle = calculateAngle(touch.clientX, touch.clientY);

    ropeToggle.style.transform = `translateX(-50%) rotate(${currentAngle}deg)`;
  });

  document.addEventListener("touchend", function () {
    if (!isDragging) return;

    isDragging = false;
    ropeToggle.style.cursor = "grab";
    ropeToggle.classList.remove("pulling");

    setTimeout(() => {
      ropeToggle.style.animation =
        "swing 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite";
      ropeToggle.style.transform = "";
    }, 500);
  });

  // Prevent context menu on right click
  ropeToggle.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
});
