const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sessionToken: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // MongoDB will automatically delete expired sessions
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
}, {
    timestamps: true
});

// Index for faster lookups
// sessionSchema.index({ sessionToken: 1 }); // duplicate: handled by unique: true
sessionSchema.index({ userId: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
