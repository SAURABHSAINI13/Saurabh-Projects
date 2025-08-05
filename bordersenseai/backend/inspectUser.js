// inspectUser.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js'; // adjust if path differs

dotenv.config();

const checkEnv = () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }
  if (!process.env.NODE_ENV) {
    console.warn('⚠️ NODE_ENV not set (this is okay for dev)');
  }
};

const run = async () => {
  try {
    checkEnv();
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'bordersenseai' });
    console.log('✅ Connected to DB');

    const username = 'officer1';
    const user = await User.findOne({ username }).lean();

    if (!user) {
      console.log(`❗ User "${username}" not found.`);
    } else {
      console.log('📦 User document:');
      console.dir(
        {
          username: user.username,
          roles: user.roles,
          passwordHash: user.password,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        { depth: null }
      );

      // Optionally: verify that "pass123" matches the stored hash (purely for debug)
      const match = await bcrypt.compare('pass123', user.password);
      console.log(`🔍 Does "pass123" match stored password?`, match);
    }

    // If you want to delete the user to re-register, uncomment below:
    // await User.deleteOne({ username: 'officer1' });
    // console.log('🗑️ Deleted user officer1 (you can now re-register fresh).');

  } catch (err) {
    console.error('🔥 Error during inspection:', err);
  } finally {
    await mongoose.disconnect();
    console.log('⏹️ Disconnected. Exiting.');
    process.exit(0);
  }
};

run();
