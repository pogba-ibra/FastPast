// Ad banner configuration - MUST execute immediately before ad scripts load
// Set atOptions based on screen width so ad invoke.js can read it

// Desktop Banner Configuration (728x90)
const atOptions_desktop = {
    'key': '14d8dff183fa615fac59e9cf6507813c',
    'format': 'iframe',
    'height': 90,
    'width': 728,
    'params': {}
};

// Mobile Banner Configuration (320x50)
const atOptions_mobile = {
    'key': 'd5249bc6c1a5fd336816be4c27cf7e1e',
    'format': 'iframe',
    'height': 50,
    'width': 320,
    'params': {}
};

// Set global atOptions based on screen width
// Ad scripts will read window.atOptions when they load
if (window.innerWidth >= 768) {
    window.atOptions = atOptions_desktop;
} else {
    window.atOptions = atOptions_mobile;
}

// Sticky banner with footer detection
(function () {
    'use strict';

    function initStickyBanner() {
        const banner = document.getElementById('sticky-banner-ad');
        if (!banner) return;

        const closeBtn = document.getElementById('close-banner');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.style.display = 'none';
            });
        }

        // Handle scroll to detect footer/bottom of page
        function handleBannerPosition() {
            const scrollHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const clientHeight = window.innerHeight;

            // Calculate distance from bottom
            const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

            // If near bottom of page (within 100px), stop banner above bottom
            if (distanceFromBottom < 100) {
                banner.style.position = 'absolute';
                banner.style.bottom = (distanceFromBottom + 10) + 'px';
            } else {
                banner.style.position = 'fixed';
                banner.style.bottom = '0';
            }
        }

        // Throttle scroll event
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleBannerPosition();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Initial position
        handleBannerPosition();
    }

    // Wait for DOM to initialize sticky behavior
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyBanner);
    } else {
        initStickyBanner();
    }
})();
