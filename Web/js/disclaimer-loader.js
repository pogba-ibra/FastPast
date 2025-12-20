// Load disclaimer modal content dynamically
(function () {
    'use strict';

    try {
        const acknowledged = localStorage.getItem('fastpast_disclaimer_acknowledged') === 'true';
        if (acknowledged) {
            console.log('Disclaimer already acknowledged; skipping modal.');
            return;
        }
    } catch (e) {
        // If localStorage not available (e.g., cookies disabled), proceed to load modal
        console.warn('LocalStorage access failed, proceeding with modal load:', e);
    }

    fetch('disclaimer-modal-v2.html')
        .then(response => response.text())
        .then(html => {
            // Extract only the modal overlay content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const modalOverlay = doc.querySelector('.modal-overlay');

            if (modalOverlay) {
                document.getElementById('disclaimerModalContainer').appendChild(modalOverlay);

                // Load disclaimer JS
                const script = document.createElement('script');
                script.src = 'scripts/disclaimer-modal.js';
                document.body.appendChild(script);
            }
        })
        .catch(err => console.error('Error loading disclaimer modal:', err));
})();
