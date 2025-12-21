// Playlist List View Rendering
// eslint-disable-next-line no-unused-vars
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

        // Auto-fetch options immediately (Staggered to prevent freezing)
        setTimeout(() => {
            const btn = item.querySelector('.pl-load-options-btn');
            // Call function directly to ensure execution, bypassing potential event listener issues
            if (btn && typeof window.toggleItemOptions === 'function') {
                window.toggleItemOptions(index, video.url, btn);
            }
        }, 300 * (index + 1)); // 300ms delay per item
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

    // Batch Download Handler
    downloadSelectedBtn.onclick = () => {
        const selected = document.querySelectorAll(".pl-checkbox:checked");
        if (selected.length === 0) return;

        alert(`Starting download for ${selected.length} videos... (Batch logic placeholder)`);
        // In real impl: Iterate selected indices, check if options loaded, queue downloads
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

    // Load content if not already loaded
    if (!optionsContainer.hasChildNodes()) {
        // Clone template
        const template = document.getElementById("playlist-item-options-template");
        const content = template.content.cloneNode(true);
        optionsContainer.appendChild(content);

        const loader = optionsContainer.querySelector(".loader-container");
        const realOptions = optionsContainer.querySelector(".options-container");

        // Hide quality row initially until format is selected
        const qualityRow = realOptions.querySelector(".quality-row");
        if (qualityRow) qualityRow.style.display = "none";

        loader.style.display = "flex";

        try {
            // Re-use fetchVideoData logic
            const data = await fetchVideoData(url);

            // Store state
            window.playlistItemState[index] = data;

            // Populate Formats using format pills
            const formatPills = realOptions.querySelectorAll(".format-pill");
            const qualitySelect = realOptions.querySelector(".pl-quality-select");

            formatPills.forEach(pill => {
                pill.addEventListener("click", () => {
                    // Update Active State
                    formatPills.forEach(p => p.classList.remove("active"));
                    pill.classList.add("active");

                    const fmt = pill.dataset.format;
                    // Map format to data properties
                    let qualities = [];
                    if (fmt === "audio") qualities = data.mp3Data.qualities;
                    else if (fmt === "video") qualities = data.mp4Data.qualities;
                    else qualities = data.mp4Data.qualities; // Default fallback

                    // Populate Quality Select
                    qualitySelect.innerHTML = '<option value="">Select Quality</option>';
                    qualities.forEach(q => {
                        const opt = document.createElement("option");
                        opt.value = q.url || q.quality;
                        opt.textContent = q.quality + (q.size ? ` (${q.size})` : "");
                        opt.dataset.note = q.note;
                        qualitySelect.appendChild(opt);
                    });

                    // Show quality row now that format is selected
                    const qualityRow = realOptions.querySelector(".quality-row");
                    if (qualityRow) qualityRow.style.display = "flex";
                });
            });

            // Trigger initial state - click "video" pill
            const defaultPill = Array.from(formatPills).find(p => p.dataset.format === "video") || formatPills[0];
            if (defaultPill) defaultPill.click();

            // Show result
            loader.style.display = "none";
            realOptions.style.display = "block";

        } catch (e) {
            console.error(e);
            loader.innerHTML = `<span style="color:red"><i class="fas fa-exclamation-circle"></i> Failed to load options</span>`;
        }
    }
};

// Helper to format seconds
// Helper to format seconds (Unused internally but kept for utility)
// eslint-disable-next-line no-unused-vars
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/* global fetchVideoData */
