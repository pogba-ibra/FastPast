// Force reload script - moved from inline
(function () {
    'use strict';

    if (!sessionStorage.getItem('scriptReloaded')) {
        sessionStorage.setItem('scriptReloaded', 'true');
        location.reload(true);
    }
})();
