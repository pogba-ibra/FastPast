// Immediately check and apply theme to prevent flash of unstyled content
(function () {
    try {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
    } catch (e) {
        console.error('Error applying theme:', e);
    }
})();