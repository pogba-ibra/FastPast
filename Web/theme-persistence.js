// Immediately check and apply theme to prevent flash of unstyled content
(function () {
    try {
        const savedTheme = localStorage.getItem('theme');
        // Only consider dark mode if screen is wide enough (>= 960px)
        const isDesktop = window.matchMedia('(min-width: 960px)').matches;

        // If not desktop, we force light mode (remove class) regardless of saved preference
        if (isDesktop && savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    } catch (e) {
        console.error('Error applying theme:', e);
    }
})();