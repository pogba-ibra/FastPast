// Ad display control based on user subscription
(function () {
    'use strict';

    // Check if user is a FREE user (should see ads)
    function isFreeUser() {
        try {
            const currentUser = localStorage.getItem('currentUser');

            // If no user logged in, show ads
            if (!currentUser) {
                console.log('No user logged in - showing ads');
                return true;
            }

            const user = JSON.parse(currentUser);

            // Check membershipType - show ads only for 'free' tier
            if (user.membershipType === 'free') {
                console.log('Free user detected - showing ads');
                return true;
            }

            // Check if subscription has expired
            if (user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate)) {
                console.log('Subscription expired - showing ads');
                return true;
            }

            // User has active premium subscription
            console.log('Premium user detected:', user.membershipType, '- hiding ads');
            return false;

        } catch (e) {
            console.error('Error checking user subscription:', e);
            // On error, show ads to be safe
            return true;
        }
    }

    // Hide ads for premium users (show only for free users)
    function controlAdsBasedOnSubscription() {
        const showAds = isFreeUser();

        if (!showAds) {
            // Premium user - hide ads
            console.log('Hiding ads for premium user');

            // Hide sticky banner ad
            const stickyBanner = document.getElementById('sticky-banner-ad');
            if (stickyBanner) {
                stickyBanner.style.display = 'none';
            }

            // Set flag to skip VAST ads
            window.skipVASTAds = true;
        } else {
            // Free user - ensure ads are visible
            console.log('Showing ads for free/non-logged-in user');

            const stickyBanner = document.getElementById('sticky-banner-ad');
            if (stickyBanner) {
                stickyBanner.style.display = ''; // Reset to default
            }

            window.skipVASTAds = false;
        }
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', controlAdsBasedOnSubscription);
    } else {
        controlAdsBasedOnSubscription();
    }

    // Re-check when user logs in/out (listen for storage changes)
    window.addEventListener('storage', function (e) {
        if (e.key === 'currentUser') {
            console.log('User data changed - rechecking ad display');
            controlAdsBasedOnSubscription();
        }
    });
})();
