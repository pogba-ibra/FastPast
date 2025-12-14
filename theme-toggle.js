// Theme toggle functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get toggle inputs
  const mobileToggle = document.querySelector(".theme-toggle-mobile #input");
  const lampRopeToggle = document.getElementById("lamp-rope-toggle");
  const sunToggle = document.getElementById("sun");

  // Function to toggle dark mode
  function toggleDarkMode(isDark) {
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (lampRopeToggle) {
      lampRopeToggle.classList.toggle("dark-mode", isDark);
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

    /* global isDragging */
    // Modified sun toggle to prevent toggle when dragging solar system
    if (sunToggle) {
      sunToggle.addEventListener("click", function () {
        if (!isDragging) {
          const isDark = !mobileToggle.checked;
          toggleDarkMode(isDark);
          mobileToggle.checked = isDark;
        }
      });
    }
  }
});
