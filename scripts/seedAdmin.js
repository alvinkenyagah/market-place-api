require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@marketplace.com' });
    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    await User.create({
      name: 'Admin',
      email: 'admin@marketplace.com',
      password: 'Admin@1234',
      role: 'admin',
    });

    console.log('Admin user created: admin@marketplace.com / Admin@1234');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();
