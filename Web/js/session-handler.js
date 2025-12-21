/* global io */
// Session invalidation handling via Socket.IO
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Socket.IO with error handling
    try {
        const socket = io({
            // Set reasonable timeouts to avoid hanging
            timeout: 5000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 3
        });

        // Handle connection errors gracefully
        socket.on('connect_error', (error) => {
            console.warn('Socket.IO connection failed (non-critical):', error.message);
            // Session invalidation feature will be unavailable, but app continues to work
        });

        socket.on('connect_timeout', () => {
            console.warn('Socket.IO connection timeout (non-critical)');
        });

        // Listen for session invalidation event (only if connected)
        socket.on('session-invalidated', (data) => {
            const currentToken = localStorage.getItem('sessionToken');

            // Check if current session was invalidated
            if (currentToken && data.sessionTokens && data.sessionTokens.includes(currentToken)) {
                // Show notification
                alert('Your session has been logged out from another device. Please log in again.');

                // Clear local session data
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('currentUser');

                // Redirect to login page
                window.location.href = '/login.html';
            }
        });
    } catch (error) {
        // Socket.IO failed to initialize or is not available
        console.warn('Socket.IO not available (session sync disabled):', error.message);
        // App continues to function without real-time session sync
    }
});
