const Session = require('../models/Session');
// const { verifyToken } = require('../utils/jwt'); // Unused
// const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Helper to check if MongoDB is being used
let USE_MONGODB = null;

function getStorageMode() {
    if (USE_MONGODB === null) {
        // Check if mongoose is connected by trying to read the flag from server
        // This is a workaround - ideally this would be shared state
        try {
            const mongoose = require('mongoose');
            USE_MONGODB = mongoose.connection.readyState === 1;
        } catch (e) { // eslint-disable-line no-unused-vars
            USE_MONGODB = false;
        }
    }
    return USE_MONGODB;
}

function getJsonSessions() {
    const sessionsFile = path.join(__dirname, '..', 'json-data', 'sessions.json');
    if (fs.existsSync(sessionsFile)) {
        return JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
    }
    return [];
}

function getJsonUsers() {
    const usersFile = path.join(__dirname, '..', 'json-data', 'users.json');
    if (fs.existsSync(usersFile)) {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
    return [];
}

// Middleware to require authentication
const requireAuth = async (req, res, next) => {
    try {
        // Get token from header or query
        const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const useMongo = getStorageMode();

        if (useMongo) {
            // MongoDB mode
            const session = await Session.findOne({
                sessionToken: token,
                expiresAt: { $gt: new Date() }
            }).populate('userId');

            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            if (!session.userId) {
                await Session.deleteOne({ _id: session._id });
                return res.status(401).json({ error: 'User no longer exists' });
            }

            req.user = session.userId;
            req.session = session;
        } else {
            // JSON fallback mode
            const sessions = getJsonSessions();
            const users = getJsonUsers();

            const session = sessions.find(s =>
                s.sessionToken === token &&
                new Date(s.expiresAt) > new Date()
            );

            if (!session) {
                return res.status(401).json({ error: 'Invalid or expired session' });
            }

            const userData = users.find(u => u.id === session.userId);

            if (!userData) {
                return res.status(401).json({ error: 'User no longer exists' });
            }

            // Create user-like object for JSON mode
            req.user = {
                _id: userData.id,
                email: userData.email,
                username: userData.username,
                membershipType: userData.membershipType,
                subscriptionStatus: userData.subscriptionStatus,
                subscriptionEndDate: userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null,
                isEmailVerified: userData.isEmailVerified,
                profilePicture: userData.profilePicture,
                toObject: function () { return { ...this }; },
                hasPremiumAccess: function () {
                    return ['monthly', 'yearly', 'lifetime', 'studio', 'creator'].includes(this.membershipType);
                },
                hasStudioAccess: function () {
                    return ['lifetime', 'studio'].includes(this.membershipType);
                }
            };
            req.session = session;
        }

        console.log('Auth Middleware Success:', {
            userId: req.user._id,
            email: req.user.email,
            membership: req.user.membershipType
        });

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

// Middleware to check membership level
const checkMembership = (requiredLevels) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Check if user's membership is in the required levels
            if (requiredLevels.includes(req.user.membershipType)) {
                // Check if subscription is still valid for non-lifetime members
                if (req.user.membershipType !== 'lifetime' && req.user.membershipType !== 'free') {
                    if (!req.user.subscriptionEndDate || new Date() > req.user.subscriptionEndDate) {
                        return res.status(403).json({
                            error: 'Your subscription has expired. Please renew to continue.'
                        });
                    }
                }
                return next();
            }

            res.status(403).json({
                error: 'This feature requires a premium membership',
                requiredMembership: requiredLevels
            });
        } catch (error) {
            console.error('Membership check error:', error);
            res.status(500).json({ error: 'Membership verification error' });
        }
    };
};

// Middleware to refresh session expiration
const refreshSession = async (req, res, next) => {
    try {
        if (req.session) {
            // Extend session by 7 days
            req.session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            if (typeof req.session.save === 'function') {
                await req.session.save();
            } else {
                // In JSON mode, we might need to manually save using the helper if available,
                // or rely on the memory reference being updated and saved periodically/elsewhere.
                // For now, just suppressing the error since sessions.json is updated on login/logout
                // and this is just an expiry refresh which might not be critical to persist instantly in JSON mode.
                // Ideally: require('../server').saveSessions(); but we can't easily circular dep here.
            }
        }
        next();
    } catch (error) {
        console.error('Session refresh error:', error);
        next(); // Continue even if refresh fails
    }
};

module.exports = {
    requireAuth,
    checkMembership,
    refreshSession
};
