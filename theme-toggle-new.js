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

    Object.keys(solarSystemElements).forEach(key => {
      const element = solarSystemElements[key];
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        const animationDuration = parseFloat(computedStyle.animationDuration);
        const animationDelay = parseFloat(computedStyle.animationDelay);
        const currentTime = Date.now() / 1000; // Convert to seconds

        // Calculate current progress in the animation cycle
        const totalDuration = animationDuration + animationDelay;
        const progress = (currentTime % totalDuration) / totalDuration;

        animationStates[key] = {
          progress: progress,
          duration: animationDuration,
          delay: animationDelay
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

        Object.keys(animationStates).forEach(key => {
          const element = solarSystemElements[key];
          const state = animationStates[key];

          if (element && state) {
            // Calculate the negative animation delay needed to start from saved position
            const negativeDelay = -state.duration * state.progress;

            // Apply the negative delay
            element.style.animationDelay = `${negativeDelay}s`;
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