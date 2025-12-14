// Features Grid Interactive Elements
document.addEventListener('DOMContentLoaded', () => {
    // Tooltip functionality
    const tooltip = document.getElementById('tooltip');
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const tooltipText = card.getAttribute('data-tooltip');
            if (tooltipText) {
                tooltip.textContent = tooltipText;
                tooltip.style.opacity = '1';

                // Position tooltip
                const rect = card.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();

                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 10}px`;
            }
        });

        card.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        // Reposition tooltip on scroll
        window.addEventListener('scroll', () => {
            if (tooltip.style.opacity === '1') {
                const rect = card.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();

                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 10}px`;
            }
        });
    });

    // Staggered animation for feature cards when they come into view
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100); // Staggered animation with 100ms delay
            }
        });
    }, observerOptions);

    // Set initial state for animation
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // Dark mode toggle (optional feature)
    const darkModeToggle = document.createElement('div');
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(darkModeToggle);

    let isDarkMode = false;

    darkModeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
});
