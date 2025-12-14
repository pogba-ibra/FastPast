// Pre-render authentication check to prevent login button flash
// This script runs BEFORE the page renders to hide/show elements based on auth status
(function () {
    // Check if user has a session token (synchronous check from localStorage)
    const sessionToken = localStorage.getItem('sessionToken');

    if (sessionToken) {
        // User appears to be logged in - hide login buttons immediately
        document.documentElement.classList.add('user-authenticated');
    } else {
        // User is not logged in - show login buttons
        document.documentElement.classList.add('user-not-authenticated');
    }
})();
