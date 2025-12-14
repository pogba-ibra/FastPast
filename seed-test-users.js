const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/video-downloader')
    .then(() => console.log('DB connection successful!'))
    .catch(err => {
        console.error('DB connection error:', err);
        process.exit(1);
    });

// Test users data
const testUsers = [
    {
        username: 'free_user',
        email: 'free@test.com',
        password: 'Test1234!',
        membershipType: 'free',
        isEmailVerified: true,
        subscriptionStatus: 'active'
    },
    {
        username: 'monthly_user',
        email: 'monthly@test.com',
        password: 'Test1234!',
        membershipType: 'monthly',
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isEmailVerified: true,
        subscriptionStatus: 'active'
    },
    {
        username: 'semi_yearly_user',
        email: 'semiyearly@test.com',
        password: 'Test1234!',
        membershipType: 'semi-yearly',
        subscriptionEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        isEmailVerified: true,
        subscriptionStatus: 'active'
    },
    {
        username: 'yearly_user',
        email: 'yearly@test.com',
        password: 'Test1234!',
        membershipType: 'yearly',
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isEmailVerified: true,
        subscriptionStatus: 'active'
    },
    {
        username: 'lifetime_user',
        email: 'lifetime@test.com',
        password: 'Test1234!',
        membershipType: 'lifetime',
        isEmailVerified: true,
        subscriptionStatus: 'active'
    },
    {
        username: 'expired_user',
        email: 'expired@test.com',
        password: 'Test1234!',
        membershipType: 'monthly',
        subscriptionEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
        isEmailVerified: true,
        subscriptionStatus: 'expired'
    }
];

async function seedUsers() {
    try {
        console.log('🌱 Seeding test users...\n');

        // Clear existing test users
        await User.deleteMany({ email: { $regex: /@test\.com$/ } });
        console.log('✅ Cleared existing test users\n');

        // Hash passwords and create users
        for (const userData of testUsers) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const user = await User.create({
                ...userData,
                password: hashedPassword
            });

            console.log(`✅ Created user: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${userData.password}`);
            console.log(`   Membership: ${user.membershipType}`);
            if (user.subscriptionEndDate) {
                console.log(`   Expires: ${user.subscriptionEndDate.toDateString()}`);
            }
            console.log('');
        }

        console.log('═══════════════════════════════════════════════════');
        console.log('🎉 Test users created successfully!');
        console.log('═══════════════════════════════════════════════════');
        console.log('\n📝 Test Account Credentials:');
        console.log('─────────────────────────────────────────────────');
        testUsers.forEach(user => {
            console.log(`${user.username.padEnd(20)} | ${user.email.padEnd(25)} | Test1234!`);
        });
        console.log('─────────────────────────────────────────────────');
        console.log('\n💡 Use these credentials to login and test different membership levels');
        console.log('🔗 Login at: http://localhost:3002/login.html\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

// Run the seeder
seedUsers();
