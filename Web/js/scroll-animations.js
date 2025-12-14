// Enhanced scroll animations for supported sites section
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is fully visible
        threshold: 0.15 // 15% of the element is visible
    };

    // Observer for the main supported-sites section
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add fade-in class to the section
                entry.target.classList.add('fade-in');
                
                // Trigger site items animation with a slight delay
                setTimeout(() => {
                    const siteItems = entry.target.querySelectorAll('.site-item');
                    siteItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('fade-in');
                        }, index * 100); // Stagger each item by 100ms
                    });
                }, 300); // Wait 300ms after section starts fading in
                
                // Stop observing once the animation is triggered
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observer for individual site items (fallback)
    const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('fade-in')) {
                entry.target.classList.add('fade-in');
                itemObserver.unobserve(entry.target);
            }
        });
    }, {
        ...observerOptions,
        threshold: 0.2
    });

    // Target the supported-sites section
    const supportedSitesSection = document.querySelector('.supported-sites');
    if (supportedSitesSection) {
        sectionObserver.observe(supportedSitesSection);
    }

    // Target all site items as fallback
    const siteItems = document.querySelectorAll('.site-item');
    siteItems.forEach(item => {
        itemObserver.observe(item);
    });

    // Also observe other fade-in elements
    const fadeInElements = document.querySelectorAll('.fade-in:not(.supported-sites):not(.site-item)');
    fadeInElements.forEach(element => {
        itemObserver.observe(element);
    });
});
