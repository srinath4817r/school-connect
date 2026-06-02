const mongoose = require('mongoose');
const SecretCode = require('../models/SecretCode');
const connectDB = require('../config/database');
require('dotenv').config();

const updateSuperAdminCode = async () => {
  try {
    // Connect to database
    await connectDB();

    const newCode = 'SUPERMANFORSCHOOL@48';
    
    // Find super_admin code
    let codeRecord = await SecretCode.findOne({ role: 'super_admin' });
    
    if (codeRecord) {
      codeRecord.code = newCode;
      await codeRecord.save();
      console.log(`Successfully updated super_admin secret code to: "${newCode}"`);
    } else {
      codeRecord = new SecretCode({
        role: 'super_admin',
        code: newCode
      });
      await codeRecord.save();
      console.log(`Created and seeded new super_admin secret code: "${newCode}"`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Failed to update super_admin code: ${error.message}`);
    process.exit(1);
  }
};

updateSuperAdminCode();
