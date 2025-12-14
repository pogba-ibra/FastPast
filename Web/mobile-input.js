// Mobile-optimized URL input functionality
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("video-url");
  const processBtn = document.getElementById("process-btn");

  // Mobile-optimized auto-expanding input height
  function adjustInputHeight() {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Set initial height
      urlInput.style.height = "auto";

      // Use fixed height of 50px
      urlInput.style.height = "50px";

      // Match the process button height to the input
      if (processBtn) {
        processBtn.style.height = "50px";
      }

      // Use fixed height of 50px
      urlInput.style.overflowY = "hidden";
    } else {
      // Use fixed height on desktop
      urlInput.style.height = "50px";
      urlInput.style.overflowY = "hidden";
      if (processBtn) {
        processBtn.style.height = "50px";
      }
    }
  }

  if (urlInput) {
    // Adjust height on input
    urlInput.addEventListener("input", adjustInputHeight);

    // Adjust height on window resize
    window.addEventListener("resize", adjustInputHeight);

    // Initial height adjustment
    adjustInputHeight();
  }
});
