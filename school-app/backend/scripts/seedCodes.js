const mongoose = require('mongoose');
const SecretCode = require('../models/SecretCode');
const connectDB = require('../config/database');
require('dotenv').config();

const defaultCodes = [
  { role: 'super_admin', code: 'SUPER@ADMIN#2024' },
  { role: 'school_admin', code: 'SCHOOL@ADMIN#2024' }
];

const seedSecretCodes = async () => {
  try {
    // Connect to database using the connection utility with memory fallback
    await connectDB();

    for (const item of defaultCodes) {
      const existing = await SecretCode.findOne({ role: item.role });
      if (!existing) {
        // Create new
        const newCode = new SecretCode({
          role: item.role,
          code: item.code
        });
        await newCode.save();
        console.log(`Seeded secret code for role: ${item.role}`);
      } else {
        console.log(`Secret code for role ${item.role} already exists, skipping.`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedSecretCodes();
