// Check if sessions exist for creator user
const mongoose = require('mongoose');
require('dotenv').config();

const Session = require('./models/Session');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fastpast')
    .then(async () => {
        console.log('✓ Connected to MongoDB');

        // Find creator user
        const creatorUser = await User.findOne({ email: 'creator@test.com' });

        if (!creatorUser) {
            console.log('❌ Creator user not found in database');
            process.exit(1);
        }

        console.log('✓ Found creator user:', creatorUser.email);
        console.log('  User ID:', creatorUser._id);
        console.log('  Membership:', creatorUser.membershipType);

        // Check for sessions
        const sessions = await Session.find({ userId: creatorUser._id });
        console.log(`\n📊 Active sessions: ${sessions.length}`);

        if (sessions.length > 0) {
            console.log('\nSession details:');
            sessions.forEach((session, i) => {
                console.log(`  Session ${i + 1}:`);
                console.log(`    Token: ${session.sessionToken.substring(0, 20)}...`);
                console.log(`    Expires: ${session.expiresAt}`);
                console.log(`    IP: ${session.ipAddress}`);
                console.log(`    Is Expired: ${new Date() > session.expiresAt ? 'YES' : 'NO'}`);
            });

            // Delete them
            console.log('\n🗑️  Deleting all sessions...');
            const result = await Session.deleteMany({ userId: creatorUser._id });
            console.log(`✓ Deleted ${result.deletedCount} session(s)`);
        } else {
            console.log('✓ No sessions found - account is clear');
        }

        console.log('\n✅ Done! You can now login with creator@test.com');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
