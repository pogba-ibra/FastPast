/**
 * Disclaimer Modal Script
 * Handles scroll detection and button enabling
 * Auto-shows on first visit or after successful login
 */

(function () {
    'use strict';

    // DOM Elements (will be resolved/bound when available)
    let modalContent = document.getElementById('modalContent');
    let btnAcknowledge = document.getElementById('btnAcknowledge');
    let acknowledgmentText = document.getElementById('acknowledgmentText');
    let overlay = document.getElementById('disclaimerOverlay');

    // Configuration
    // const SCROLL_THRESHOLD = 50; // Unused // Activate on any scroll attempt
    const STORAGE_KEY = 'fastpast_disclaimer_acknowledged';
    const LOGIN_FLAG_KEY = 'fastpast_just_logged_in';

    /**
     * Check if user just logged in or is visiting for the first time
     */
    function shouldShowDisclaimer() {
        // Check if user just logged in
        const justLoggedIn = sessionStorage.getItem(LOGIN_FLAG_KEY);
        if (justLoggedIn === 'true') {
            // Clear the flag
            sessionStorage.removeItem(LOGIN_FLAG_KEY);
            return true;
        }

        // Check if user has never acknowledged the disclaimer
        const acknowledged = localStorage.getItem(STORAGE_KEY);
        if (!acknowledged || acknowledged !== 'true') {
            return true;
        }

        return false;
    }

    /**
     * Auto-show modal on page load if needed
     */
    function autoShowModal() {
        if (shouldShowDisclaimer()) {
            overlay.style.display = 'flex';
            overlay.style.animation = 'fadeIn 0.3s ease-out';

            // Detect and apply theme
            applyTheme();
        } else {
            overlay.style.display = 'none';
        }
    }

    /**
     * Detect and apply current theme (light/dark mode)
     */
    function applyTheme() {
        const htmlElement = document.documentElement;
        const bodyElement = document.body;

        // Check if parent page has theme set
        if (htmlElement.classList.contains('light-mode') ||
            htmlElement.hasAttribute('data-theme') && htmlElement.getAttribute('data-theme') === 'light' ||
            bodyElement.classList.contains('light-mode')) {
            // Already in light mode, no action needed
        }

        // Listen for theme changes
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
                    // Theme changed, CSS variables will update automatically
                }
            });
        });

        observer.observe(htmlElement, { attributes: true });
        observer.observe(bodyElement, { attributes: true });
    }

    /**
     * Check if user has scrolled to bottom
     */
    function isScrolledToBottom() {
        const scrollTop = modalContent.scrollTop;
        const scrollHeight = modalContent.scrollHeight;
        const clientHeight = modalContent.clientHeight;

        // If content fits without scrolling, consider it readable
        if (scrollHeight <= clientHeight) {
            return true;
        }

        // Require reaching (or nearly reaching) the bottom
        const epsilon = 8; // small tolerance for platform differences
        const bottomReached = scrollTop + clientHeight >= scrollHeight - epsilon;
        return bottomReached;
    }

    /**
     * Update button state based on scroll position
     */
    function updateButtonState() {
        if (isScrolledToBottom()) {
            enableButton();
        } else {
            disableButton();
        }
    }

    /**
     * Enable the acknowledge button
     */
    function enableButton() {
        if (!btnAcknowledge) return;
        // Ensure both property and attribute are cleared
        btnAcknowledge.disabled = false;
        btnAcknowledge.removeAttribute('disabled');
        acknowledgmentText.textContent = 'You have read the entire message';
        acknowledgmentText.classList.add('ready');

        // Remove any animations; keep the button static
        btnAcknowledge.style.animation = 'none';
    }

    /**
     * Disable the acknowledge button
     */
    function disableButton() {
        btnAcknowledge.disabled = true;
        acknowledgmentText.textContent = 'Please scroll to read the message';
        acknowledgmentText.classList.remove('ready');
    }

    /**
     * Handle button click
     */
    function handleAcknowledge() {
        // Save acknowledgment to localStorage
        localStorage.setItem(STORAGE_KEY, 'true');

        // Add exit animation
        overlay.style.animation = 'fadeOut 0.3s ease-out forwards';

        // Wait for animation to complete before redirecting
        setTimeout(function () {
            overlay.style.display = 'none';

            // Dispatch custom event that parent page can listen to
            const event = new CustomEvent('disclaimerAcknowledged', {
                detail: { timestamp: new Date().toISOString() }
            });
            window.dispatchEvent(event);

            // Redirect to home page
            // Check if we're already on the home page or if this is standalone
            if (window.location.pathname === '/disclaimer-modal.html' ||
                window.location.pathname === '/Web/disclaimer-modal.html' ||
                window.location.pathname.includes('disclaimer-modal.html')) {
                window.location.href = '/index.html';
            }
        }, 300);
    }

    /**
     * Add fadeOut animation to CSS dynamically if not present
     */
    function ensureFadeOutAnimation() {
        const styleSheet = document.styleSheets[0];
        const keyframes = `
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;

        try {
            styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        } catch (e) { // eslint-disable-line no-unused-vars
            // Animation might already exist or browser doesn't support
            console.log('FadeOut animation already exists or could not be added');
        }
    }

    /**
     * Debounce function to limit scroll event firing
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;

            const later = function () {
                timeout = null;
                func.apply(context, args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Initialize the modal
     */
    function init() {
        // Auto-show modal if needed
        autoShowModal();

        // The modal markup is injected dynamically; rebind DOM elements in case they weren't available immediately
        const container = document.getElementById('disclaimerModalContainer');
        if (container && !modalContent) {
            // Try to resolve elements after injection
            modalContent = document.getElementById('modalContent');
            btnAcknowledge = document.getElementById('btnAcknowledge');
            acknowledgmentText = document.getElementById('acknowledgmentText');
            overlay = document.getElementById('disclaimerOverlay');
        }

        // Check if content fits without scrolling
        setTimeout(updateButtonState, 100);

        // Add scroll event listener with debouncing
        const debouncedUpdate = debounce(updateButtonState, 100);
        if (modalContent) {
            modalContent.addEventListener('scroll', debouncedUpdate);
            // Fallback: detect any interaction that implies scrolling intent
            modalContent.addEventListener('wheel', updateButtonState, { passive: true });
            modalContent.addEventListener('touchstart', updateButtonState, { passive: true });
            modalContent.addEventListener('touchmove', updateButtonState, { passive: true });
        }
        // Also listen on overlay as a broader fallback
        if (overlay) {
            overlay.addEventListener('wheel', updateButtonState, { passive: true });
            overlay.addEventListener('touchstart', updateButtonState, { passive: true });
            overlay.addEventListener('touchmove', updateButtonState, { passive: true });
        }
        // Global fallback in case of odd scroll containers
        window.addEventListener('scroll', updateButtonState, { passive: true });

        // Add button click listener
        if (btnAcknowledge) {
            btnAcknowledge.addEventListener('click', handleAcknowledge);
        }

        // Ensure fadeOut animation exists
        ensureFadeOutAnimation();

        // Add smooth scroll behavior
        modalContent.style.scrollBehavior = 'smooth';

        // Prevent closing modal by clicking overlay (optional)
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                // Shake animation to indicate modal must be acknowledged
                const modalContainer = overlay.querySelector('.modal-container');
                modalContainer.style.animation = 'shake 0.5s ease-in-out';

                setTimeout(function () {
                    modalContainer.style.animation = 'slideUp 0.4s ease-out';
                }, 500);
            }
        });
    }

    /**
     * Add shake animation
     */
    function addShakeAnimation() {
        const styleSheet = document.styleSheets[0];
        const keyframes = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
        `;

        try {
            styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        } catch (e) { // eslint-disable-line no-unused-vars
            console.log('Shake animation could not be added');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            addShakeAnimation();
        });
    } else {
        init();
        addShakeAnimation();
    }

    // Export functions for potential external use
    window.DisclaimerModal = {
        reset: function () {
            localStorage.removeItem(STORAGE_KEY);
            overlay.style.display = 'flex';
            modalContent.scrollTop = 0;
            updateButtonState();
        },
        show: function () {
            overlay.style.display = 'flex';
            overlay.style.animation = 'fadeIn 0.3s ease-out';
        },
        hide: function () {
            handleAcknowledge();
        },
        setLoginFlag: function () {
            sessionStorage.setItem(LOGIN_FLAG_KEY, 'true');
        }
    };

})();
