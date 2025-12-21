// Ad display control based on user subscription
(function () {
    'use strict';

    // Check if user has premium subscription
    function isPremiumUser() {
        try {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) return false;

            const user = JSON.parse(currentUser);
            const premiumTiers = ['lifetime', 'studio', 'creator'];

            return user && user.subscription && premiumTiers.includes(user.subscription.toLowerCase());
        } catch (e) {
            console.error('Error checking premium status:', e);
            return false;
        }
    }

    // Hide ads for premium users
    function hideAdsForPremiumUsers() {
        if (isPremiumUser()) {
            console.log('Premium user detected - hiding ads');

            // Hide sticky banner ad
            const stickyBanner = document.getElementById('sticky-banner-ad');
            if (stickyBanner) {
                stickyBanner.style.display = 'none';
            }

            // Set flag to skip VAST ads
            window.skipVASTAds = true;
        }
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideAdsForPremiumUsers);
    } else {
        hideAdsForPremiumUsers();
    }
})();
