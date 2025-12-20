// VAST Video Ad Player
class VASTAdPlayer {
    constructor(vastUrl, onComplete) {
        this.vastUrl = vastUrl;
        this.onComplete = onComplete;
        this.skipOffset = 15; // seconds
        this.createOverlay();
    }

    createOverlay() {
        // Create overlay HTML
        const overlay = document.createElement('div');
        overlay.className = 'vast-ad-overlay';
        overlay.innerHTML = `
            <div class="vast-ad-container">
                <video class="vast-ad-video" controls autoplay>
                    Your browser does not support video playback.
                </video>
                <button class="vast-ad-skip" id="vast-skip-btn">Skip Ad</button>
                <button class="vast-ad-close" id="vast-close-btn">×</button>
                <div class="vast-ad-timer" id="vast-timer"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.video = overlay.querySelector('.vast-ad-video');
        this.skipBtn = overlay.querySelector('.vast-ad-skip');
        this.closeBtn = overlay.querySelector('.vast-ad-close');
        this.timer = overlay.querySelector('.vast-ad-timer');

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Skip button
        this.skipBtn.addEventListener('click', () => this.close(true));

        // Close button
        this.closeBtn.addEventListener('click', () => this.close(true));

        // Video time update
        this.video.addEventListener('timeupdate', () => {
            const currentTime = Math.floor(this.video.currentTime);
            const duration = Math.floor(this.video.duration);

            // Show skip button after skipOffset seconds
            if (currentTime >= this.skipOffset) {
                this.skipBtn.classList.add('visible');
            }

            // Update timer
            if (duration) {
                this.timer.textContent = `${currentTime}s / ${duration}s`;
            }
        });

        // Video ended
        this.video.addEventListener('ended', () => {
            this.close(true);
        });

        // Video error
        this.video.addEventListener('error', (e) => {
            console.error('VAST video error:', e);
            this.close(false);
        });
    }

    async loadAndPlay() {
        try {
            // Fetch VAST XML
            const response = await fetch(this.vastUrl);
            const xmlText = await response.text();

            // Parse VAST XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            // Extract video URL from VAST
            const mediaFiles = xmlDoc.getElementsByTagName('MediaFile');
            let videoUrl = null;

            // Prefer MP4 format
            for (let i = 0; i < mediaFiles.length; i++) {
                const mediaFile = mediaFiles[i];
                const type = mediaFile.getAttribute('type');
                if (type && type.includes('mp4')) {
                    videoUrl = mediaFile.textContent.trim();
                    break;
                }
            }

            // Fallback to first available
            if (!videoUrl && mediaFiles.length > 0) {
                videoUrl = mediaFiles[0].textContent.trim();
            }

            if (!videoUrl) {
                throw new Error('No video URL found in VAST response');
            }

            // Extract skip offset if specified
            const linear = xmlDoc.getElementsByTagName('Linear')[0];
            if (linear) {
                const skipOffsetAttr = linear.getAttribute('skipoffset');
                if (skipOffsetAttr) {
                    // Parse HH:MM:SS format
                    const parts = skipOffsetAttr.split(':');
                    if (parts.length === 3) {
                        this.skipOffset = parseInt(parts[0]) * 3600 +
                            parseInt(parts[1]) * 60 +
                            parseInt(parts[2]);
                    }
                }
            }

            // Set video source and show overlay
            this.video.src = videoUrl;
            this.overlay.classList.add('active');

            // Track impression
            const impressions = xmlDoc.getElementsByTagName('Impression');
            if (impressions.length > 0) {
                const impressionUrl = impressions[0].textContent.trim();
                // Fire impression pixel
                new Image().src = impressionUrl;
            }

        } catch (error) {
            console.error('Error loading VAST ad:', error);
            this.close(false);
        }
    }

    close(completed) {
        // Remove overlay
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        // Call completion callback
        if (this.onComplete) {
            this.onComplete(completed);
        }
    }
}

// Export for use in script.js
window.VASTAdPlayer = VASTAdPlayer;
