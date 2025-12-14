// Quick script to clear Creator user sessions
const mongoose = require('mongoose');
require('dotenv').config();

const Session = require('./models/Session');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fastpast')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all sessions for creator@test.com user
    const User = require('./models/User');
    const creatorUser = await User.findOne({ email: 'creator@test.com' });
    
    if (!creatorUser) {
      console.log('Creator user not found');
      process.exit(0);
    }
    
    console.log('Found creator user:', creatorUser.email);
    
    // Delete all sessions for this user
    const result = await Session.deleteMany({ userId: creatorUser._id });
    console.log(`Deleted ${result.deletedCount} session(s)`);
    
    console.log('Done! You can now login with creator@test.com');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
