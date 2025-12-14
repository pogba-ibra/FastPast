// Profile dropdown functionality for authenticated users
(function () {
    const API_URL = '';

    // Check authentication status on page load
    async function checkAuthAndUpdateUI() {
        const sessionToken = localStorage.getItem('sessionToken');

        if (!sessionToken) {
            showLoginButton();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/session`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                window.currentUser = data.data.user; // Expose user globally
                console.log('Current User Data:', data.data.user); // Debug logging
                showProfileDropdown(data.data.user);
            } else {
                // Session invalid, clear storage and show login
                window.currentUser = null;
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('currentUser');
                showLoginButton();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            showLoginButton();
        }
    }

    // Show login button (not authenticated)
    function showLoginButton() {
        const desktopButtons = document.querySelector('.header-buttons');
        const mobileButtons = document.querySelectorAll('.mobile-only.button-items');

        if (desktopButtons) {
            const existingProfile = desktopButtons.querySelector('.profile-dropdown-container');
            if (existingProfile) {
                existingProfile.remove();
            }

            // Show login button
            const loginBtn = desktopButtons.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.style.display = 'inline-flex';
            }
        }

        // Mobile login button
        mobileButtons.forEach(item => {
            if (item.textContent.includes('LOGIN')) {
                item.style.display = 'list-item';
            }
        });
    }

    // Show profile dropdown (authenticated)
    function showProfileDropdown(user) {
        const desktopButtons = document.querySelector('.header-buttons');
        const mobileMenu = document.getElementById('nav-menu');

        // Check if user has a timed subscription (used by both desktop and mobile)
        const timedMemberships = ['creator', 'studio'];
        const hasTimedSub = timedMemberships.includes(user.membershipType) && user.subscriptionEndDate;

        // Desktop profile dropdown
        if (desktopButtons) {
            // Hide login button
            const loginBtn = desktopButtons.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.style.display = 'none';
            }

            // Remove existing profile if any
            const existingProfile = desktopButtons.querySelector('.profile-dropdown-container');
            if (existingProfile) {
                existingProfile.remove();
            }

            // Create profile dropdown
            const profileContainer = document.createElement('div');
            profileContainer.className = 'profile-dropdown-container';

            const timerHtml = hasTimedSub ? `
                <div class="subscription-timer" id="subscription-timer">
                    <i class="fas fa-clock"></i> <span id="timer-countdown">Loading...</span>
                </div>
            ` : '';

            // Profile Picture Logic
            const profilePicHtml = user.profilePicture
                ? `<img src="${user.profilePicture}" alt="Profile" class="profile-pic-img" referrerpolicy="no-referrer" onerror="this.outerHTML='<i class=\\'fas fa-user-circle\\'></i>'">`
                : `<i class="fas fa-user-circle"></i>`;

            const dropdownPicHtml = user.profilePicture
                ? `<img src="${user.profilePicture}" alt="Profile" class="profile-avatar img-avatar" referrerpolicy="no-referrer" onerror="this.outerHTML='<i class=\\'fas fa-user-circle profile-avatar\\'></i>'">`
                : `<i class="fas fa-user-circle profile-avatar"></i>`;

            profileContainer.innerHTML = `
                <button class="profile-button" id="profile-button">
                    ${profilePicHtml}
                </button>
                <div class="profile-dropdown" id="profile-dropdown">
                    <div class="profile-header">
                        ${dropdownPicHtml}
                        <div class="profile-info">
                            <div class="profile-greeting">Hello,</div>
                            <div class="profile-username">${user.username}</div>
                        </div>
                    </div>
                    <div class="profile-membership">
                        <span class="membership-badge ${user.membershipType}">${getMembershipBadge(user.membershipType)} ${user.membershipType.toUpperCase()}</span>
                    </div>
                    ${timerHtml}
                    <div class="profile-divider"></div>
                    <button class="logout-button" id="logout-button">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;

            desktopButtons.appendChild(profileContainer);

            // Start timer if user has timed subscription
            if (hasTimedSub) {
                startCountdownTimer(user.subscriptionEndDate);
            }

            // Add event listeners
            setupDropdownListeners();
        }

        // Mobile profile in hamburger menu
        if (mobileMenu) {
            // Hide mobile login button
            const mobileLoginItems = document.querySelectorAll('.mobile-only.button-items');
            mobileLoginItems.forEach(item => {
                if (item.textContent.includes('LOGIN')) {
                    item.style.display = 'none';
                }
            });

            // Remove existing mobile profile if any
            const existingMobileProfile = mobileMenu.querySelector('.mobile-profile-menu-item');
            if (existingMobileProfile) {
                existingMobileProfile.remove();
            }

            // Add mobile profile button at the top of nav menu
            const mobileProfileItem = document.createElement('li');
            mobileProfileItem.className = 'mobile-profile-menu-item';
            // Mobile Profile Picture
            const mobilePicHtml = user.profilePicture
                ? `<img src="${user.profilePicture}" alt="Profile" class="profile-pic-img-small" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.outerHTML='<i class=\\'fas fa-user-circle\\'></i>'">`
                : `<i class="fas fa-user-circle"></i>`;

            // Mobile timer HTML
            const mobileTimerHtml = hasTimedSub ? `
                <div class="mobile-subscription-timer" id="mobile-subscription-timer">
                    <i class="fas fa-clock"></i> <span id="mobile-timer-countdown">Loading...</span>
                </div>
            ` : '';

            mobileProfileItem.innerHTML = `
                <a href="#" class="mobile-profile-toggle" id="mobile-profile-toggle">
                    ${mobilePicHtml} Profile
                </a>
                <div class="mobile-profile-expanded" id="mobile-profile-expanded">
                    <div class="mobile-profile-content">
                        <div class="mobile-profile-greeting">Hello,</div>
                        <div class="mobile-profile-username">${user.username}</div>
                        <div class="mobile-profile-badge">
                            <span class="membership-badge ${user.membershipType}">${getMembershipBadge(user.membershipType)} ${user.membershipType.toUpperCase()}</span>
                        </div>
                        ${mobileTimerHtml}
                        <button class="mobile-logout-btn" id="mobile-logout-button">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            `;

            // Insert at the beginning of nav menu
            mobileMenu.insertBefore(mobileProfileItem, mobileMenu.firstChild);

            // Start mobile timer if user has timed subscription
            if (hasTimedSub) {
                startMobileCountdownTimer(user.subscriptionEndDate);
            }

            // Setup mobile profile toggle
            const mobileProfileToggle = document.getElementById('mobile-profile-toggle');
            const mobileProfileExpanded = document.getElementById('mobile-profile-expanded');

            if (mobileProfileToggle && mobileProfileExpanded) {
                mobileProfileToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Toggle expanded state
                    const isExpanded = mobileProfileExpanded.classList.contains('show');

                    if (isExpanded) {
                        mobileProfileExpanded.classList.remove('show');
                        mobileProfileToggle.classList.remove('active');
                    } else {
                        mobileProfileExpanded.classList.add('show');
                        mobileProfileToggle.classList.add('active');
                    }
                });
            }

            // Mobile logout button
            const mobileLogoutBtn = document.getElementById('mobile-logout-button');
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', handleLogout);
            }
        }
    }

    // Setup dropdown toggle and logout listeners
    function setupDropdownListeners() {
        const profileButton = document.getElementById('profile-button');
        const profileDropdown = document.getElementById('profile-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (profileButton && profileDropdown) {
            // Toggle dropdown
            profileButton.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }

    // Handle logout
    async function handleLogout() {
        const sessionToken = localStorage.getItem('sessionToken');

        if (sessionToken) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        // Clear storage
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('currentUser');

        // Reload the current page instead of redirecting to login
        // This will show the login button again and remove the profile dropdown
        window.location.reload();
    }

    // Get membership badge emoji
    function getMembershipBadge(membershipType) {
        const badges = {
            'free': '🆓',
            'monthly': '⭐',
            'semi-yearly': '💎',
            'yearly': '👑',
            'lifetime': '♾️',
            'creator': '🎨',
            'studio': '🎬'
        };
        return badges[membershipType] || '';
    }

    // Countdown timer for subscription expiry
    let timerInterval = null;

    function startCountdownTimer(expiryDate) {
        const timerElement = document.getElementById('timer-countdown');
        if (!timerElement) return;

        function updateTimer() {
            const now = new Date();
            const expiry = new Date(expiryDate);
            const diff = expiry - now;

            if (diff <= 0) {
                timerElement.textContent = 'Expired!';
                timerElement.style.color = '#ff4444';
                if (timerInterval) {
                    clearInterval(timerInterval);
                }
                // Reload page to trigger subscription check
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                return;
            }

            // Calculate days, hours, minutes, seconds
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Always show a real countdown with seconds
            if (days > 0) {
                timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                timerElement.textContent = `${minutes}m ${seconds}s`;
            } else {
                timerElement.textContent = `${seconds}s`;
            }

            // Warning color when less than 5 minutes
            if (days === 0 && hours === 0 && minutes < 5) {
                timerElement.style.color = '#ff6600';
            }
        }

        // Update immediately
        updateTimer();

        // Update every second
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        timerInterval = setInterval(updateTimer, 1000);
    }

    // Mobile countdown timer for subscription expiry
    let mobileTimerInterval = null;

    function startMobileCountdownTimer(expiryDate) {
        const timerElement = document.getElementById('mobile-timer-countdown');
        if (!timerElement) return;

        function updateTimer() {
            const now = new Date();
            const expiry = new Date(expiryDate);
            const diff = expiry - now;

            if (diff <= 0) {
                timerElement.textContent = 'Expired!';
                timerElement.style.color = '#ff4444';
                if (mobileTimerInterval) {
                    clearInterval(mobileTimerInterval);
                }
                // Reload page to trigger subscription check
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                return;
            }

            // Calculate days, hours, minutes, seconds
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            // Always show a real countdown with seconds
            if (days > 0) {
                timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            } else if (hours > 0) {
                timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
                timerElement.textContent = `${minutes}m ${seconds}s`;
            } else {
                timerElement.textContent = `${seconds}s`;
            }

            // Warning color when less than 5 minutes
            if (days === 0 && hours === 0 && minutes < 5) {
                timerElement.style.color = '#ff6600';
            }
        }

        // Update immediately
        updateTimer();

        // Update every second
        if (mobileTimerInterval) {
            clearInterval(mobileTimerInterval);
        }
        mobileTimerInterval = setInterval(updateTimer, 1000);
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuthAndUpdateUI);
    } else {
        checkAuthAndUpdateUI();
    }
})();
