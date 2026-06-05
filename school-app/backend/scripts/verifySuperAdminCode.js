const mongoose = require('mongoose');
const SecretCode = require('../models/SecretCode');
const connectDB = require('../config/database');
require('dotenv').config();

const verifyCode = async () => {
  try {
    await connectDB();

    const record = await SecretCode.findOne({ role: 'super_admin' });
    
    if (!record) {
      console.log('Error: super_admin secret code record not found in database.');
      process.exit(1);
    }

    console.log('\n==========================================');
    console.log('DATABASE RECORD FOUND:');
    console.log(`ID: ${record._id}`);
    console.log(`Role: ${record.role}`);
    console.log(`Value in DB: ${record.code}`);
    console.log('==========================================');

    // Test new code comparison
    const isNewCodeMatch = await record.compareCode('SUPERMANFORSCHOOL@48');
    console.log(`Testing new code "SUPERMANFORSCHOOL@48": ${isNewCodeMatch ? 'SUCCESS MATCHES (SUCCESS)' : 'FAILED DOES NOT MATCH (FAILED)'}`);

    // Test old code comparison
    const isOldCodeMatch = await record.compareCode('SUPER@ADMIN#2024');
    console.log(`Testing old code "SUPER@ADMIN#2024": ${isOldCodeMatch ? 'FAILED MATCHES (FAILED)' : 'SUCCESS DOES NOT MATCH (SUCCESS)'}`);
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`Verification failed: ${error.message}`);
    process.exit(1);
  }
};

verifyCode();
