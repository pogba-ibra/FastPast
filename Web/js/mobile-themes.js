// Mobile Themes and Touch Interactions
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeOptions = document.createElement('div');
    themeOptions.className = 'theme-options';
    themeOptions.innerHTML = `
        <div class="theme-option" data-theme="default">
            <i class="fas fa-sun"></i>
            <span>Light Mode</span>
        </div>
        <div class="theme-option" data-theme="dark">
            <i class="fas fa-moon"></i>
            <span>Dark Mode</span>
        </div>
        <div class="theme-option" data-theme="minimalist">
            <i class="fas fa-palette"></i>
            <span>Minimalist</span>
        </div>
    `;
    document.body.appendChild(themeOptions);

    // Toggle theme options menu
    themeToggle.addEventListener('click', () => {
        themeOptions.classList.toggle('active');
    });

    // Close theme options when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeToggle.contains(e.target) && !themeOptions.contains(e.target)) {
            themeOptions.classList.remove('active');
        }
    });

    // Apply selected theme
    const themeOptionElements = document.querySelectorAll('.theme-option');
    themeOptionElements.forEach(option => {
        option.addEventListener('click', () => {
            const selectedTheme = option.getAttribute('data-theme');
            applyTheme(selectedTheme);
            themeOptions.classList.remove('active');

            // Update theme toggle icon
            const themeToggleIcon = themeToggle.querySelector('i');
            if (selectedTheme === 'dark') {
                themeToggleIcon.className = 'fas fa-moon';
            } else if (selectedTheme === 'minimalist') {
                themeToggleIcon.className = 'fas fa-palette';
            } else {
                themeToggleIcon.className = 'fas fa-sun';
            }

            // Save theme preference
            localStorage.setItem('theme', selectedTheme);
        });
    });

    // Load saved theme or default
    const savedTheme = localStorage.getItem('theme') || 'default';
    applyTheme(savedTheme);

    function applyTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('dark-mode', 'minimalist-theme');

        // Apply selected theme
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (theme === 'minimalist') {
            document.body.classList.add('minimalist-theme');
        }

        // Update theme toggle icon
        const themeToggleIcon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            themeToggleIcon.className = 'fas fa-moon';
        } else if (theme === 'minimalist') {
            themeToggleIcon.className = 'fas fa-palette';
        } else {
            themeToggleIcon.className = 'fas fa-sun';
        }
    }

    // Touch-friendly swipe navigation for features
    const featuresContainer = document.getElementById('features-container');
    let startX = 0;
    let scrollLeft = 0;
    let isDown = false;

    // Mouse events
    featuresContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - featuresContainer.offsetLeft;
        scrollLeft = featuresContainer.scrollLeft;
    });

    featuresContainer.addEventListener('mouseleave', () => {
        isDown = false;
    });

    featuresContainer.addEventListener('mouseup', () => {
        isDown = false;
    });

    featuresContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - featuresContainer.offsetLeft;
        const walk = (x - startX) * 2;
        featuresContainer.scrollLeft = scrollLeft - walk;
    });

    // Touch events for mobile
    featuresContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - featuresContainer.offsetLeft;
        scrollLeft = featuresContainer.scrollLeft;
    });

    featuresContainer.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX - featuresContainer.offsetLeft;
        const walk = (x - startX) * 2;
        featuresContainer.scrollLeft = scrollLeft - walk;
    });

    // Hide swipe indicators after first interaction
    const swipeIndicators = document.querySelectorAll('.swipe-indicator');
    const hideSwipeIndicators = () => {
        swipeIndicators.forEach(indicator => {
            indicator.style.opacity = '0';
        });

        // Remove event listeners after first interaction
        featuresContainer.removeEventListener('touchstart', hideSwipeIndicators);
        featuresContainer.removeEventListener('mousedown', hideSwipeIndicators);
    };

    featuresContainer.addEventListener('touchstart', hideSwipeIndicators);
    featuresContainer.addEventListener('mousedown', hideSwipeIndicators);

    // Touch feedback for buttons
    const buttons = document.querySelectorAll('.cta-button, .feature-card');
    buttons.forEach(button => {
        button.addEventListener('touchstart', () => {
            button.style.transform = 'scale(0.98)';
        });

        button.addEventListener('touchend', () => {
            button.style.transform = 'scale(1)';
        });
    });

    // Parallax effect for mobile
    const parallaxElements = document.querySelectorAll('.parallax-element');
    let ticking = false;

    function updateParallax() {
        const scrollY = window.pageYOffset;

        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrollY * speed);

            element.style.transform = `translateY(${yPos}px)`;
        });

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);

    // Hamburger menu functionality
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navWrapper = document.getElementById('nav-wrapper');
    const closeMenuBtn = document.getElementById('close-menu-btn');

    hamburgerBtn.addEventListener('click', () => {
        navWrapper.classList.add('active');
    });

    closeMenuBtn.addEventListener('click', () => {
        navWrapper.classList.remove('active');
    });

    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('#nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navWrapper.classList.remove('active');
        });
    });

    // Close menu when clicking Go Premium button specifically
    const goPremiumBtn = document.querySelector('.go-premium-btn');
    console.log('Go Premium button found:', goPremiumBtn); // Debug log
    if (goPremiumBtn) {
        goPremiumBtn.addEventListener('click', (e) => {
            console.log('Go Premium clicked, closing menu'); // Debug log
            
            // Close the menu first
            navWrapper.classList.remove('active');
            
            // Then handle the navigation after a short delay to ensure menu closes
            setTimeout(() => {
                window.location.href = '#pricing-tiers';
            }, 100);
            
            // Prevent the onclick from firing
            e.preventDefault();
            e.stopPropagation();
        });
    }
});
