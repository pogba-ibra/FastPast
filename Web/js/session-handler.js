/* global io */
// Session invalidation handling via Socket.IO
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Socket.IO
    const socket = io();

    // Listen for session invalidation event
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
});
