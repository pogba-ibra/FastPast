// Ad banner configuration and sticky behavior
(function () {
    'use strict';

    // Desktop Banner Configuration (728x90)
    window.atOptions_desktop = {
        'key': '14d8dff183fa615fac59e9cf6507813c',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
    };

    // Mobile Banner Configuration (320x50)
    window.atOptions_mobile = {
        'key': 'd5249bc6c1a5fd336816be4c27cf7e1e',
        'format': 'iframe',
        'height': 50,
        'width': 320,
        'params': {}
    };

    // Sticky banner with footer detection
    function initStickyBanner() {
        const banner = document.getElementById('sticky-banner-ad');
        const closeBtn = document.getElementById('close-banner');

        if (!banner) return;

        // Close button functionality
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.classList.add('hidden');
                sessionStorage.setItem('bannerClosed', 'true');
            });
        }

        // Check if banner was closed in this session
        if (sessionStorage.getItem('bannerClosed') === 'true') {
            banner.classList.add('hidden');
            return;
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

        // Run on scroll
        window.addEventListener('scroll', handleBannerPosition);
        window.addEventListener('resize', handleBannerPosition);

        // Initial check
        handleBannerPosition();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyBanner);
    } else {
        initStickyBanner();
    }
})();
