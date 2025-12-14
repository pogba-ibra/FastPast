const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please tell us your name!'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    membershipType: {
        type: String,
        enum: ['free', 'monthly', 'semi-yearly', 'yearly', 'lifetime', 'creator', 'studio'],
        default: 'free',
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
    },
    subscriptionEndDate: {
        type: Date,
        default: null,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: {
        type: String,
        select: false,
    },
    emailVerificationExpires: {
        type: Date,
        select: false,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    dailyDownloadCount: {
        type: Number,
        default: 0,
    },
    lastDownloadReset: {
        type: Date,
        default: Date.now,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has premium access
userSchema.methods.hasPremiumAccess = function () {
    if (['lifetime', 'creator', 'studio', 'monthly', 'yearly', 'semi-yearly'].includes(this.membershipType)) {
        // Check if subscription is active and not expired for non-lifetime
        if (this.membershipType === 'lifetime') return true;

        if (this.subscriptionStatus === 'active' && this.subscriptionEndDate) {
            return new Date() < this.subscriptionEndDate;
        }
    }
    return false;
};

// Method to check if user has studio access
userSchema.methods.hasStudioAccess = function () {
    if (['lifetime', 'studio'].includes(this.membershipType)) {
        if (this.membershipType === 'lifetime') return true;

        if (this.subscriptionStatus === 'active' && this.subscriptionEndDate) {
            return new Date() < this.subscriptionEndDate;
        }
    }
    return false;
};

// Method to get download limit based on membership
userSchema.methods.getDownloadLimit = function () {
    if (this.hasPremiumAccess()) {
        return Infinity; // Unlimited for premium users
    }
    return 2; // 2 downloads per day for free users
};

// Method to check if download is allowed
userSchema.methods.canDownload = function () {
    // Reset daily count if it's a new day
    const now = new Date();
    const lastReset = new Date(this.lastDownloadReset);

    if (now.getDate() !== lastReset.getDate() ||
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear()) {
        this.dailyDownloadCount = 0;
        this.lastDownloadReset = now;
    }

    return this.dailyDownloadCount < this.getDownloadLimit();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
