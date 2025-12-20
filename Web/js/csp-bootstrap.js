// CSP Bootstrap - Must load before any other scripts
// This script generates nonces and updates the CSP policy
(function () {
    'use strict';

    // Generate a cryptographically secure random nonce
    function generateNonce() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    const nonce = generateNonce();

    // Update CSP meta tag with the generated nonce
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
        const currentCSP = cspMeta.getAttribute('content');
        // Replace nonce placeholder with actual nonce
        const updatedCSP = currentCSP.replace(/nonce-PLACEHOLDER/g, `nonce-${nonce}`);
        cspMeta.setAttribute('content', updatedCSP);
    }

    // Add nonce to all inline scripts that don't have src attribute
    const inlineScripts = document.querySelectorAll('script:not([src]):not([nonce])');
    inlineScripts.forEach(script => {
        // Skip this bootstrap script itself
        if (script.textContent.includes('CSP Bootstrap')) {
            return;
        }
        script.setAttribute('nonce', nonce);
    });

    // Store nonce globally for any dynamically created scripts
    window.CSP_NONCE = nonce;
})();
