// const User = require('../models/User'); // Unused

// Middleware to require premium membership
const requirePremium = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.hasPremiumAccess()) {
            return next();
        }

        res.status(403).json({
            error: 'This feature requires a premium membership. Upgrade to Monthly, Yearly, or Lifetime to access unlimited downloads.',
            currentMembership: req.user.membershipType
        });
    } catch (error) {
        console.error('Premium check error:', error);
        res.status(500).json({ error: 'Membership verification error' });
    }
};

// Middleware to require lifetime membership
const requireLifetime = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.membershipType === 'lifetime') {
            return next();
        }

        res.status(403).json({
            error: 'This feature is exclusive to Lifetime members',
            currentMembership: req.user.membershipType
        });
    } catch (error) {
        console.error('Lifetime check error:', error);
        res.status(500).json({ error: 'Membership verification error' });
    }
};

// Middleware to check download limits
const checkDownloadLimit = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user can download
        if (!req.user.canDownload()) {
            const limit = req.user.getDownloadLimit();
            return res.status(429).json({
                error: `Daily download limit reached (${limit} downloads per day for free users). Upgrade to premium for unlimited downloads.`,
                dailyLimit: limit,
                currentCount: req.user.dailyDownloadCount,
                membershipType: req.user.membershipType
            });
        }

        // Increment download count
        req.user.dailyDownloadCount += 1;
        await req.user.save();

        next();
    } catch (error) {
        console.error('Download limit check error:', error);
        res.status(500).json({ error: 'Download limit verification error' });
    }
};

// Middleware to require studio membership
const requireStudio = async (req, res, next) => {
    try {
        console.log('RequireStudio Check:', {
            hasUser: !!req.user,
            membership: req.user?.membershipType
        });

        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.hasStudioAccess()) {
            return next();
        }

        res.status(403).json({
            error: 'This feature is exclusive to Studio and Lifetime members. Upgrade to access unlimited playlist downloads.',
            currentMembership: req.user.membershipType
        });
    } catch (error) {
        console.error('Studio check error:', error);
        res.status(500).json({ error: 'Membership verification error' });
    }
};

module.exports = {
    requirePremium,
    requireLifetime,
    requireStudio,
    checkDownloadLimit
};
