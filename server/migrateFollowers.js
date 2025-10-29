import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const migrateFollowers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Starting migration...');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Migrate followers
      if (user.followers && user.followers.length > 0) {
        const hasOldFormat = user.followers.some(f => typeof f === 'string');
        
        if (hasOldFormat) {
          user.followers = user.followers.map(f => {
            if (typeof f === 'string') {
              return { userId: f, followedAt: new Date() };
            }
            return f;
          });
          needsUpdate = true;
        }
      }

      // Migrate following
      if (user.following && user.following.length > 0) {
        const hasOldFormat = user.following.some(f => typeof f === 'string');
        
        if (hasOldFormat) {
          user.following = user.following.map(f => {
            if (typeof f === 'string') {
              return { userId: f, followedAt: new Date() };
            }
            return f;
          });
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await user.save();
        migratedCount++;
        console.log(`Migrated user: ${user.fullName} (${user._id})`);
      }
    }

    console.log(`\n✅ Migration complete! Migrated ${migratedCount} users.`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateFollowers();
