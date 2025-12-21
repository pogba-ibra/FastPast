/* global */
// This file will contain the JavaScript logic for video downloading.

// Global variable for tracking drag state (used by both rope and theme toggle)

// Playlist state (global scope)
const playlistState = {
  videos: [],
  currentIndex: 0,
  playlistId: null,
  nextPageToken: null,
  isPlaylist: false
};

let isDragging = false;
const playerCache = {}; // Cache for video data and iframes
window.playlistItemPromises = {}; // Promise cache for deduplication

// Wrapper to prevent duplicate requests
async function fetchVideoCacheAware(index, videoUrl) {
  // 1. Check if data already exists in state
  if (window.playlistItemState[index]) {
    // console.log(`Returning cached state for ${index}`);
    return window.playlistItemState[index];
  }

  // 2. Check if a request is already in progress
  if (window.playlistItemPromises[index]) {
    // console.log(`Joining existing promise for ${index}`);
    return window.playlistItemPromises[index];
  }

  // 3. Start new request
  // console.log(`Starting new fetch for ${index}`);
  const promise = fetchVideoData(videoUrl)
    .then(data => {
      window.playlistItemState[index] = data; // Cache data
      delete window.playlistItemPromises[index]; // Clear promise
      return data;
    })
    .catch(err => {
      delete window.playlistItemPromises[index]; // Clear failed promise
      throw err;
    });

  window.playlistItemPromises[index] = promise;
  return promise;
}

// Stub for setupSliders function
function setupSliders() {
  console.log("Sliders setup");
}

// eslint-disable-next-line no-unused-vars
async function openDownloadsFolder() {
  try {
    await fetch('/open-downloads-folder');
  } catch (err) {
    console.error("Failed to request folder open:", err);
    alert("Could not open folder automatically. Please check your Downloads/FastPast folder.");
  }
}

// Global function to fetch video data (needed by playlist options)
// TODO: This needs a real backend endpoint - using mock data for now
async function fetchVideoData(videoUrl) {
  try {
    const response = await fetch(`/video-info?url=${encodeURIComponent(videoUrl)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch video data");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching video data:", error);
    // Fallback or re-throw? Re-throw so caller handles it
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("video-url");
  const processBtn = document.getElementById("process-btn");
  const processingStatus = document.getElementById("processing-status");
  const videoPreview = document.getElementById("video-preview");
  const videoPlayer = document.getElementById("video-player");
  const videoThumbnail = document.getElementById("video-thumbnail");
  const videoTitle = document.getElementById("video-title");
  const formatSelect = document.getElementById("format");
  const qualitySelect = document.getElementById("quality");
  const downloadBtn = document.getElementById("download-btn");
  const downloadOtherBtn = document.getElementById("download-other-btn");
  const successMessage = document.getElementById("success-message");
  const downloadProgressText = document.getElementById("download-progress-text");
  const defaultProgressMarkup = downloadProgressText ? downloadProgressText.innerHTML : "";
  // ========== Playlist Navigation Functions ==========

  // Fetch playlist videos from server
  async function fetchPlaylistVideos(playlistUrl, pageToken = null) {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      console.log('Fetching playlist with token:', sessionToken ? 'Present' : 'Missing');
      const headers = { 'Content-Type': 'application/json' };

      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }

      const response = await fetch('/get-playlist-videos', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ playlistUrl, pageToken })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch playlist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  }

  // Helper to create iframe
  function createIframe(videoUrl) {
    const embedUrl = getEmbedUrl(videoUrl);
    if (!embedUrl) return null;

    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.style.display = "none";
    iframe.classList.add("cached-iframe");

    // Copy classes from original if any
    iframe.classList.add("video-expand"); // From showVideoPreview

    const container = document.getElementById("video-container");
    container.appendChild(iframe);
    return iframe;
  }

  // Prefetch next video
  async function prefetchNextVideo(index) {
    if (index >= playlistState.videos.length && !playlistState.nextPageToken) return;
    if (playerCache[index]) return; // Already cached

    const nextBtn = document.getElementById('next-video-btn');
    // Save original content only if not already spinner
    // But we might be calling this multiple times? 
    // We should check if we are already loading?
    // For simplicity, just set innerHTML

    let originalIcon = '<i class="fas fa-chevron-right"></i>';

    // Show loading spinner on next button
    if (nextBtn) {
      nextBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      nextBtn.disabled = true;
    }

    try {
      let video;
      if (index < playlistState.videos.length) {
        video = playlistState.videos[index];
      } else {
        // Logic for fetching next page would go here if we supported true prefetching of *pages*
        // For now return
        if (nextBtn) {
          nextBtn.innerHTML = originalIcon;
          nextBtn.disabled = false;
        }
        return;
      }

      const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
      const data = await fetchVideoData(videoUrl);

      // Create iframe and cache it logic
      const iframe = createIframe(videoUrl);

      playerCache[index] = { data, iframe };

    } catch (error) {
      console.error("Prefetch error:", error);
    } finally {
      if (nextBtn) {
        nextBtn.innerHTML = originalIcon;
        nextBtn.disabled = false;
      }
    }
  }

  // Navigate to specific video in playlist
  async function navigateToVideo(index) {
    if (index < 0 || index >= playlistState.videos.length) {
      return;
    }

    // Hide all iframes
    const iframes = document.querySelectorAll("#video-container iframe");
    iframes.forEach(f => f.style.display = "none");

    playlistState.currentIndex = index;
    const video = playlistState.videos[index];
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

    // Update input
    const urlInput = document.getElementById('video-url');
    const processingStatus = document.getElementById('processing-status');

    if (urlInput) {
      urlInput.value = videoUrl;
    }

    // Update UI controls
    document.getElementById('current-video-index').textContent = index + 1;
    document.getElementById('prev-video-btn').disabled = index === 0;
    const nextBtn = document.getElementById('next-video-btn');
    if (nextBtn) {
      nextBtn.disabled = index === playlistState.videos.length - 1 && !playlistState.nextPageToken;
    }

    // Check Cache
    if (playerCache[index]) {
      const { data, iframe } = playerCache[index];

      if (iframe) {
        iframe.style.display = "block";
        if (videoThumbnail) videoThumbnail.style.display = "none";
      } else {
        // Should not happen if we cached correctly, but maybe fail safe
      }

      updateUIWithData(data);

      // Trigger next prefetch
      prefetchNextVideo(index + 1);
      return;
    }

    // Not cached
    if (processingStatus) {
      processingStatus.style.display = 'block';
    }

    try {
      // Hide preview during load if not cached (standard behavior)
      // const videoPreview = document.getElementById("video-preview"); // Unused
      // videoPreview.style.display = "none"; // optional, prevent flicker

      const data = await fetchVideoData(videoUrl);

      // Create iframe
      let iframe;

      // Use createIframe helper
      iframe = createIframe(videoUrl);
      if (iframe) {
        iframe.style.display = "block";
        if (videoThumbnail) videoThumbnail.style.display = "none";
      }

      playerCache[index] = { data, iframe };

      updateUIWithData(data);

      // Trigger next prefetch
      prefetchNextVideo(index + 1);

    } catch (error) {
      console.error('Error loading video:', error);
      alert('Failed to load video: ' + error.message);
      if (processingStatus) {
        processingStatus.style.display = 'none';
      }
    }

    // Lazy load more logic
    if (index >= playlistState.videos.length - 3 && playlistState.nextPageToken) {
      const playlistUrl = `https://www.youtube.com/playlist?list=${playlistState.playlistId}`;
      fetchPlaylistVideos(playlistUrl, playlistState.nextPageToken)
        .then(data => {
          playlistState.videos.push(...data.videos);
          playlistState.nextPageToken = data.nextPageToken;
          const totalText = playlistState.videos.length + (data.nextPageToken ? '+' : '');
          document.getElementById('total-videos').textContent = totalText;
        })
        .catch(error => console.error('Error loading more videos:', error));
    }
  }

  // Initialize playlist navigation
  function initPlaylistNavigation() {
    const prevBtn = document.getElementById('prev-video-btn');
    const nextBtn = document.getElementById('next-video-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        navigateToVideo(playlistState.currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        navigateToVideo(playlistState.currentIndex + 1);
      });
    }
  }

  // Initialize navigation
  initPlaylistNavigation();

  // ========== End Playlist Functions ==========


  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navMenu = document.getElementById("nav-menu");
  const lampRopeToggle = document.getElementById("lamp-rope-toggle");

  // Highlight current page in menu
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const menuLinks = document.querySelectorAll("#nav-menu a");
  menuLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.parentElement.classList.add("selected");
    }
  });

  // Hamburger menu toggle
  hamburgerBtn.addEventListener("click", () => {
    const checkbox = document.getElementById("menu-checkbox");
    checkbox.checked = !checkbox.checked;
    navMenu.classList.toggle("active");
    document.body.classList.toggle("nav-open");
    hamburgerBtn.classList.toggle("menu-open");
    document.getElementById("blur-overlay").classList.toggle("active");
  });

  // Helper function to close mobile menu
  function closeMobileMenu() {
    const checkbox = document.getElementById("menu-checkbox");
    if (checkbox.checked) {
      checkbox.checked = false;
      navMenu.classList.remove("active");
      document.body.classList.remove("nav-open");
      hamburgerBtn.classList.remove("menu-open");
      document.getElementById("blur-overlay").classList.remove("active");
    }
  }

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      navMenu.classList.contains("active") &&
      !navMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      !document.getElementById("blur-overlay").contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Close menu when clicking on blur overlay
  document.getElementById("blur-overlay").addEventListener("click", () => {
    closeMobileMenu();
  });

  // Close menu button
  const closeMenuBtn = document.getElementById("close-menu-btn");
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", () => {
      closeMobileMenu();
    });
  }

  // Parallax effect removed as per user request

  // Go Premium button
  const goPremiumBtns = document.querySelectorAll(".go-premium-btn");

  // Hide Go Premium buttons on pricing page
  if (currentPath === "pricing.html") {
    goPremiumBtns.forEach((btn) => {
      btn.style.display = "none";
    });
  } else {
    goPremiumBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Scroll to pricing-tiers section with smooth behavior
        const pricingSection = document.querySelector(".pricing-tiers");
        if (pricingSection) {
          // Close mobile menu first if open
          closeMobileMenu();

          pricingSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          // Trigger fade-in animation
          setTimeout(() => {
            pricingSection.classList.add("fade-in");
          }, 100);
        }
      });
    });
  }

  // Lamp rope toggle for dark mode
  if (lampRopeToggle) {
    // Helper function to update UI for dark mode
    function updateDarkModeUI(isDark) {
      const container = lampRopeToggle.querySelector(".container");
      const solarSystem = lampRopeToggle.querySelector(".solar-system");

      if (isDark) {
        document.body.classList.add("dark-mode");
        document.documentElement.classList.add("dark-mode");
        lampRopeToggle.classList.add("dark-mode");
        // Show planet system when entering dark mode
        container.style.display = "flex";
        // Hide solar system in dark mode
        if (solarSystem) solarSystem.style.display = "none";
      } else {
        document.body.classList.remove("dark-mode");
        document.documentElement.classList.remove("dark-mode");
        lampRopeToggle.classList.remove("dark-mode");
        // Hide planet system when entering light mode
        container.style.display = "none";
        // Show solar system in light mode
        if (solarSystem) solarSystem.style.display = "block";
      }
    }

    // Check for saved preference on load
    const savedDarkMode = localStorage.getItem("theme");
    if (savedDarkMode === "dark") {
      updateDarkModeUI(true);
    }

    // Variables for drag functionality
    let startY = 0;
    let currentY = 0;
    let hasTriggeredDarkMode = false;

    // Mouse events
    lampRopeToggle.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);

    // Prevent default click behavior on the rope
    lampRopeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Touch events for mobile
    lampRopeToggle.addEventListener("touchstart", startDrag);
    document.addEventListener("touchmove", drag);
    document.addEventListener("touchend", endDrag);

    function startDrag(e) {
      isDragging = true;
      hasTriggeredDarkMode = false;

      // Store initial position
      if (e.type === "touchstart") {
        startY = e.touches[0].clientY;
      } else {
        startY = e.clientY;
      }

      // Prevent default to avoid text selection
      if (e.cancelable) {
        e.preventDefault();
      }
    }

    function drag(e) {
      if (!isDragging) return;

      // Calculate current position
      if (e.type === "touchmove") {
        currentY = e.touches[0].clientY;
      } else {
        currentY = e.clientY;
      }

      // Calculate how far the rope has been pulled
      const pullDistance = currentY - startY;

      // Apply visual feedback based on pull distance
      if (pullDistance > 0) {
        // Get the container with planet and orbit
        const container = lampRopeToggle.querySelector(".container");
        const orbitPosition = 70; // Position of the orbit from the top of the rope
        const maxMovement = 30; // Maximum movement for the rope
        const maxSolarMovement = 160; // Maximum movement for the solar system
        const movement = Math.min(pullDistance * 1, maxMovement);
        const solarMovement = Math.min(pullDistance * 1, maxSolarMovement);

        // Temporarily disable transition for smooth dragging
        container.style.transition = "none";

        // Move the container (which contains the planet and orbit) down as the rope is pulled
        container.style.transform = `translateY(${orbitPosition + movement}px)`;

        // Extend the rope to stay connected to the planet
        const newHeight = 160 + movement; // Base height (160) plus movement
        lampRopeToggle.style.height = `${newHeight}px`;

        // Move solar system in light mode
        if (!document.body.classList.contains("dark-mode")) {
          const solarSystem = lampRopeToggle.querySelector(".solar-system");
          if (solarSystem) {
            solarSystem.style.transform = `translateX(-50%) scale(0.2) translateY(${solarMovement}px)`;
          }
        }

        // Add pulling indicator class for visual feedback
        lampRopeToggle.classList.add("pulling-indicator");

        // Visual feedback when pulling
        lampRopeToggle.style.boxShadow = "0 0 10px rgba(230, 57, 70, 0.7)";

        // Track if rope has been pulled enough but don't toggle yet
        if (pullDistance > 50) {
          hasTriggeredDarkMode = true;
        }
      }
    }

    function endDrag() {
      if (!isDragging) return;

      isDragging = false;

      // Remove pulling indicator class
      lampRopeToggle.classList.remove("pulling-indicator");

      // Remove the glow effect from the rope
      lampRopeToggle.style.boxShadow = "none";

      // Toggle dark mode only when releasing the rope after pulling enough
      if (hasTriggeredDarkMode) {
        const isNowDark = !document.body.classList.contains("dark-mode");

        // Update UI
        updateDarkModeUI(isNowDark);

        // Save preference to localStorage using 'theme' key for compatibility
        localStorage.setItem("theme", isNowDark ? "dark" : "light");
      }

      // Reset the hasTriggeredDarkMode flag for next pull
      hasTriggeredDarkMode = false;

      // Reset rope height instantly
      lampRopeToggle.style.height = "160px";

      // Reset container position with smooth transition
      const container = lampRopeToggle.querySelector(".container");
      container.style.transform = "translateY(70px)";
      container.style.transition = "transform 0.3s ease";

      // Reset solar system position in light mode
      if (!document.body.classList.contains("dark-mode")) {
        const solarSystem = lampRopeToggle.querySelector(".solar-system");
        if (solarSystem) {
          solarSystem.style.transition = "transform 0.3s ease";
          solarSystem.style.transform =
            "translateX(-50%) scale(0.2) translateY(0px)";
        }
      }

      // Remove transitions after animation completes
      setTimeout(() => {
        lampRopeToggle.style.transition = "none";
        container.style.transition = "";
        const solarSystem = lampRopeToggle.querySelector(".solar-system");
        if (solarSystem) {
          solarSystem.style.transition = "";
        }
      }, 300);
    }

    // Sound function removed - no sound effect when pulling rope
  }

  // Theme toggle mobile for dark mode
  const themeToggleMobile = document.getElementById("input");
  if (themeToggleMobile) {
    // Initial state set by theme-toggle-final.js

    themeToggleMobile.addEventListener("change", () => {
      // const isDark = document.body.classList.contains("dark-mode"); // Unused
      document.body.classList.toggle("dark-mode");

      // Also toggle dark-mode class on lampRopeToggle for CSS selectors to work
      if (lampRopeToggle) {
        lampRopeToggle.classList.toggle("dark-mode");
      }

      // Note: We DO NOT persist mobile toggle changes as per user instruction "only for screens who has the lamp rope"
      // or effectively, we treat mobile toggle as temporary.
      // If user wants mobile toggle to persist too but ONLY apply on desktop if larger screen, that's different.
      // User said: "only for screens who has the lamp rope... when i enable dark mode... it should be also in the dark mode"
      // implying the feature itself is tied to the lamp rope experience.
    });
  }

  // Clear input button
  const clearBtn = document.getElementById("clear-btn");
  const clearInput = () => {
    urlInput.value = "";
    urlInput.focus();
    videoPreview.style.display = "none";
    videoTitle.style.display = "none";
    downloadBtn.style.display = "none"; // Explicitly hide download button
    downloadOtherBtn.style.display = "none";

    const recodeOptionClear = document.getElementById("recode-option");
    if (recodeOptionClear) recodeOptionClear.style.display = "none";

    const acceleratorOptionClear = document.getElementById("accelerator-option");
    if (acceleratorOptionClear) acceleratorOptionClear.style.display = "none";

    const clipOptionClear = document.getElementById("clip-option");
    if (clipOptionClear) clipOptionClear.style.display = "none";

    const recodeCheckbox = document.getElementById("recode-h265");
    if (recodeCheckbox) recodeCheckbox.checked = false;

    const acceleratorCheckbox = document.getElementById("multi-segment");
    if (acceleratorCheckbox) acceleratorCheckbox.checked = false;

    const startInput = document.getElementById("start-time");
    if (startInput) startInput.value = "";

    const endInput = document.getElementById("end-time");
    if (endInput) endInput.value = "";

    // Reset Video Player
    videoPlayer.src = "";
    videoPlayer.classList.remove("video-expand");
    videoThumbnail.src = "";

    const loadingOverlay = document.getElementById("video-loading-overlay");
    if (loadingOverlay) loadingOverlay.style.display = "none";

    videoPreview.classList.remove("slide-in-up");

    const formatSelector = document.querySelector(".format-selector");
    if (formatSelector) formatSelector.classList.remove("show");

    if (successMessage) {
      successMessage.style.display = "none";
      successMessage.classList.remove("show");
    }

    resetDownloadProgress();
    downloadBtn.disabled = false;
    downloadOtherBtn.disabled = false;
    downloadOtherBtn.classList.remove("disabled");
    downloadOtherBtn.removeAttribute("disabled");

    // Reset Background
    const homeHero = document.querySelector(".home-hero");
    if (homeHero) homeHero.classList.remove("symmetric-bg");

    const mainElement = document.querySelector("main");
    if (mainElement) mainElement.style.backgroundColor = "";

    videoPreview.style.backgroundColor = "";

    // Reset Playlist State and UI
    playlistState.videos = [];
    playlistState.currentIndex = 0;
    playlistState.playlistId = null;
    playlistState.nextPageToken = null;
    playlistState.isPlaylist = false;

    const prevBtn = document.getElementById('prev-video-btn');
    if (prevBtn) prevBtn.style.display = 'none';

    const nextBtn = document.getElementById('next-video-btn');
    if (nextBtn) {
      nextBtn.style.display = 'none';
      nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>'; // Reset icon
      nextBtn.disabled = false;
    }

    const playlistIndicator = document.getElementById('playlist-indicator');
    if (playlistIndicator) playlistIndicator.style.display = 'none';

    // Clear Cache and Iframes
    for (let key in playerCache) {
      delete playerCache[key];
    }
    // Remove all cached iframes (keep original video-player if needed, or just clear src)
    const cachedIframes = document.querySelectorAll('.cached-iframe');
    cachedIframes.forEach(iframe => iframe.remove());
  };
  if (clearBtn) {
    clearBtn.addEventListener("click", clearInput);
  }

  const downloadState = {
    iframe: null,
    form: null,
    pending: null,
  };


  // Playlist state management
  function resetDownloadProgress() {
    if (!downloadProgressText) {
      return;
    }
    downloadProgressText.style.display = "none";
    downloadProgressText.innerHTML = defaultProgressMarkup;
  }

  function handleDownloadFrameLoad() {
    if (!downloadState.pending) {
      return;
    }
    let errorMessage = "";
    try {
      const doc = downloadState.iframe?.contentDocument;
      const bodyText = doc?.body?.textContent?.trim();
      if (bodyText) {
        try {
          const data = JSON.parse(bodyText);
          if (data.error) {
            errorMessage = data.error || data.details;
          }
        } catch (err) { // eslint-disable-line no-unused-vars
          errorMessage = bodyText;
        }
      }
    } catch (err) {
      console.error("Download frame parse error:", err);
    }
    finishDownloadState(errorMessage);
  }

  function ensureDownloadTransport() {
    if (!downloadState.iframe) {
      const iframe = document.createElement("iframe");
      iframe.name = "fastpast-download-frame";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      iframe.addEventListener("load", handleDownloadFrameLoad);
      downloadState.iframe = iframe;
    }
    if (!downloadState.form) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/download";
      form.target = "fastpast-download-frame";
      form.style.display = "none";
      document.body.appendChild(form);
      downloadState.form = form;
    }
  }

  function finishDownloadState(errorMessage) {
    downloadState.pending = null;
    downloadBtn.disabled = false;
    downloadOtherBtn.disabled = false;
    downloadOtherBtn.classList.remove("disabled");
    downloadOtherBtn.removeAttribute("disabled");
    resetDownloadProgress();
    if (errorMessage) {
      if (successMessage) {
        successMessage.style.display = "none";
        successMessage.classList.remove("show");
      }
      alert(errorMessage);
    }
  }

  function submitDownloadRequest(fields) {
    ensureDownloadTransport();
    const form = downloadState.form;
    while (form.firstChild) {
      form.removeChild(form.firstChild);
    }
    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value ?? "";
      form.appendChild(input);
    });
    downloadState.pending = { startedAt: Date.now() };
    try {
      form.submit();
    } catch (err) {
      console.error("Download submit error:", err);
      finishDownloadState("Failed to start download. Please try again.");
    }
  }

  function showDownloadPreparing(message) {
    if (!downloadProgressText) {
      return;
    }
    downloadProgressText.style.display = "block";
    downloadProgressText.textContent = message || "";
  }

  // Keyboard events for urlInput
  if (urlInput) {
    urlInput.addEventListener("keydown", (e) => {
      // Clear input if all text is selected and Delete/Backspace is pressed
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        urlInput.selectionStart === 0 &&
        urlInput.selectionEnd === urlInput.value.length
      ) {
        e.preventDefault();
        clearInput();
      }
    });

    urlInput.addEventListener("keyup", (e) => {
      // Process if Enter is pressed and URL is valid
      if (e.key === "Enter") {
        const url = urlInput.value.trim();
        if (url && isValidVideoUrl(url)) {
          processBtn.click();
        }
      }
    });
  }

  function createFallbackQuality(height) {
    const label =
      height >= 1080
        ? "High Quality"
        : height >= 720
          ? "HD Quality"
          : "Standard Quality";
    return {
      value: `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
      text: `${height}p (${label})`,
      height,
    };
  }

  // Function to get available qualities for a video using yt-dlp
  async function getAvailableQualities(videoUrl, format) {
    try {
      console.log("Fetching qualities for", videoUrl, format);
      const response = await fetch("/get-qualities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl, format }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched data:", data);

      // Check if this is a Vimeo authentication error
      if (
        videoUrl.includes("vimeo.com") &&
        data.error &&
        data.error.includes("logged-in")
      ) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error("Error fetching qualities:", error);

      // For Vimeo authentication errors, don't use fallback - throw the error
      if (
        videoUrl.includes("vimeo.com") &&
        error.message &&
        error.message.includes("logged-in")
      ) {
        throw error;
      }

      // Fallback to mock qualities if server is unavailable (for non-Vimeo or other errors)
      if (format === "mp4") {
        return {
          qualities: [
            createFallbackQuality(720),
            createFallbackQuality(1080),
            createFallbackQuality(1440),
            createFallbackQuality(2160),
          ],
          thumbnail: "",
          title: "",
          duration: 3600,
        };
      } else if (format === "mp3") {
        return {
          qualities: [
            { value: "64kbps", text: "64 kbps (Low Quality)" },
            { value: "128kbps", text: "128 kbps (Standard Quality)" },
            { value: "192kbps", text: "192 kbps (High Quality)" },
            { value: "256kbps", text: "256 kbps (Very High Quality)" },
            { value: "320kbps", text: "320 kbps (Lossless Quality)" },
          ],
          thumbnail: "",
          title: "",
        };
      }
      return { qualities: [], thumbnail: "", title: "" };
    }
  }

  // Function to populate quality options based on selected format
  function populateQualityOptions() {
    const format = formatSelect.value;
    qualitySelect.innerHTML = '<option value="">Select Quality</option>';

    // Determine user status and restrict capabilities
    const user = window.currentUser;
    const isFreeUser = !user || user.membershipType === 'free';
    const videoUrl = urlInput.value || "";
    // Check if platform is restricted (YouTube or Odysee)
    const isRestrictedPlatform =
      ((videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) &&
        !videoUrl.includes("/shorts/")) ||
      videoUrl.includes("odysee.com");

    if (
      format &&
      window.availableQualities &&
      window.availableQualities[format] &&
      window.availableQualities[format].length > 0
    ) {
      // Show actual qualities from server
      window.availableQualities[format].forEach((quality) => {
        const option = document.createElement("option");
        option.value = quality.value;

        let displayText = quality.text;
        let isDisabled = false;

        // Apply 1080p restriction for free users on restricted platforms
        if (isFreeUser && isRestrictedPlatform && format === "mp4") {
          // Extract height from quality text (e.g., "2160p (4K)")
          // Try to get height from quality object if available, otherwise regex
          let height = quality.height;
          if (!height && quality.text) {
            const match = quality.text.match(/(\d+)p/);
            if (match) {
              height = parseInt(match[1]);
            }
          }

          if (height > 1080) {
            isDisabled = true;
            displayText = `${displayText} \uD83D\uDD12 (Premium)`; // 🔒 lock icon
          }
        }

        option.textContent = displayText;
        if (isDisabled) {
          option.disabled = true;
        }

        qualitySelect.appendChild(option);
      });
    } else if (format) {
      // Show default qualities if server data not available yet
      if (format === "mp4") {
        const defaultQualities = [
          { value: "720p", text: "720p (HD Quality)", height: 720 },
          { value: "1080p", text: "1080p (Full HD Quality)", height: 1080 },
          { value: "1440p", text: "1440p (2K Quality)", height: 1440 },
          { value: "2160p", text: "2160p (4K Quality)", height: 2160 },
        ];
        defaultQualities.forEach((quality) => {
          const option = document.createElement("option");
          option.value = quality.value;

          let displayText = quality.text;
          let isDisabled = false;

          // Apply 1080p restriction for fallback/defaults too
          if (isFreeUser && isRestrictedPlatform) {
            if (quality.height > 1080) {
              isDisabled = true;
              displayText = `${displayText} \uD83D\uDD12 (Premium)`;
            }
          }

          option.textContent = displayText;
          if (isDisabled) {
            option.disabled = true;
          }
          qualitySelect.appendChild(option);
        });
      } else if (format === "mp3") {
        const defaultQualities = [
          { value: "128kbps", text: "128 kbps (Standard Quality)" },
          { value: "192kbps", text: "192 kbps (High Quality)" },
          { value: "256kbps", text: "256 kbps (Very High Quality)" },
          { value: "320kbps", text: "320 kbps (Lossless Quality)" },
        ];
        defaultQualities.forEach((quality) => {
          const option = document.createElement("option");
          option.value = quality.value;
          option.textContent = quality.text;
          qualitySelect.appendChild(option);
        });
      }
    } else {
      // Clear quality options if no format selected
      qualitySelect.innerHTML = '<option value="">Select Quality</option>';
    }
  }

  // Format change handler to populate quality options
  if (formatSelect) {
    formatSelect.addEventListener("change", () => {
      if (formatSelect.value) {
        qualitySelect.disabled = false;
        populateQualityOptions();
      } else {
        qualitySelect.disabled = true;
        qualitySelect.innerHTML = '<option value="">Select Quality</option>';
      }
    });
  }

  // Playlist helper functions
  function getYouTubePlaylistId(url) {
    const regex = /[?&]list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function isPlaylistUrl(url) {
    return getYouTubePlaylistId(url) !== null &&
      (url.includes('youtube.com') || url.includes('youtu.be'));
  }



  // Quality change handler to show download button and options
  if (qualitySelect) {
    qualitySelect.addEventListener("change", () => {
      if (qualitySelect.value) {
        downloadBtn.style.display = "inline-block";
        downloadBtn.classList.add("pulse");
        downloadOtherBtn.style.display = "inline-block";
        // Show additional options
        const acceleratorOption = document.getElementById("accelerator-option");
        if (acceleratorOption) acceleratorOption.style.display = "block";
        if (
          formatSelect.value === "mp4" &&
          (urlInput.value.includes("youtube.com") ||
            urlInput.value.includes("youtu.be")) &&
          !urlInput.value.includes("/shorts/")
        ) {
          const clipOption = document.getElementById("clip-option");
          if (clipOption) clipOption.style.display = "block";
          setupSliders();
        }
        // H.265 re-encode is not supported by yt-dlp, so hide the option
        // if (formatSelect.value === "mp4") {
        //   document.getElementById("recode-option").style.display = "block";
        // }
      } else {
        downloadBtn.style.display = "none";
        downloadBtn.classList.remove("pulse");
        downloadOtherBtn.style.display = "none";
        const recodeOption = document.getElementById("recode-option");
        if (recodeOption) recodeOption.style.display = "none";
        const acceleratorOption = document.getElementById("accelerator-option");
        if (acceleratorOption) acceleratorOption.style.display = "none";
        const clipOption = document.getElementById("clip-option");
        if (clipOption) clipOption.style.display = "none";
      }
    });
  }



  // Function to extract YouTube video ID from URL
  function getYouTubeVideoId(url) {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/; // eslint-disable-line no-useless-escape
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Extract YouTube playlist ID from URL
  // function getYouTubePlaylistId(url) { ... } // Duplicate removed

  // Check if URL is a playlist
  // function isPlaylistUrl(url) { ... } // Duplicate removed


  // Function to validate video URL from supported platforms
  function isValidVideoUrl(url) {
    const domains = [
      "youtube.com",
      "youtu.be",
      "tiktok.com",
      "pinterest.com",
      "pin.it",
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "x.com",
      "vimeo.com",
      "dailymotion.com",
      "odysee.com",
      "reddit.com",
      "threads.net",
      "threads.com",
      "vk.com",
      "vk.ru",
      "vk.cc",
      "vkontakte.ru",
      "vkvideo.ru",
    ];
    const lowerUrl = url.toLowerCase();

    // Check if URL contains a supported domain
    if (!domains.some((domain) => lowerUrl.includes(domain))) {
      return false;
    }

    // YouTube-specific validation
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      // Reject search results pages
      if (lowerUrl.includes("/results?") || lowerUrl.includes("search_query=")) {
        throw new Error("This is a YouTube search results page. Please click on a video from the search results and use that URL instead.");
      }

      // Reject channel pages
      if (lowerUrl.includes("/@") || lowerUrl.includes("/channel/") || lowerUrl.includes("/user/") || lowerUrl.includes("/c/")) {
        throw new Error("This is a YouTube channel page. Please click on a specific video to download.");
      }

      // Reject home page
      if (lowerUrl === "youtube.com" || lowerUrl === "www.youtube.com" || lowerUrl === "https://youtube.com" || lowerUrl === "https://www.youtube.com") {
        throw new Error("Please enter a specific video URL, not the YouTube homepage.");
      }

      // Reject playlist-only URLs (no video ID) - handled separately by isPlaylistUrl
      // This is already handled in the processBtn logic, so we don't need to reject here
    }

    return true;
  }

  // Function to get embed URL for video preview
  function getEmbedUrl(url) {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
      const videoId = getYouTubeVideoId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    } else if (lowerUrl.includes("tiktok.com")) {
      const match = url.match(/\/video\/(\d+)/);
      return match ? `https://www.tiktok.com/embed/${match[1]}` : "";
    } else if (lowerUrl.includes("facebook.com")) {
      return "";
    } else if (lowerUrl.includes("instagram.com")) {
      const match = url.match(new RegExp("/p/([^/]+)"));
      return match ? `https://www.instagram.com/p/${match[1]}/embed/` : "";
    } else if (
      lowerUrl.includes("pinterest.com") ||
      lowerUrl.includes("pin.it")
    ) {
      return "";
    } else if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
      const match = url.match(/\/status\/(\d+)/);
      return match
        ? `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`
        : "";
    } else if (lowerUrl.includes("vimeo.com")) {
      const match = url.match(/\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : "";
    } else if (lowerUrl.includes("dailymotion.com")) {
      const match = url.match(/\/video\/([a-zA-Z0-9]+)/);
      return match ? `https://www.dailymotion.com/embed/video/${match[1]}` : "";
    } else if (lowerUrl.includes("odysee.com")) {
      return "";
    } else if (lowerUrl.includes("reddit.com")) {
      return "";
    } else if (
      lowerUrl.includes("vk.com") ||
      lowerUrl.includes("vk.ru") ||
      lowerUrl.includes("vk.cc") ||
      lowerUrl.includes("vkontakte.ru") ||
      lowerUrl.includes("vkvideo.ru")
    ) {
      const videoMatch = url.match(/\/video(-?\d+)_(\d+)/);
      if (videoMatch) {
        return `https://vk.com/video_ext.php?oid=${videoMatch[1]}&id=${videoMatch[2]}`;
      }
      // Support for wall posts (which often contain videos)
      const wallMatch = url.match(/\/wall(-?\d+)_(\d+)/);
      if (wallMatch) {
        return `https://vk.com/widget_post.php?owner_id=${wallMatch[1]}&post_id=${wallMatch[2]}`;
      }
      return "";
    }
    return "";
  }

  // Process video URL
  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      const videoUrl = urlInput.value.trim();


      // Check if it's a playlist URL
      if (isPlaylistUrl(videoUrl)) {
        // Check if user has playlist access (lifetime or studio only)
        const currentUserData = localStorage.getItem('currentUser');
        let hasPlaylistAccess = false;

        if (currentUserData) {
          try {
            const user = JSON.parse(currentUserData);
            const eligibleTypes = ['lifetime', 'studio'];
            if (eligibleTypes.includes(user.membershipType)) {
              // Also check if subscription is still valid (for non-lifetime)
              if (user.membershipType === 'lifetime') {
                hasPlaylistAccess = true;
              } else if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date()) {
                hasPlaylistAccess = true;
              }
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }

        if (!hasPlaylistAccess) {
          alert('Playlist download is exclusive to Lifetime and Studio members. Please upgrade your membership to access this feature.');
          return;
        }

        processingStatus.style.display = 'block';

        // Hide Single Video Elements
        if (videoPreview) videoPreview.style.display = "none";
        if (videoTitle) videoTitle.style.display = "none";
        const formatSelector = document.querySelector(".format-selector");
        if (formatSelector) formatSelector.classList.remove("show");
        if (downloadBtn) downloadBtn.style.display = "none";
        if (downloadOtherBtn) downloadOtherBtn.style.display = "none";

        // Hide navigation arrows (for single video carousel)
        const prevBtn = document.getElementById('prev-video-btn');
        const nextBtn = document.getElementById('next-video-btn');
        const playlistIndicator = document.getElementById('playlist-indicator');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (playlistIndicator) playlistIndicator.style.display = 'none';

        // Show Playlist View
        const playlistView = document.getElementById("playlist-view");
        if (playlistView) playlistView.style.display = "block";

        try {
          const data = await fetchPlaylistVideos(videoUrl);

          if (!data.videos || data.videos.length === 0) {
            alert('No videos found in playlist');
            processingStatus.style.display = 'none';
            return;
          }

          // Initialize playlist state
          playlistState.videos = data.videos;
          playlistState.currentIndex = 0;
          playlistState.playlistId = getYouTubePlaylistId(videoUrl);
          playlistState.nextPageToken = data.nextPageToken;
          playlistState.isPlaylist = true;

          // Render playlist as vertical list
          renderPlaylist(data.videos);

          // Update stats
          const totalVideos = document.getElementById("pl-total-videos");
          const countReady = document.getElementById("pl-count-ready");
          if (totalVideos) totalVideos.textContent = data.videos.length || 0;
          if (countReady) countReady.textContent = data.videos.length || 0;

          // Helper function to parse duration string (MM:SS or HH:MM:SS) to seconds
          function parseDuration(durationStr) {
            if (!durationStr || durationStr === '--:--') return 0;
            const parts = durationStr.split(':').map(Number);
            if (parts.length === 3) {
              // HH:MM:SS
              return parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              // MM:SS
              return parts[0] * 60 + parts[1];
            }
            return 0;
          }

          // Calculate total duration from all videos
          console.log("Calculating total duration for videos:", data.videos.length);
          let totalSeconds = data.videos.reduce((acc, vid) => {
            const duration = parseDuration(vid.duration);
            console.log(`Video: "${vid.title}" - Duration: ${vid.duration} -> ${duration}s`);
            return acc + duration;
          }, 0);

          console.log(`Total duration: ${totalSeconds} seconds`);

          if (totalSeconds > 0) {
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            const durationEl = document.getElementById("pl-total-duration");
            if (durationEl) {
              durationEl.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
          }

          processingStatus.style.display = 'none';
          return;

        } catch (error) {
          console.error('Playlist error:', error);
          alert('Failed to load playlist: ' + error.message);
          processingStatus.style.display = 'none';

          // Hide playlist view on error (e.g. unauthorized)
          const playlistView = document.getElementById("playlist-view");
          if (playlistView) playlistView.style.display = "none";
          return;
        }
      } else {
        // Single video URL - use regular processing

        // Redesigned Playlist View Logic (old, now single video carousel)
        playlistState.isPlaylist = false; // Ensure this is false for single video
        playlistState.playlistId = null; // Clear playlist ID

        // Hide Playlist View
        const playlistView = document.getElementById("playlist-view");
        if (playlistView) playlistView.style.display = "none";

        // Show Single Video Elements
        if (videoPreview) videoPreview.style.display = "block";
        if (videoTitle) videoTitle.style.display = "block";
        // Don't show format-selector yet - it will be shown when video preview appears

        // Hide navigation controls (for single video carousel)
        const prevBtn = document.getElementById('prev-video-btn');
        const nextBtn = document.getElementById('next-video-btn');
        const playlistIndicator = document.getElementById('playlist-indicator');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (playlistIndicator) playlistIndicator.style.display = 'none';

        // Reset background
        // const hero = document.querySelector(".home-hero"); // Unused

        // Show processing status
        processingStatus.style.display = "block";
        processingStatus.classList.add("pulse");
        videoPreview.style.display = "none";
        videoTitle.style.display = "none"; // Explicitly hide title during processing

        try {
          // Validate video URL
          if (!isValidVideoUrl(videoUrl)) {
            throw new Error(
              "Invalid video URL. Please enter a valid URL from supported platforms (YouTube, TikTok, Pinterest, Facebook, Instagram, Twitter/X, Vimeo, Dailymotion, Odysee, Reddit, Threads, VK)."
            );
          }

          // Load qualities first, then show preview
          await loadVideoQualities(videoUrl);

          // Only show preview after qualities are loaded
          showVideoPreview(videoUrl);
        } catch (error) {
          console.error("Error processing video:", error);

          // Fallback: If we have an embed URL, show it even if server metadata failed
          // This ensures the user sees the video (VK, Vimeo, etc) even if download extraction fails
          if (getEmbedUrl(videoUrl)) {
            processingStatus.style.display = "none";
            showVideoPreview(videoUrl);

            // Optional: You could show a specialized message here that download is unavailable
            // but for now, showing the video fixes the "blank screen" issue.
            videoTitle.textContent = "Video Preview (Download Unavailable)";
          } else {
            alert(
              error.message ||
              "Failed to process video. Please check the URL and try again."
            );
            processingStatus.style.display = "none";
          }
        }
      }  // End else block for single video
    });  // End processBtn event listener
  }

  // Function to show video preview after data is loaded
  function showVideoPreview(videoUrl) {
    // Get video info from loaded data
    const embedUrl = getEmbedUrl(videoUrl);
    const loadingOverlay = document.getElementById("video-loading-overlay");

    if (embedUrl) {
      // HAS EMBED: Show only the iframe, hide thumbnail completely
      loadingOverlay.style.display = "flex";
      videoPlayer.src = embedUrl;
      if (videoUrl.includes("tiktok.com")) {
        videoPlayer.classList.add("tiktok-embed");
        videoPreview.classList.add("tiktok-preview");
      } else {
        videoPlayer.classList.remove("tiktok-embed");
        videoPreview.classList.remove("tiktok-preview");
      }
      videoPlayer.style.display = "block";

      // CRITICAL: Clear thumbnail src AND hide it to prevent duplicate display
      videoThumbnail.onload = null;
      videoThumbnail.onerror = null;
      videoThumbnail.style.display = "none";
      videoThumbnail.removeAttribute("src");
      videoThumbnail.src = "";

      videoPlayer.onload = () => {
        loadingOverlay.style.display = "none";
        videoPlayer.classList.add("video-expand");
        videoTitle.style.display = "block";  // Show title when iframe loads
      };
    } else {
      // NO EMBED: Show only the thumbnail
      videoPlayer.src = "";
      videoPlayer.style.display = "none";

      // ALWAYS show the thumbnail element if we don't have an embed
      // This ensures either the real thumbnail OR the placeholder visible
      videoThumbnail.style.display = "block";

      const thumbnailSrc = videoThumbnail.getAttribute("data-src") || videoThumbnail.src || "";

      // Only apply special styling if we have a valid source (not placeholder)
      if (thumbnailSrc && !thumbnailSrc.includes("data:image/svg+xml")) {
        // We have a real thumbnail from the server

        // Force height constraints for social media platforms
        if (videoUrl.includes("facebook.com") ||
          videoUrl.includes("instagram.com") ||
          videoUrl.includes("pinterest.com") ||
          videoUrl.includes("pin.it") ||
          videoUrl.includes("threads.net") ||
          videoUrl.includes("threads.com")) {
          videoThumbnail.style.height = "375px";
          videoThumbnail.style.maxHeight = "400px";
          videoThumbnail.style.minHeight = "350px";
          videoThumbnail.style.objectFit = "cover";
          videoThumbnail.style.width = "auto";
          videoThumbnail.style.margin = "0 auto 20px auto";
          videoThumbnail.classList.add("social-media-thumbnail");
        }
      } else if (!thumbnailSrc) {
        // No thumbnail at all - show platform-specific placeholder
        if (videoUrl.includes("instagram.com") ||
          videoUrl.includes("threads.net") ||
          videoUrl.includes("threads.com")) {
          // Instagram/Threads placeholder
          videoThumbnail.src =
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#833ab4;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#fd1d1d;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#fcb045;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="200" height="200" fill="url(#instagramGradient)"/>
              <circle cx="100" cy="100" r="40" fill="none" stroke="white" stroke-width="8"/>
              <circle cx="135" cy="65" r="8" fill="white"/>
            </svg>
          `);
          videoThumbnail.style.objectFit = "contain";
          videoThumbnail.style.backgroundColor = "#f8f9fa";
        } else {
          // Generic no thumbnail placeholder
          videoThumbnail.src =
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="#e9ecef"/>
              <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">No Thumbnail</text>
            </svg>
          `);
        }
        videoThumbnail.style.display = "block";
      } else {
        // Has SVG placeholder, show it
        videoThumbnail.style.display = "block";
      }

      loadingOverlay.style.display = "none";

      // Apply height constraints after image loads for social media platforms
      videoThumbnail.onload = function () {
        // Show title when thumbnail loads
        videoTitle.style.display = "block";

        if (videoUrl.includes("facebook.com") ||
          videoUrl.includes("instagram.com") ||
          videoUrl.includes("pinterest.com") ||
          videoUrl.includes("pin.it") ||
          videoUrl.includes("threads.net") ||
          videoUrl.includes("threads.com")) {
          this.style.height = "375px";
          this.style.maxHeight = "400px";
          this.style.minHeight = "350px";
          this.style.objectFit = "cover";
          this.style.width = "auto";
          this.style.margin = "0 auto 20px auto";
          this.style.display = "block";
          this.classList.add("social-media-thumbnail");
        }
      };

      // Add error handling for thumbnail loading
      videoThumbnail.onerror = function () {
        const rawUrl = this.getAttribute("data-src");

        // Smart Fallback: If proxy failed (likely 404/500), try loading the raw URL directly!
        // This helps if the server is blocked but the user's browser isn't.
        if (rawUrl && this.src !== rawUrl && !this.dataset.triedRaw) {
          console.log("Proxy failed, trying raw thumbnail URL...", rawUrl);
          this.dataset.triedRaw = "true";
          this.referrerPolicy = "no-referrer"; // Bypass hotlink protection if possible
          this.src = rawUrl;
          return;
        }

        // Fallback 2: Try Public Proxy (wsrv.nl) if direct/raw failed
        if (rawUrl && !this.dataset.triedWsrv) {
          console.log("Direct load failed, trying wsrv.nl proxy...", rawUrl);
          this.dataset.triedWsrv = "true";
          this.referrerPolicy = "no-referrer";
          this.src = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}`;
          return;
        }
        if (
          videoUrl.includes("instagram.com") ||
          videoUrl.includes("threads.net") ||
          videoUrl.includes("threads.com")
        ) {
          // Fallback to Instagram placeholder  on error
          this.src =
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#833ab4;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#fd1d1d;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#fcb045;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="200" height="200" fill="url(#instagramGradient)"/>
              <circle cx="100" cy="100" r="40" fill="none" stroke="white" stroke-width="8"/>
              <circle cx="135" cy="65" r="8" fill="white"/>
            </svg>
          `);
        } else {
          // Generic fallback
          this.src =
            "data:image/svg+xml;base64," +
            btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
              <rect width="200" height="200" fill="#e9ecef"/>
              <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">No Thumbnail</text>
            </svg>
          `);
        }
        this.onerror = null; // Prevent infinite loop
      };
    }

    // Hide processing status and show preview
    processingStatus.style.display = "none";
    processingStatus.classList.remove("pulse");
    videoPreview.style.display = "block";
    // Don't show title here - wait for thumbnail to load
    videoPreview.classList.add("slide-in-up");

    // Show format selector
    const formatSelector = document.querySelector(".format-selector");
    setTimeout(() => {
      formatSelector.classList.add("show");
    }, 300);

    // Update background
    const hero = document.querySelector(".home-hero");
    hero.classList.add("symmetric-bg");
    document.querySelector("main").style.backgroundColor = "#f4f7f6";
    videoPreview.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  }

  // Function to load video qualities before showing preview
  // Fetch video data (metadata and qualities)
  async function fetchVideoData(videoUrl) {
    // Special handling for Vimeo: Check if video is downloadable first
    if (videoUrl.includes("vimeo.com")) {
      try {
        await getAvailableQualities(videoUrl, "mp4");
      } catch (error) {
        if (error.message && error.message.includes("logged-in")) {
          throw new Error("The download link not found.");
        }
        throw error;
      }
    }

    let mp4Data, mp3Data;
    if (!videoUrl.includes("vimeo.com")) {
      [mp4Data, mp3Data] = await Promise.all([
        getAvailableQualities(videoUrl, "mp4"),
        getAvailableQualities(videoUrl, "mp3"),
      ]);
    } else {
      mp4Data = await getAvailableQualities(videoUrl, "mp4");
      mp3Data = await getAvailableQualities(videoUrl, "mp3");
    }

    return { mp4Data, mp3Data, videoUrl };
  }

  // Update UI with fetched video data
  function updateUIWithData(data) {
    const { mp4Data, mp3Data, videoUrl } = data;

    // Update video title
    if (mp4Data.title) {
      videoTitle.textContent = mp4Data.title;
    } else {
      // Set basic title based on platform
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        videoTitle.textContent = "YouTube Video";
      } else if (videoUrl.includes("tiktok.com")) {
        videoTitle.textContent = "TikTok Video";
      } else if (videoUrl.includes("instagram.com")) {
        videoTitle.textContent = "Instagram Video";
      } else if (videoUrl.includes("facebook.com")) {
        videoTitle.textContent = "Facebook Video";
      } else if (videoUrl.includes("vimeo.com")) {
        videoTitle.textContent = "Vimeo Video";
      } else if (
        videoUrl.includes("threads.net") ||
        videoUrl.includes("threads.com")
      ) {
        videoTitle.textContent = "Threads Video";
      } else {
        videoTitle.textContent = "Video";
      }
    }

    // Store thumbnail for later use
    if (videoThumbnail && mp4Data.thumbnail) {
      videoThumbnail.setAttribute("data-src", mp4Data.thumbnail);
      // Also set the src immediately so it's ready when needed
      // Use proxy for all external thumbnails except YouTube (which is whitelisted in CSP)
      // to avoid CSP violations and CORS issues
      const directDomains = [
        "youtube.com", "youtu.be",
        "instagram.com", "cdninstagram.com",
        "facebook.com", "fbcdn.net",
        "threads.net",
        "reddit.com", "redditmedia.com",
        "pinterest.com", "pinimg.com",
        "odysee.com"
      ];

      const shouldUseDirect = directDomains.some(d =>
        videoUrl.includes(d) || (mp4Data.thumbnail && mp4Data.thumbnail.includes(d))
      );

      if (shouldUseDirect) {
        // Direct load for whitelisted domains (bypassing local proxy which gets blocked)
        videoThumbnail.src = mp4Data.thumbnail;
        // Reset fallback flags
        delete videoThumbnail.dataset.triedRaw;
        delete videoThumbnail.dataset.triedWsrv;
      } else {
        // All other platforms: route through proxy to bypass CSP restrictions
        videoThumbnail.src = `/proxy-image?url=${encodeURIComponent(
          mp4Data.thumbnail
        )}`;
      }
      // Keep thumbnail hidden initially - showVideoPreview will decide whether to show it
      videoThumbnail.style.display = "none";
    }

    // Store available qualities globally
    window.availableQualities = {
      mp4: mp4Data.qualities,
      mp3: mp3Data.qualities,
    };
    // User Request Dec 2025: Parse formatted duration string to seconds to avoid NaN in slider
    window.videoDuration = parseTime(mp4Data.duration || "0");

    // Do not auto-select format, let user choose
    populateQualityOptions();

    // Hide processing status and show preview
    processingStatus.style.display = "none";
    processingStatus.classList.remove("pulse");
    videoPreview.style.display = "block";
    // Don't show title yet - will be shown when video actually appears
    videoPreview.classList.add("slide-in-up");

    // Show format selector
    const formatSelector = document.querySelector(".format-selector");
    if (formatSelector) {
      setTimeout(() => {
        formatSelector.classList.add("show");
      }, 300);
    }

    // Update background
    const hero = document.querySelector(".home-hero");
    if (hero) hero.classList.add("symmetric-bg");
    const main = document.querySelector("main");
    if (main) main.style.backgroundColor = "#f4f7f6";
    videoPreview.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
  }

  // Legacy wrapper for compatibility and error handling hooks
  async function loadVideoQualities(videoUrl) {
    try {
      const data = await fetchVideoData(videoUrl);
      updateUIWithData(data);
      return data;
    } catch (error) {
      console.error("Error loading qualities:", error);

      // Set fallback title
      videoTitle.textContent = "Video";

      // Show fallback qualities
      window.availableQualities = {
        mp4: [createFallbackQuality(720), createFallbackQuality(1080)],
        mp3: [
          { value: "128kbps", text: "128 kbps (Standard Quality)" },
          { value: "320kbps", text: "320 kbps (Lossless Quality)" },
        ],
      };
      window.videoDuration = 3600;
      populateQualityOptions();

      // Re-throw error to be caught by main handler
      throw error;
    }
  }

  // Download video
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {

      const videoUrl = urlInput.value.trim();
      const format = formatSelect.value;
      const quality = qualitySelect.value;

      if (!videoUrl) {
        alert("Please enter a video URL.");
        return;
      }

      if (!quality) {
        alert("Please select a quality.");
        return;
      }

      const formatQualities =
        (window.availableQualities && window.availableQualities[format]) || [];
      const selectedQuality = formatQualities.find(
        (item) => item.value === quality
      );

      ensureDownloadTransport();
      downloadBtn.disabled = true;
      downloadOtherBtn.disabled = true;
      downloadOtherBtn.classList.add("disabled");
      downloadOtherBtn.setAttribute("disabled", "disabled");

      showDownloadPreparing("");

      const downloadAcceleratorCheckbox = document.getElementById(
        "download-accelerator"
      );
      const recodeCheckbox = document.getElementById("recode-h265");
      const startInput = document.getElementById("start-time");
      const endInput = document.getElementById("end-time");

      const fields = {
        videoUrl: videoUrl,
        format: format,
        quality: selectedQuality?.value || quality,
        qualityLabel: selectedQuality?.text || quality,
        formatSelector: format === "mp4" ? selectedQuality?.value || quality : "",
        selectedHeight: selectedQuality?.height || "",
        recodeH265: recodeCheckbox?.checked ? "true" : "false",
        downloadAccelerator: downloadAcceleratorCheckbox?.checked
          ? "true"
          : "false",
        startTime: startInput?.value || "",
        endTime: endInput?.value || "",
        token: localStorage.getItem("sessionToken") || "",
      };

      const waitMessage = document.getElementById("download-wait-message");
      if (waitMessage) {
        waitMessage.style.display = "block";
        // Force reflow for animation
        void waitMessage.offsetWidth;
        waitMessage.classList.add("show");
      }

      submitDownloadRequest(fields);

      // Show success message after delay (10s for Facebook, 4s for others)
      if (successMessage) {
        const isFacebook = videoUrl.includes("facebook.com") || videoUrl.includes("fb.watch");
        const delay = isFacebook ? 15000 : 5000;
        setTimeout(() => {
          successMessage.style.display = "flex";
          successMessage.classList.add("show");
          if (waitMessage) {
            waitMessage.classList.remove("show");
            setTimeout(() => {
              if (!waitMessage.classList.contains("show")) {
                waitMessage.style.display = "none";
              }
            }, 500); // Match CSS transition duration
          }
        }, delay);
      }
    }
  }

  // Queue Management System
  const downloadQueue = [];
  const queueStatus = document.getElementById("queue-status");
  const queuePending = document.getElementById("queue-pending");
  const queueDownloading = document.getElementById("queue-downloading");
  const queueCompleted = document.getElementById("queue-completed");
  const downloadQueueElement = document.getElementById("download-queue");
  const queueList = document.getElementById("queue-list");

  // Download Other Video Button Click Handler
  if (downloadOtherBtn) {
    downloadOtherBtn.addEventListener("click", () => {
      // Reload the page when the button is clicked
      window.location.reload();
    });
  }

  // Process Queue Function
  let isProcessingQueue = false;
  function processQueue() {
    if (isProcessingQueue || downloadQueue.length === 0) return;

    isProcessingQueue = true;
    const nextItem = downloadQueue.find((item) => item.status === "pending");

    if (!nextItem) {
      isProcessingQueue = false;
      return;
    }

    // Update status to downloading
    nextItem.status = "downloading";
    updateQueueUI();

    // Show downloading status
    queuePending.style.display = "none";
    queueDownloading.style.display = "flex";

    // Simulate download progress
    simulateDownload(nextItem);
  }

  // Simulate Download Function
  function simulateDownload(item) {
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;

      // Update queue item progress
      const queueItemElement = document.getElementById(`queue-item-${item.id}`);
      if (queueItemElement) {
        const progressFill = queueItemElement.querySelector(
          ".queue-item-progress-fill"
        );
        const statusText = queueItemElement.querySelector(".queue-item-status");

        if (progressFill) progressFill.style.width = `${progress}%`;
        if (statusText) statusText.textContent = `Downloading...${progress}%`;
      }

      if (progress >= 100) {
        clearInterval(progressInterval);

        // Update status to completed
        item.status = "completed";
        updateQueueUI();

        // Show completed status
        queueDownloading.style.display = "none";
        queueCompleted.style.display = "flex";

        // Hide completed status after 2 seconds
        setTimeout(() => {
          queueCompleted.style.display = "none";

          // Check if there are more pending items
          const hasPending = downloadQueue.some((i) => i.status === "pending");
          if (hasPending) {
            queuePending.style.display = "flex";
          } else {
            queueStatus.style.display = "none";
          }

          // Continue processing queue
          isProcessingQueue = false;
          processQueue();
        }, 2000);
      }
    }, 200);
  }

  // Update Queue UI Function
  function updateQueueUI() {
    queueList.innerHTML = "";

    downloadQueue.forEach((item) => {
      const queueItemElement = document.createElement("div");
      queueItemElement.className = `queue-item ${item.status}`;
      queueItemElement.id = `queue-item-${item.id}`;

      const statusIcon =
        item.status === "pending"
          ? "fa-clock"
          : item.status === "downloading"
            ? "fa-download"
            : "fa-check-circle";

      const statusText =
        item.status === "pending"
          ? "Pending"
          : item.status === "downloading"
            ? "Downloading..."
            : "Completed";

      const progressWidth =
        item.status === "completed"
          ? "100%"
          : item.status === "downloading"
            ? "50%"
            : "0%";

      queueItemElement.innerHTML = `
        <i class="fas ${statusIcon}"></i>
        <div class="queue-item-info">
          <div class="queue-item-title">${item.title}</div>
          <div class="queue-item-status">${statusText}</div>
          <div class="queue-item-progress">
            <div class="queue-item-progress-fill" style="width: ${progressWidth}"></div>
          </div>
        </div>
        <div class="queue-item-actions">
          ${item.status === "pending"
          ? `<button class="queue-item-action" title="Remove from queue"><i class="fas fa-times"></i></button>`
          : ""
        }
        </div>
      `;

      queueList.appendChild(queueItemElement);

      // Add event listener to remove button
      if (item.status === "pending") {
        const removeBtn = queueItemElement.querySelector(".queue-item-action");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            const index = downloadQueue.findIndex((i) => i.id === item.id);
            if (index !== -1) {
              downloadQueue.splice(index, 1);
              updateQueueUI();

              // Hide queue if empty
              if (downloadQueue.length === 0) {
                downloadQueueElement.style.display = "none";
                queueStatus.style.display = "none";
              }
            }
          });
        }
      }
    });
  }

  // Function to parse HH:MM:SS, MM:SS or seconds to numeric seconds
  function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== "string") {
      const num = parseFloat(timeStr);
      return isNaN(num) ? 0 : num;
    }

    const cleanStr = timeStr.trim();
    if (!cleanStr.includes(":")) {
      return parseFloat(cleanStr) || 0;
    }

    const parts = cleanStr.split(":").map(p => parseFloat(p) || 0);
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  }

  // Function to format seconds to MM:SS
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  // Dual Range Slider Variables
  let isSliderDragging = false;
  let activeHandle = null;
  let sliderRect = null;

  // Function to update slider positions and range
  function updateSlider() {
    let duration = window.videoDuration || 3600;
    if (duration < 10) duration = 3600;
    const startSec =
      parseTime(document.getElementById("start-time").value) || 0;
    const endSec =
      parseTime(document.getElementById("end-time").value) || duration;

    // Dynamic minimum gap based on format and user status
    let positionGap = 30; // Default 30 seconds for premium users

    // Check if user is free/guest (no authentication or free membership)
    const isFreeUser = !window.currentUser || window.currentUser.membershipType === 'free' ||
      (window.currentUser.subscriptionEndDate && new Date() > new Date(window.currentUser.subscriptionEndDate));

    if (isFreeUser) {
      const selectedFormat = formatSelect?.value;
      if (selectedFormat === 'mp4') {
        positionGap = 180; // 3 minutes for MP4 free users
      } else if (selectedFormat === 'mp3') {
        positionGap = 30; // 30 seconds for MP3 free users
      }
    }
    // Premium users: 30 seconds for both MP4 and MP3

    const clampedStart = Math.max(0, Math.min(startSec, endSec - positionGap));
    const clampedEnd = Math.min(duration, Math.max(endSec, clampedStart + positionGap));

    // Update text inputs ONLY if they are not focused
    if (document.activeElement !== document.getElementById("start-time")) {
      document.getElementById("start-time").value = formatTime(clampedStart);
    }
    if (document.activeElement !== document.getElementById("end-time")) {
      document.getElementById("end-time").value = formatTime(clampedEnd);
    }

    // Update handle positions
    const startPercent = (clampedStart / duration) * 100;
    const endPercent = (clampedEnd / duration) * 100;

    const startHandle = document.getElementById("start-handle");
    const endHandle = document.getElementById("end-handle");

    startHandle.style.left = `${startPercent}%`;
    startHandle.setAttribute("data-time", formatTime(clampedStart));

    endHandle.style.left = `${endPercent}%`;
    endHandle.setAttribute("data-time", formatTime(clampedEnd));

    document.querySelector(".slider-range").style.left = `${startPercent}%`;
    document.querySelector(
      ".slider-range"
    ).style.width = `${endPercent - startPercent}%`;
  }

  // Function to initialize the dual range slider
  function initDualRangeSlider() {
    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    const startHandle = document.getElementById("start-handle");
    const endHandle = document.getElementById("end-handle");
    const sliderTrack = document.querySelector(".slider-track");

    if (
      !startTimeInput ||
      !endTimeInput ||
      !startHandle ||
      !endHandle ||
      !sliderTrack
    ) {
      return;
    }

    let duration = window.videoDuration || 3600; // Default 1 hour if not available
    if (duration < 10) duration = 3600; // Ensure minimum duration
    startTimeInput.value = "00:00";
    endTimeInput.value = formatTime(duration);

    updateSlider();

    // Event listeners for handles

    function startDrag(e, handle) {
      isSliderDragging = true;
      activeHandle = handle;
      sliderRect = sliderTrack.getBoundingClientRect();

      // Prevent scrolling while dragging on touch
      if (e.type === "touchstart") {
        // e.preventDefault(); // Handled by passive: false listener if needed
      } else {
        e.preventDefault();
      }
    }

    startHandle.addEventListener("mousedown", (e) => startDrag(e, "start"));
    endHandle.addEventListener("mousedown", (e) => startDrag(e, "end"));

    // Add Touch Support
    startHandle.addEventListener("touchstart", (e) => startDrag(e, "start"), { passive: false });
    endHandle.addEventListener("touchstart", (e) => startDrag(e, "end"), { passive: false });

    const handleMove = (e) => {
      if (!isSliderDragging || !sliderRect) return;

      // Extract clientX for both Mouse and Touch events
      const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;

      let duration = window.videoDuration || 3600;
      if (duration < 10) duration = 3600;
      const x = clientX - sliderRect.left;
      const percent = Math.max(0, Math.min(100, (x / sliderRect.width) * 100));
      const seconds = Math.round((percent / 100) * duration);

      // Calculate dynamic minimum gap based on format and user status
      let minGap = 30; // Default 30 seconds for premium users
      const isFreeUser = !window.currentUser || window.currentUser.membershipType === 'free' ||
        (window.currentUser.subscriptionEndDate && new Date() > new Date(window.currentUser.subscriptionEndDate));

      if (isFreeUser) {
        const selectedFormat = formatSelect?.value;
        if (selectedFormat === 'mp4') {
          minGap = 180; // 3 minutes for MP4 free users
        } else if (selectedFormat === 'mp3') {
          minGap = 30; // 30 seconds for MP3 free users
        }
      }
      // Premium users: 30 seconds for both MP4 and MP3

      if (activeHandle === "start") {
        const currentEnd = parseTime(endTimeInput.value);
        startTimeInput.value = formatTime(
          Math.min(seconds, currentEnd - minGap)
        );
      } else if (activeHandle === "end") {
        const currentStart = parseTime(
          startTimeInput.value
        );
        endTimeInput.value = formatTime(
          Math.max(seconds, currentStart + minGap)
        );
      }

      updateSlider();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", (e) => {
      if (isSliderDragging) {
        // Prevent page scroll only when actively dragging slider
        if (e.cancelable) e.preventDefault();
        handleMove(e);
      }
    }, { passive: false });

    const endDragging = () => {
      isSliderDragging = false;
      activeHandle = null;
      sliderRect = null;
    };

    document.addEventListener("mouseup", endDragging);
    document.addEventListener("touchend", endDragging);
    document.addEventListener("touchcancel", endDragging);

    // Event listeners for text inputs
    const handleTimeInput = (inputElement) => {
      let duration = window.videoDuration || 3600;
      if (duration < 10) duration = 3600;
      const sec = parseTime(inputElement.value);
      // Only update slider if we have a valid number
      if (!isNaN(sec) && sec >= 0) { // Allow sec > duration temporarily while typing? No, better clamp logic in updateSlider
        // Actually updateSlider reads values from DOM, so just calling it is enough.
        // But we want visual feedback on slider tracks.
        updateSlider();
      }
    };

    // Input event: update slider handles, do NOT reformat text (handled in updateSlider by check)
    startTimeInput.addEventListener("input", () => handleTimeInput(startTimeInput));
    endTimeInput.addEventListener("input", () => handleTimeInput(endTimeInput));

    startTimeInput.addEventListener("change", () => {
      startTimeInput.blur(); // Remove focus to allow updateSlider to update text
      updateSlider();
    });
    endTimeInput.addEventListener("change", () => {
      endTimeInput.blur();
      updateSlider();
    });

    // Enter key support
    const handleEnter = (e) => {
      if (e.key === "Enter") {
        e.target.blur(); // This will trigger change event usually, or at least blur
      }
    };
    startTimeInput.addEventListener("keydown", handleEnter);
    endTimeInput.addEventListener("keydown", handleEnter);
  }

  // Modify qualitySelect to initialize slider
  // let originalQualityChange = null; // Unused
  if (qualitySelect) {
    // originalQualityChange = qualitySelect.onchange; // Unused
    qualitySelect.addEventListener("change", () => {
      if (qualitySelect.value) {
        // ... existing code ...

        if (
          formatSelect &&
          formatSelect.value === "mp4" &&
          (urlInput.value.includes("youtube.com") ||
            urlInput.value.includes("youtu.be")) &&
          !urlInput.value.includes("/shorts/")
        ) {
          document.getElementById("clip-option").style.display = "block";
          initDualRangeSlider();
        }
      }
    });
  }

  // Typewriter effect for headline
  const headlines = [
    "Rapid Download & Clip: Videos & Music in Seconds",
    "Swift Edit & Grab: Modern Media Tools",
  ];
  let currentIndex = 0;
  let currentText = "";
  let isDeleting = false;
  let typeSpeed = 100;

  function typeWriter() {
    const fullText = headlines[currentIndex];
    if (isDeleting) {
      currentText = fullText.substring(0, currentText.length - 1);
    } else {
      currentText = fullText.substring(0, currentText.length + 1);
    }
    const headline = document.getElementById("animated-headline");
    if (headline) {
      headline.innerText = currentText;
    }
    if (!isDeleting && currentText === fullText) {
      setTimeout(() => (isDeleting = true), 2000); // pause before deleting
    } else if (isDeleting && currentText === "") {
      isDeleting = false;
      currentIndex = (currentIndex + 1) % headlines.length;
    }
    const speed = isDeleting ? typeSpeed / 2 : typeSpeed;
    setTimeout(typeWriter, speed);
  }

  // Page load animation sequence
  setTimeout(() => {
    const heroH2 = document.querySelector(".hero h2");
    if (heroH2) {
      heroH2.style.opacity = "1";
    }
    typeWriter(); // start typewriter after h2 fades in
  }, 2000);

  setTimeout(() => {
    const heroP = document.querySelector(".hero p");
    if (heroP) {
      heroP.style.opacity = "1";
    }
    const downloadForm = document.querySelector(".download-form");
    if (downloadForm) {
      downloadForm.style.opacity = "1";
    }
  }, 3000);

  // Back to Top Button
  const backToTopBtn = document.getElementById("back-to-top");

  const handleScroll = () => {
    if (backToTopBtn) {
      const scrollPos = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || (document.body ? document.body.scrollTop : 0);
      if (scrollPos > 300) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    }

    // Color transition for card headers on scroll
    const featureCards = document.querySelectorAll(
      ".feature-item-standout, .feature-item"
    );
    featureCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const header = card.querySelector("h3, h4");
      if (header) {
        if (rect.top < 0) {
          header.style.color = "#f39c12"; // scrolled past
        } else {
          header.style.color = "#1d3557"; // not scrolled past
        }
      }
    });
  };

  // Listen for scroll on both window and body due to overflow: hidden on html
  window.addEventListener("scroll", handleScroll, { passive: true });
  if (document.body) {
    document.body.addEventListener("scroll", handleScroll, { passive: true });
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Scroll everything to be safe
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (document.body) document.body.scrollTo({ top: 0, behavior: "smooth" });
      if (document.documentElement) document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    });
  } // Close if (backToTopBtn)
}); // Close DOMContentLoaded listener


// Playlist List View Rendering
async function renderPlaylist(videos) {
  const container = document.getElementById("playlist-items");
  container.innerHTML = ""; // Clear existing

  // Global state to track options per item
  window.playlistItemState = {};

  videos.forEach((video, index) => {
    const item = document.createElement("div");
    item.className = "playlist-item";
    item.dataset.index = index;

    // Helper to formatting duration
    const durationText = video.duration || "--:--";

    item.innerHTML = `
            <div class="pl-item-main">
                <div class="pl-checkbox-container">
                    <input type="checkbox" class="pl-checkbox" data-index="${index}">
                </div>
                <img src="${video.thumbnail}" class="pl-thumbnail" alt="${video.title}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZGYyZjciLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzcxODA5NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFRodW1ibmFpbDwvdGV4dD48L3N2Zz4=';">
                <div class="pl-info">
                    <div class="pl-title">${video.title}</div>
                    <div class="pl-meta">
                        <div class="pl-duration"><i class="fas fa-clock"></i> ${durationText}</div>
                    </div>
                </div>
                <div class="pl-actions">
                    <button class="pl-load-options-btn" onclick="toggleItemOptions(${index}, '${video.url}', this)">
                        <span class="btn-text">Options</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="playlist-item-options" id="pl-options-${index}" style="display: none;">
                <!-- Options injected on load -->
            </div>
        `;
    container.appendChild(item);
  });

  // Batch Selection Logic
  const checkboxes = document.querySelectorAll(".pl-checkbox");
  const downloadSelectedBtn = document.getElementById("download-selected-btn");

  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const count = document.querySelectorAll(".pl-checkbox:checked").length;
      downloadSelectedBtn.innerHTML = `<span class="btn-content"><i class="fas fa-download"></i> Download Selected (${count})</span>`;
      downloadSelectedBtn.disabled = count === 0;

      // Highlight row
      const row = cb.closest(".playlist-item");
      if (cb.checked) row.classList.add("selected");
      else row.classList.remove("selected");
    });
  });

  // Batch Download Handler (Async Job Version)
  downloadSelectedBtn.onclick = async () => {
    const selected = document.querySelectorAll(".pl-checkbox:checked");
    if (selected.length === 0) return;

    const items = [];
    selected.forEach(cb => {
      const index = cb.dataset.index;
      const video = playlistState.videos[index];
      if (video && video.url) {
        // Check for clip details and format
        const optionsContainer = document.getElementById(`pl-options-${index}`);
        let startTime = null;
        let endTime = null;
        let format = "mp4"; // Default

        if (optionsContainer) {
          const startInput = optionsContainer.querySelector(".pl-start-time");
          const endInput = optionsContainer.querySelector(".pl-end-time");
          const formatSelect = optionsContainer.querySelector(".pl-format-select");

          if (formatSelect && formatSelect.value) {
            format = formatSelect.value;
          }

          if (startInput && endInput) {
            const currentStart = startInput.value;
            const currentEnd = endInput.value;
            const defaultEnd = video.duration ? formatTime(video.duration) : "00:00";

            if (currentStart !== "00:00" || (currentEnd !== defaultEnd && currentEnd !== "")) {
              startTime = currentStart;
              endTime = currentEnd;
            }
          }
        }

        items.push({
          url: `https://www.youtube.com/watch?v=${video.id}`,
          startTime: startTime,
          endTime: endTime,
          format: format
        });
      }
    });

    if (items.length === 0) {
      alert("No valid URLs found in selection.");
      return;
    }

    // UI Helpers
    downloadSelectedBtn.disabled = true;
    downloadSelectedBtn.innerHTML = '<span class="btn-content"><i class="fas fa-spinner fa-spin"></i> Initializing...</span>';

    // Create Notification
    let notification = document.querySelector(".pl-notification.job-status");
    if (!notification) {
      notification = document.createElement("div");
      notification.className = "pl-notification job-status";
      document.body.appendChild(notification);
    }
    notification.style.display = "flex";
    notification.innerHTML = `
        <div>
            <i class="fas fa-cog fa-spin"></i> Initializing download job...
        </div>
    `;

    try {
      // Get auth token
      const token = localStorage.getItem('sessionToken');

      // 1. Start Job
      const response = await fetch('/download-playlist-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          urls: items,
          format: "best"
        })
      });

      if (response.status === 401) {
        throw new Error("Please log in to download playlists");
      }
      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Playlist download is only available for Lifetime and Studio members");
      }
      if (!response.ok) throw new Error("Failed to start job");

      const { jobId } = await response.json();
      console.log("Job started:", jobId);

      // 2. Poll Status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/zip-job-status/${jobId}`);
          if (!statusRes.ok) {
            // If 404/500, maybe temporary? but usually fatal.
            clearInterval(pollInterval);
            throw new Error("Job status check failed");
          }
          const status = await statusRes.json();

          // Update UI
          if (status.status === 'processing' || status.status === 'pending') {
            const progress = status.progress || 0;
            notification.innerHTML = `
                <div>
                    <i class="fas fa-circle-notch fa-spin"></i> Preparing your Zip... ${progress}%
                    <br><small>${items.length} videos being processed</small>
                </div>
             `;
            downloadSelectedBtn.innerHTML = `<span class="btn-content"><i class="fas fa-spinner fa-spin"></i> Processing ${progress}%</span>`;
          } else if (status.status === 'completed') {
            clearInterval(pollInterval);

            notification.className = "pl-notification success";
            notification.innerHTML = `
                <div>
                    <i class="fas fa-check-circle"></i> Zip Ready! Starting download...
                </div>
                <button class="close-notification"><i class="fas fa-times"></i></button>
             `;

            downloadSelectedBtn.innerHTML = `<span class="btn-content"><i class="fas fa-check"></i> Done!</span>`;

            // Trigger Download
            window.location.href = `/download-zip-result/${jobId}`;

            // Reset UI after delay
            setTimeout(() => {
              downloadSelectedBtn.disabled = false;
              downloadSelectedBtn.innerHTML = `<span class="btn-content"><i class="fas fa-download"></i> Download Selected (${items.length})</span>`;
            }, 3000);

            // Auto hide notification
            setTimeout(() => {
              if (notification.parentNode) notification.remove();
            }, 10000);
            notification.querySelector(".close-notification").onclick = () => notification.remove();

          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(status.error || "Job failed on server");
          }

        } catch (pollErr) {
          clearInterval(pollInterval);
          console.error("Polling error:", pollErr);
          handleError(pollErr.message);
        }
      }, 2000); // Check every 2 seconds

    } catch (error) {
      handleError(error.message);
    }

    function handleError(msg) {
      console.error("Download Job Error:", msg);
      downloadSelectedBtn.disabled = false;
      downloadSelectedBtn.innerHTML = `<span class="btn-content"><i class="fas fa-download"></i> Download Selected (${items.length})</span>`;

      notification.className = "pl-notification error";
      notification.innerHTML = `
          <div>
              <i class="fas fa-exclamation-triangle"></i> Download Failed
              <br><small>${msg}</small>
          </div>
          <button class="close-notification"><i class="fas fa-times"></i></button>
      `;
      notification.querySelector(".close-notification").onclick = () => notification.remove();
    }
  };
}

// Toggle and Load Options for a Playlist Item
window.toggleItemOptions = async function (index, url, btn) {
  const optionsContainer = document.getElementById(`pl-options-${index}`);

  // Collapse if open
  if (optionsContainer.style.display === "block") {
    optionsContainer.style.display = "none";
    btn.classList.remove("active");
    btn.querySelector(".btn-text").textContent = "Options";
    btn.querySelector("i").className = "fas fa-chevron-down";
    return;
  }

  // Expand
  optionsContainer.style.display = "block";
  btn.classList.add("active");
  btn.querySelector(".btn-text").textContent = "Close";
  btn.querySelector("i").className = "fas fa-chevron-up";

  // Load content if not already loaded (check for actual elements, not comments)
  if (optionsContainer.children.length === 0) {
    // Clone template
    const template = document.getElementById("playlist-item-options-template");
    if (!template) {
      console.error("Template not found!");
      return;
    }

    const content = template.content.cloneNode(true);
    optionsContainer.appendChild(content);

    // Query AFTER appending
    const loader = optionsContainer.querySelector(".loader-container");
    const realOptions = optionsContainer.querySelector(".options-container");

    if (!loader || !realOptions) {
      console.error("Could not find loader or options container");
      return;
    }

    loader.style.display = "flex";

    try {
      // Re-use fetchVideoData logic with cache awareness
      const data = await fetchVideoCacheAware(index, url);

      // Store state (already handled by wrapper, but harmless to update)
      window.playlistItemState[index] = data;

      // Populate Formats using dropdown
      const formatSelect = realOptions.querySelector(".pl-format-select");
      const qualitySelect = realOptions.querySelector(".pl-quality-select");

      if (!formatSelect) {
        console.error("Format select not found!");
        return;
      }

      // Trigger background prefetch for everything else once
      // We use a flag on the playlist state to avoid re-triggering
      if (!playlistState.hasPrefetchedOptions) {
        playlistState.hasPrefetchedOptions = true;
        // Start after a short delay to prioritize UI render
        setTimeout(() => {
          prefetchAllPlaylistOptions(index);
        }, 500);
      } // End one-time trigger


      function updateQualities() {
        const fmt = formatSelect.value;
        let qualities = [];

        // Enable quality select only if format is selected
        if (!fmt) {
          qualitySelect.disabled = true;
          qualitySelect.innerHTML = '<option value="">Select Format First</option>';
          return;
        }
        qualitySelect.disabled = false;

        // Map format to data properties
        if (fmt === "mp3") qualities = data.mp3Data.qualities;
        else if (fmt === "mp4") qualities = data.mp4Data.qualities;

        // Populate Quality Select
        qualitySelect.innerHTML = '<option value="">Select Quality</option>';
        qualities.forEach(q => {
          const opt = document.createElement("option");
          opt.value = q.format_id || q.url || q.quality;
          opt.textContent = q.quality + (q.size ? ` (${q.size})` : "");
          opt.dataset.note = q.note;
          qualitySelect.appendChild(opt);
        });
      }

      // Add default "Select Format" option if not present and force selection
      if (!formatSelect.querySelector('option[value=""]')) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = "";
        defaultOpt.textContent = "Select Format";
        defaultOpt.selected = true;
        defaultOpt.disabled = true; // Make it unselectable once dropdown opens? Or keep valid but forced?
        // Typically: <option value="" disabled selected>Select Format</option>
        // If we append at top:
        formatSelect.insertBefore(defaultOpt, formatSelect.firstChild);
        // Force value to empty to trigger disabled state
        formatSelect.value = "";
      }

      // Clean up old listeners to prevent duplicates if any
      // In this specific implementation, realOptions is cloned fresh each time? 
      // toggleItemOptions logic: "const content = template.content.cloneNode(true);"
      // Yes, it is fresh DOM. No need to remove listeners.

      formatSelect.addEventListener("change", () => {
        updateQualities();
        // Reset quality selection value when format changes
        qualitySelect.value = "";
        // Hide clips if they were open
        if (clipOption) clipOption.style.display = "none";
        if (clipControls) clipControls.style.display = "none";
      });

      // Trigger initial population
      updateQualities();

      // Handle quality selection - show clip controls when quality is chosen
      const clipOption = realOptions.querySelector(".pl-clip-option");
      const clipCheck = realOptions.querySelector(".pl-clip-check");
      const clipControls = realOptions.querySelector(".pl-clip-controls");
      const startTimeInput = realOptions.querySelector(".pl-start-time");
      const endTimeInput = realOptions.querySelector(".pl-end-time");

      // Initially hide clip option until quality is selected
      if (clipOption) clipOption.style.display = "none";

      qualitySelect.addEventListener("change", () => {
        if (qualitySelect.value) {
          // Quality selected - show clip controls directly
          if (clipOption) clipOption.style.display = "block";
          // Ensure controls are visible (previously hidden by checkbox logic)
          if (clipControls) clipControls.style.display = "block";

          // Get video duration from fetched data
          const videoDuration = data.mp4Data?.duration || data.mp3Data?.duration || 0;
          console.log(`Video duration for item ${index}: ${videoDuration} seconds`);

          // Initialize time inputs
          if (startTimeInput) startTimeInput.value = "00:00";
          if (endTimeInput && videoDuration) {
            endTimeInput.value = formatTime(videoDuration);
          }

          // Initialize slider if duration available
          if (videoDuration > 0) {
            initializePlaylistClipSlider(index, videoDuration, realOptions);
          }
        } else {
          // No quality selected - hide everything
          if (clipOption) clipOption.style.display = "none";
        }
      });

      // Handle clip checkbox toggle
      if (clipCheck && clipControls) {
        clipCheck.addEventListener("change", (e) => {
          clipControls.style.display = e.target.checked ? "flex" : "none";
        });
      }

      // Show result
      loader.style.display = "none";
      realOptions.style.display = "block";

    } catch (e) {
      console.error("Error loading options:", e);
      if (loader) {
        loader.innerHTML = `<span style="color:red"><i class="fas fa-exclamation-circle"></i> Failed to load options: ${e.message}</span>`;
      }
    }
  }
};

// Initialize clip slider for a playlist item
// Initialize clip slider for a playlist item
function initializePlaylistClipSlider(index, duration, container) {
  if (!duration || duration <= 0) return;

  const sliderTrack = container.querySelector(".pl-slider-track");
  const sliderContainer = container.querySelector(".pl-slider-container");
  if (!sliderTrack || !sliderContainer) return;

  // Clear existing slider elements
  sliderTrack.innerHTML = "";

  // Remove existing labels if any (cleaning up previous runs)
  const existingLabels = sliderContainer.querySelectorAll(".pl-slider-label");
  existingLabels.forEach(el => el.remove());

  // Create slider elements
  const range = document.createElement("div");
  range.className = "pl-slider-range";
  range.style.left = "0%";
  range.style.width = "100%";

  const startHandle = document.createElement("div");
  startHandle.className = "pl-slider-handle";
  startHandle.style.left = "0%";
  startHandle.title = "Start: 00:00";

  const endHandle = document.createElement("div");
  endHandle.className = "pl-slider-handle";
  endHandle.style.left = "100%";
  endHandle.title = `End: ${formatTime(duration)}`;

  sliderTrack.appendChild(range);
  sliderTrack.appendChild(startHandle);
  sliderTrack.appendChild(endHandle);

  // Inject Time Labels (00:00 and Total Duration)
  const timeDisplay = document.createElement("div");
  timeDisplay.className = "pl-time-display";
  timeDisplay.innerHTML = `
    <span>00:00</span>
    <span>${formatTime(duration)}</span>
  `;
  // Insert before the slider track (or container depending on layout preference, let's put it above)
  const existingDisplay = container.querySelector(".pl-time-display");
  if (existingDisplay) existingDisplay.remove();

  sliderContainer.parentNode.insertBefore(timeDisplay, sliderContainer);


  // Get time inputs
  const startTimeInput = container.querySelector(".pl-start-time");
  const endTimeInput = container.querySelector(".pl-end-time");

  // Update input container structure if needed (e.g. adding separator)
  const inputsContainer = container.querySelector(".pl-time-inputs");
  if (inputsContainer && !inputsContainer.querySelector(".pl-time-separator")) {
    // Check if existing separator 'to' text node exists and wrap/replace it
    // For simplicity, let's just make sure inputs are there. 
    // The 'to' span is already in HTML template: <span>to</span>. 
    // We can just add a class to it if we want specific styling or leave it.
  }

  if (!startTimeInput || !endTimeInput) return;

  // Initialize time values
  startTimeInput.value = "00:00";
  endTimeInput.value = formatTime(duration);

  // Slider drag functionality
  let isDragging = false;
  let activeHandle = null;
  let sliderRect = null;

  function startDrag(e, handle) {
    isDragging = true;
    activeHandle = handle;
    sliderRect = sliderTrack.getBoundingClientRect();
    e.preventDefault();
  }

  function updateSlider() {
    const startSeconds = parseTime(startTimeInput.value);
    const endSeconds = parseTime(endTimeInput.value);

    const startPercent = (startSeconds / duration) * 100;
    const endPercent = (endSeconds / duration) * 100;

    startHandle.style.left = `${startPercent}%`;
    endHandle.style.left = `${endPercent}%`;
    range.style.left = `${startPercent}%`;
    range.style.width = `${endPercent - startPercent}%`;

    // Update titles
    startHandle.title = `Start: ${startTimeInput.value}`;
    endHandle.title = `End: ${endTimeInput.value}`;
  }

  function parseTime(timeStr) {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  startHandle.addEventListener("mousedown", (e) => startDrag(e, "start"));
  endHandle.addEventListener("mousedown", (e) => startDrag(e, "end"));

  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !sliderRect) return;

    const x = e.clientX - sliderRect.left;
    const percent = Math.max(0, Math.min(100, (x / sliderRect.width) * 100));
    const seconds = Math.round((percent / 100) * duration);

    const minGap = 30; // Minimum 30 seconds for clips

    if (activeHandle === "start") {
      const currentEnd = parseTime(endTimeInput.value);
      startTimeInput.value = formatTime(Math.min(seconds, currentEnd - minGap));
    } else if (activeHandle === "end") {
      const currentStart = parseTime(startTimeInput.value);
      endTimeInput.value = formatTime(Math.max(seconds, currentStart + minGap));
    }

    updateSlider();
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    activeHandle = null;
    sliderRect = null;
  });

  // Text input listeners
  startTimeInput.addEventListener("input", () => {
    const sec = parseTime(startTimeInput.value);
    if (!isNaN(sec) && sec >= 0 && sec <= duration) {
      updateSlider();
    }
  });

  endTimeInput.addEventListener("input", () => {
    const sec = parseTime(endTimeInput.value);
    if (!isNaN(sec) && sec >= 0 && sec <= duration) {
      updateSlider();
    }
  });

  // Initial update
  updateSlider();
}

// Helper to format seconds
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Background prefetch function
async function prefetchAllPlaylistOptions(startIndex) {
  console.log("Starting background prefetch of all playlist options...");
  const videos = playlistState.videos;

  // We can fetch in parallel batches to be faster but polite
  const BATCH_SIZE = 3;

  // Create an array of indices to fetch, excluding checks if already cached
  const indicesToFetch = [];
  for (let i = 0; i < videos.length; i++) {
    if (i === startIndex) continue; // Already fetched
    if (window.playlistItemState[i]) continue; // Already cached
    indicesToFetch.push(i);
  }

  // Process in batches
  for (let i = 0; i < indicesToFetch.length; i += BATCH_SIZE) {
    const batch = indicesToFetch.slice(i, i + BATCH_SIZE);
    const promises = batch.map(idx => {
      const video = videos[idx];
      const url = `https://www.youtube.com/watch?v=${video.id}`;
      // Use cache aware fetcher to respect existing promises
      return fetchVideoCacheAware(idx, url).catch(err => {
        console.warn(`Failed to prefetch item ${idx}:`, err);
      });
    });

    // Wait for batch to finish before starting next to avoid network congestion
    await Promise.all(promises);
  }
  console.log("Background prefetch complete.");
}
