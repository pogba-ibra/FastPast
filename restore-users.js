/* eslint-disable */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');

// Configuration
const JSON_FILE = path.join(__dirname, 'json-data', 'users.json');
const MONGO_URI = 'mongodb://localhost:27017/video-downloader';
const DEFAULT_PASSWORD = 'Test1234!';

const testUsers = [
    {
        username: 'free_user',
        email: 'free@test.com',
        membershipType: 'free',
        subscriptionStatus: 'active'
    },

    {
        username: 'lifetime_user',
        email: 'lifetime@test.com',
        membershipType: 'lifetime',
        subscriptionStatus: 'active'
    },
    {
        username: 'studio_user',
        email: 'studio@test.com',
        membershipType: 'studio',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionStatus: 'active'
    },
    {
        username: 'creator_user',
        email: 'creator@test.com',
        membershipType: 'creator',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionStatus: 'active'
    }
];

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function restoreJsonUsers() {
    console.log('📂 Restoring JSON users...');

    // Ensure directory exists
    const dir = path.dirname(JSON_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Read existing or init new
    let existingUsers = [];
    if (fs.existsSync(JSON_FILE)) {
        try {
            existingUsers = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        } catch (e) {
            existingUsers = [];
        }
    }

    // Filter out the test users we are about to re-add AND the monthly user we want to delete
    const emailsToRemove = [...testUsers.map(u => u.email), 'monthly@test.com'];
    existingUsers = existingUsers.filter(u => !emailsToRemove.includes(u.email));

    // Create new user objects
    for (const u of testUsers) {
        existingUsers.push({
            id: crypto.randomBytes(16).toString('hex'),
            username: u.username,
            email: u.email,
            password: await hashPassword(DEFAULT_PASSWORD),
            membershipType: u.membershipType,
            subscriptionStatus: u.subscriptionStatus,
            subscriptionEndDate: u.subscriptionEndDate ? u.subscriptionEndDate.toISOString() : null,
            isEmailVerified: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            dailyDownloadCount: 0,
            lastDownloadReset: new Date().toISOString()
        });
    }

    fs.writeFileSync(JSON_FILE, JSON.stringify(existingUsers, null, 2));
    console.log('✅ JSON users updated successfully.');
}

async function restoreMongoUsers() {
    console.log('🍃 Restoring MongoDB users...');
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('   Connected to MongoDB.');

        for (const u of testUsers) {
            // Delete existing
            await User.deleteOne({ email: u.email });

            // Create new
            const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
            await User.create({
                ...u,
                password: hashedPassword,
                isEmailVerified: true
            });
            console.log(`   Restored ${u.email} in MongoDB.`);
        }
        console.log('✅ MongoDB users updated successfully.');
        await mongoose.disconnect();
    } catch (err) {
        console.log('⚠️  MongoDB restoration skipped/failed (Service might be down):', err.message);
    }
}

async function main() {
    await restoreJsonUsers();
    await restoreMongoUsers();
    console.log('\n✨ All test accounts verified and restored.');
    console.log(`🔑 Password for all accounts: ${DEFAULT_PASSWORD}`);
    console.log('   (You can use studio@test.com too!)');
}

main();
