const mongoose = require('mongoose');
const connectDB = require('../config/database');
require('dotenv').config();

// Load models
const User = require('../models/User');
const School = require('../models/School');
const Class = require('../models/Class');
const Diary = require('../models/Diary');
const Fee = require('../models/Fee');
const RegistrationAttempt = require('../models/RegistrationAttempt');
const SecretCode = require('../models/SecretCode');

const defaultCodes = [
  { role: 'super_admin', code: 'SUPERMANFORSCHOOL@48' },
  { role: 'school_admin', code: 'SCHOOL@ADMIN#2024' },
  { role: 'principal', code: 'PRINCIPAL#2024' },
  { role: 'teacher', code: 'TEACH@CLASS#2024' },
  { role: 'parent', code: 'PARENT@CHILD#2024' },
  { role: 'driver', code: 'DRIVER@SAFE#2024' }
];

const clearAndResetDatabase = async () => {
  try {
    await connectDB();
    console.log('Successfully connected to database for reset...');

    // 1. Clear tables
    console.log('Clearing users...');
    await User.deleteMany({});
    
    console.log('Clearing schools...');
    await School.deleteMany({});
    
    console.log('Clearing classes...');
    await Class.deleteMany({});
    
    console.log('Clearing diaries...');
    await Diary.deleteMany({});
    
    console.log('Clearing fees...');
    await Fee.deleteMany({});
    
    console.log('Clearing registration attempts...');
    await RegistrationAttempt.deleteMany({});

    console.log('Clearing secret codes...');
    await SecretCode.deleteMany({});

    // 2. Seed codes
    console.log('Seeding fresh secret codes...');
    for (const item of defaultCodes) {
      const newCode = new SecretCode(item);
      await newCode.save();
      console.log(`Seeded secret code for role: ${item.role}`);
    }

    // 3. Seed default school and classes
    console.log('Seeding default school and classes...');
    const defaultSchool = new School({
      name: 'Greenwood High School',
      address: '123 School Lane, Bangalore',
      phone: '9876543210',
      isActive: true
    });
    await defaultSchool.save();
    console.log(`Seeded default school: ${defaultSchool.name}`);

    const classesToSeed = [
      { name: 'Class 8', sections: ['A', 'B'] },
      { name: 'Class 9', sections: ['A', 'B'] },
      { name: 'Class 10', sections: ['A', 'B'] }
    ];

    for (const cls of classesToSeed) {
      const newClass = new Class({
        school: defaultSchool._id,
        name: cls.name,
        sections: cls.sections
      });
      await newClass.save();
      console.log(`Seeded class: ${cls.name}`);
    }

    console.log('==========================================');
    console.log('DATABASE RESET & SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==========================================');
    process.exit(0);
  } catch (error) {
    console.error(`Database clear failed: ${error.message}`);
    process.exit(1);
  }
};

clearAndResetDatabase();
