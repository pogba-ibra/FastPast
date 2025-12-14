const crypto = require('crypto');

// Mock email service - logs to console instead of sending real emails
class EmailService {
    sendVerificationEmail(user, token) {
        const verificationUrl = `http://localhost:3002/auth/verify-email/${token}`;

        console.log('\n========================================');
        console.log('📧 EMAIL VERIFICATION');
        console.log('========================================');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Verify your FastPast account`);
        console.log('');
        console.log(`Hi ${user.username},`);
        console.log('');
        console.log('Thank you for registering with FastPast!');
        console.log('');
        console.log('Please verify your email address by clicking the link below:');
        console.log(verificationUrl);
        console.log('');
        console.log('This link will expire in 24 hours.');
        console.log('');
        console.log('If you didn\'t create this account, please ignore this email.');
        console.log('========================================\n');

        return { success: true, verificationUrl };
    }

    sendWelcomeEmail(user) {
        console.log('\n========================================');
        console.log('🎉 WELCOME EMAIL');
        console.log('========================================');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Welcome to FastPast!`);
        console.log('');
        console.log(`Hi ${user.username},`);
        console.log('');
        console.log('Welcome to FastPast - your premium video downloader!');
        console.log('');
        console.log(`Your membership: ${user.membershipType.toUpperCase()}`);
        console.log('');
        if (user.membershipType === 'free') {
            console.log('You have 2 downloads per day.');
            console.log('Upgrade to premium for unlimited downloads!');
        } else if (user.membershipType === 'lifetime') {
            console.log('Enjoy unlimited downloads for life! 🎊');
        } else {
            console.log('Enjoy unlimited downloads! 🚀');
            if (user.subscriptionEndDate) {
                console.log(`Your subscription expires: ${user.subscriptionEndDate.toDateString()}`);
            }
        }
        console.log('');
        console.log('Start downloading videos now at http://localhost:3002');
        console.log('========================================\n');

        return { success: true };
    }

    sendPasswordResetEmail(user, token) {
        const resetUrl = `http://localhost:3002/auth/reset-password/${token}`;

        console.log('\n========================================');
        console.log('🔑 PASSWORD RESET');
        console.log('========================================');
        console.log(`To: ${user.email}`);
        console.log(`Subject: Reset your FastPast password`);
        console.log('');
        console.log(`Hi ${user.username},`);
        console.log('');
        console.log('You requested to reset your password.');
        console.log('');
        console.log('Click the link below to reset it:');
        console.log(resetUrl);
        console.log('');
        console.log('This link will expire in 1 hour.');
        console.log('');
        console.log('If you didn\'t request this, please ignore this email.');
        console.log('========================================\n');

        return { success: true, resetUrl };
    }
}

// Generate random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = new EmailService();
module.exports.generateToken = generateToken;
