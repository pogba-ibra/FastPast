/* eslint-disable */
// Theme toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get toggle inputs
  const mobileToggle = document.querySelector(".theme-toggle-mobile #input");
  const lampRopeToggle = document.getElementById("lamp-rope-toggle");
  const sunToggle = document.getElementById("sun");

  // Store animation states for solar system elements
  const solarSystemElements = {
    earthSpin: document.querySelector(".earth-spin"),
    moonSpin: document.querySelector(".moon-spin"),
    venusSpin: document.querySelector(".venus-spin"),
    mercurySpin: document.querySelector(".mercury-spin"),
    marsSpin: document.querySelector(".mars-spin")
  };

  // Save animation progress when switching to dark mode
  function saveAnimationProgress() {
    const animationStates = {};
    const currentTime = performance.now() / 1000; // More precise timing

    Object.keys(solarSystemElements).forEach(key => {
      const element = solarSystemElements[key];
      if (element) {
        // Store element reference and computed styles
        const computedStyle = window.getComputedStyle(element);
        const animationName = computedStyle.animationName;
        const animationDuration = parseFloat(computedStyle.animationDuration);
        const animationDelay = parseFloat(computedStyle.animationDelay);

        // Get the current transform matrix to calculate rotation
        const transform = window.getComputedStyle(element).transform;
        let rotation = 0;

        if (transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = values[0];
          const b = values[1];
          rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        }

        // Calculate progress based on rotation (0-360 degrees)
        const progress = (rotation % 360) / 360;

        animationStates[key] = {
          progress: progress,
          duration: animationDuration,
          delay: animationDelay,
          animationName: animationName,
          savedAt: currentTime
        };
      }
    });

    // Save to localStorage
    localStorage.setItem("solarSystemAnimationStates", JSON.stringify(animationStates));
  }

  // Restore animation progress when switching back to light mode
  function restoreAnimationProgress() {
    const savedStates = localStorage.getItem("solarSystemAnimationStates");

    if (savedStates) {
      try {
        const animationStates = JSON.parse(savedStates);
        const currentTime = performance.now() / 1000;

        Object.keys(animationStates).forEach(key => {
          const element = solarSystemElements[key];
          const state = animationStates[key];

          if (element && state) {
            // Force a restart of the animation
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow

            // Calculate the time elapsed since saving
            const elapsedTime = currentTime - state.savedAt;

            // Calculate the new animation delay based on saved progress and elapsed time
            const cycleTime = state.duration * 1000; // Convert to ms
            const savedPosition = state.progress * cycleTime;
            const newPosition = (savedPosition + elapsedTime * 1000) % cycleTime;
            const newDelay = -newPosition / 1000; // Convert back to seconds

            // Apply the animation with the new delay
            element.style.animation = `${state.animationName} ${state.duration}s linear infinite`;
            element.style.animationDelay = `${newDelay}s`;
          }
        });

        // Clear saved states after restoring
        localStorage.removeItem("solarSystemAnimationStates");
      } catch (e) {
        console.error("Error restoring animation states:", e);
      }
    }
  }

  // Function to toggle dark mode
  function toggleDarkMode(isDark) {
    // Save animation progress before switching to dark mode
    if (isDark) {
      saveAnimationProgress();
    }

    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");

    if (lampRopeToggle) {
      lampRopeToggle.classList.toggle("dark-mode", isDark);
    }

    // Restore animation progress when switching back to light mode
    if (!isDark) {
      setTimeout(restoreAnimationProgress, 100); // Small delay to ensure DOM has updated
    }
  }

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme");
  const isDark = savedTheme === "dark";

  // If we're starting in light mode but have saved animation states, restore them
  if (!isDark && localStorage.getItem("solarSystemAnimationStates")) {
    setTimeout(restoreAnimationProgress, 500);
  }

  // Set initial theme
  toggleDarkMode(isDark);

  // Set initial toggle state
  if (mobileToggle) {
    mobileToggle.checked = isDark;

    // Add event listener
    mobileToggle.addEventListener("change", function () {
      toggleDarkMode(this.checked);
    });

    // Modified sun toggle to prevent toggle when dragging solar system
    if (sunToggle) {
      sunToggle.addEventListener("click", function (e) {
        if (!isDragging) {
          const isDark = !mobileToggle.checked;
          toggleDarkMode(isDark);
          mobileToggle.checked = isDark;
        }
      });
    }
  }
});