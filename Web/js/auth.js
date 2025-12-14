// Authentication utility functions for frontend

// API base URL
const API_URL = '';

// Get session token from localStorage
function getSessionToken() {
    return localStorage.getItem('sessionToken');
}

// Set session token in localStorage
function setSessionToken(token) {
    if (token) {
        localStorage.setItem('sessionToken', token);
    } else {
        localStorage.removeItem('sessionToken');
    }
}

// Get current user info
function getUserInfo() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Set current user info
function setUserInfo(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

// Check if user is authenticated
async function checkAuth() {
    const token = getSessionToken();

    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/auth/session`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            setUserInfo(data.data.user);
            return data.data.user;
        } else {
            // Session invalid, clear storage
            logout();
            return null;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Logout function
async function logout() {
    const token = getSessionToken();

    if (token) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Clear local storage
    setSessionToken(null);
    setUserInfo(null);

    // Redirect to login
    window.location.href = '/login.html';
}

// Check if user has premium access
function hasPremiumAccess() {
    const user = getUserInfo();
    if (!user) return false;

    if (user.membershipType === 'lifetime') {
        return true;
    }

    if (user.membershipType === 'free') {
        return false;
    }

    // Check if subscription is active and not expired
    if (user.subscriptionStatus === 'active' && user.subscriptionEndDate) {
        return new Date() < new Date(user.subscriptionEndDate);
    }

    return false;
}

// Get membership display info
function getMembershipInfo() {
    const user = getUserInfo();
    if (!user) return { type: 'Guest', badge: '' };

    const badges = {
        free: '🆓',
        monthly: '⭐',
        'semi-yearly': '💎',
        yearly: '👑',
        lifetime: '♾️'
    };

    const names = {
        free: 'Free',
        monthly: 'Monthly',
        'semi-yearly': 'Semi-Yearly',
        yearly: 'Yearly',
        lifetime: 'Lifetime'
    };

    return {
        type: names[user.membershipType] || user.membershipType,
        badge: badges[user.membershipType] || '',
        isPremium: hasPremiumAccess()
    };
}

// Update UI based on authentication status
async function updateAuthUI() {
    const user = await checkAuth();
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const membershipBadge = document.getElementById('membership-badge');

    if (user) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            const membership = getMembershipInfo();
            userInfo.innerHTML = `
                <span>${membership.badge} ${user.username}</span>
                <button onclick="logout()" style="margin-left: 10px;">Logout</button>
            `;
            userInfo.style.display = 'block';
        }
        if (membershipBadge) {
            const membership = getMembershipInfo();
            membershipBadge.textContent = `${membership.badge} ${membership.type}`;
        }
    } else {
        // User is not logged in
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

// Export functions for use in other scripts
window.authUtils = {
    getSessionToken,
    setSessionToken,
    getUserInfo,
    setUserInfo,
    checkAuth,
    logout,
    hasPremiumAccess,
    getMembershipInfo,
    updateAuthUI,
    API_URL
};
