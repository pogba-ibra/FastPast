/* eslint-disable */
// Theme toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get toggle inputs
  const mobileToggle = document.querySelector(".theme-toggle-mobile #input");
  const lampRopeToggle = document.getElementById("lamp-rope-toggle");
  const sunToggle = document.getElementById("sun");

  // Use the global dragging flag set by `script.js` when available
  // (`script.js` defines `let isDragging = false;` at global scope)

  // Store animation states for solar system elements
  const solarSystemElements = {
    earthSpin: document.querySelector(".earth-spin"),
    moonSpin: document.querySelector(".moon-spin"),
    venusSpin: document.querySelector(".venus-spin"),
    mercurySpin: document.querySelector(".mercury-spin"),
    marsSpin: document.querySelector(".mars-spin"),
  };

  // Save animation progress when switching to dark mode
  function saveAnimationProgress() {
    const animationStates = {};
    const currentTime = performance.now() / 1000; // More precise timing

    Object.keys(solarSystemElements).forEach((key) => {
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

        if (transform !== "none") {
          const values = transform.split("(")[1].split(")")[0].split(",");
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
          savedAt: currentTime,
        };
      }
    });

    // Save to localStorage
    localStorage.setItem(
      "solarSystemAnimationStates",
      JSON.stringify(animationStates)
    );
  }

  // Restore animation progress when switching back to light mode
  function restoreAnimationProgress() {
    const savedStates = localStorage.getItem("solarSystemAnimationStates");

    if (savedStates) {
      try {
        const animationStates = JSON.parse(savedStates);
        const currentTime = performance.now() / 1000;

        Object.keys(animationStates).forEach((key) => {
          const element = solarSystemElements[key];
          const state = animationStates[key];

          if (element && state) {
            // Force a restart of the animation
            element.style.animation = "none";
            element.offsetHeight; // Trigger reflow

            // Calculate the time elapsed since saving
            const elapsedTime = currentTime - state.savedAt;

            // Calculate the new animation delay based on saved progress and elapsed time
            const cycleTime = state.duration * 1000; // Convert to ms
            const savedPosition = state.progress * cycleTime;
            const newPosition =
              (savedPosition + elapsedTime * 1000) % cycleTime;
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

  // Function to toggle dark mode (uses `dark-mode` body class used throughout CSS)
  function toggleDarkMode(isDark) {
    // Save animation progress before switching to dark mode
    if (isDark) {
      saveAnimationProgress();
    }

    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.classList.toggle("dark-mode", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // Force update all elements immediately
    setTimeout(() => {
      if (isDark) {
        document.body.classList.add("dark-mode");
        document.documentElement.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
        document.documentElement.classList.remove("dark-mode");
      }
    }, 10);

    // Enhanced logging for debugging
    const newTheme = isDark ? "dark" : "light";
    console.log(`🔄 Theme switched to: ${newTheme} on page: ${window.location.pathname}`);
    console.log(`💾 Saved to localStorage: theme = "${newTheme}"`);

    if (lampRopeToggle) {
      lampRopeToggle.classList.toggle("dark-mode", isDark);
    }

    // Restore animation progress when switching back to light mode
    if (!isDark) {
      setTimeout(restoreAnimationProgress, 100); // Small delay to ensure DOM has updated
    }

    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: newTheme, isDark: isDark }
    }));
  }

  // Check for saved theme preference with enhanced persistence
  const savedTheme = localStorage.getItem("theme");

  // Default to light mode if no preference is saved
  let isDark;

  if (savedTheme === null || savedTheme === undefined) {
    isDark = false; // Default to light mode for new users
    console.log("🔆 No saved theme found, defaulting to light mode");
  } else {
    isDark = savedTheme === "dark";
  }

  console.log(`🎨 Theme persistence check: savedTheme = "${savedTheme}", isDark = ${isDark}`);
  console.log(`🔄 Current page: ${window.location.pathname}`);

  // Apply theme consistently based on saved preference
  try {
    if (isDark) {
      if (document.body) document.body.classList.add("dark-mode");
      if (document.documentElement) document.documentElement.classList.add("dark-mode");
      console.log("✅ Dark mode applied successfully");
    } else {
      if (document.body) document.body.classList.remove("dark-mode");
      if (document.documentElement) document.documentElement.classList.remove("dark-mode");
      console.log("✅ Light mode applied successfully");
    }
  } catch (error) {
    console.error("❌ Error applying theme:", error);
    // Fallback: try again after a short delay
    setTimeout(() => {
      try {
        if (isDark) {
          document.body.classList.add("dark-mode");
          document.documentElement.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
          document.documentElement.classList.remove("dark-mode");
        }
        console.log("✅ Theme applied successfully on retry");
      } catch (retryError) {
        console.error("❌ Failed to apply theme on retry:", retryError);
      }
    }, 100);
  }

  // Double-check application was successful (with safety checks)
  try {
    if (document.body) {
      const actuallyDark = document.body.classList.contains("dark-mode");
      if (isDark !== actuallyDark) {
        console.error(`❌ Theme application failed! Expected: ${isDark ? 'dark' : 'light'}, Actual: ${actuallyDark ? 'dark' : 'light'}`);
        // Force correct application
        if (isDark) {
          document.body.classList.add("dark-mode");
          if (document.documentElement) document.documentElement.classList.add("dark-mode");
        } else {
          document.body.classList.remove("dark-mode");
          if (document.documentElement) document.documentElement.classList.remove("dark-mode");
        }
      }
    }
  } catch (error) {
    console.error("❌ Error during theme verification:", error);
  }

  // Log the final applied theme
  if (isDark) {
    console.log(`🌙 Dark mode loaded for ${window.location.pathname}`);
  } else {
    console.log(`☀️ Light mode loaded for ${window.location.pathname}`);
  }

  // Set the mobile toggle state to match the saved theme
  if (mobileToggle) {
    mobileToggle.checked = isDark;
  }

  // Set the lamp rope toggle state to match the saved theme
  if (lampRopeToggle) {
    lampRopeToggle.classList.toggle("dark-mode", isDark);
  }

  // If we're starting in light mode but have saved animation states, restore them
  if (!isDark && localStorage.getItem("solarSystemAnimationStates")) {
    setTimeout(restoreAnimationProgress, 500);
  }

  // Only call toggleDarkMode if there's a saved preference and it differs from current state
  // This prevents unnecessary animation state saves on initial load
  if (savedTheme !== null) {
    const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    if (currentTheme !== savedTheme) {
      console.log(`🔄 Theme mismatch detected. Switching from ${currentTheme} to ${savedTheme}`);
      toggleDarkMode(isDark);
    }
  }

  // Set initial toggle state
  if (mobileToggle) {
    mobileToggle.checked = isDark;

    // Add event listener
    mobileToggle.addEventListener("change", function () {
      toggleDarkMode(this.checked);
    });

    // Modified sun toggle to prevent toggle when dragging solar system
    // Use the shared global dragging flag if available so both modules agree.
    if (sunToggle) {
      sunToggle.addEventListener("click", function (e) {
        const dragging =
          typeof window.isDragging !== "undefined" ? window.isDragging : false;
        if (!dragging) {
          const isDark = !mobileToggle.checked;
          toggleDarkMode(isDark);
          mobileToggle.checked = isDark;
        }
      });
    }
  }
});
