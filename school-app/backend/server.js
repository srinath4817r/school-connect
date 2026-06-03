require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/database');

const app = express();

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const adminRoutes = require('./routes/admin');
const diaryRoutes = require('./routes/diary');
const attendanceRoutes = require('./routes/attendance');
const markRoutes = require('./routes/marks');
const feeRoutes = require('./routes/fees');
const timetableRoutes = require('./routes/timetable');
const notificationRoutes = require('./routes/notifications');
const scheduleRoutes = require('./routes/schedules');
const calendarRoutes = require('./routes/calendar');

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/diaries', diaryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/calendar', calendarRoutes);

// Basic Test Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'School Connect API is running correctly',
    timestamp: new Date()
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;

const SecretCode = require('./models/SecretCode');

// Connect Database and Start Server
const startServer = async () => {
  // Try connecting to DB
  await connectDB();

  // Drop old attendance index if it exists, to allow shift-based unique constraint
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    await db.collection('attendances').dropIndex('student_1_date_1');
    console.log('Successfully dropped old student_1_date_1 index.');
  } catch (indexError) {
    // Index might not exist, which is fine
  }
  
  // Auto-seed default secret codes if they don't exist
  try {
    // Check if legacy data exists (has codeHash instead of code)
    const legacyCode = await SecretCode.findOne({ codeHash: { $exists: true } });
    if (legacyCode) {
      console.log('Legacy secret codes detected (using codeHash). Resetting collection...');
      await SecretCode.deleteMany({});
    }

    // Ensure only super_admin and school_admin codes are present, and they match the new codes
    const expectedCodes = [
      { role: 'super_admin', code: 'SUPER@ADMIN#2024' },
      { role: 'school_admin', code: 'SCHOOL@ADMIN#2024' }
    ];

    // Remove any secret codes for roles that are not super_admin or school_admin
    await SecretCode.deleteMany({ role: { $nin: ['super_admin', 'school_admin'] } });

    for (const item of expectedCodes) {
      await SecretCode.findOneAndUpdate(
        { role: item.role },
        { code: item.code },
        { upsert: true, new: true }
      );
    }
    console.log('Global secret codes configured successfully.');

    // Auto-seed default school and classes if no schools exist
    const School = require('./models/School');
    const Class = require('./models/Class');
    const schoolCount = await School.countDocuments();
    if (schoolCount === 0) {
      console.log('No schools found in database. Initializing default school and classes...');
      const defaultSchool = new School({
        name: 'Greenwood High School',
        address: '123 School Lane, Hyderabad',
        phone: '9876543210',
        isActive: true
      });
      await defaultSchool.save();
      console.log(`Auto-seeded default school: ${defaultSchool.name}`);

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
        console.log(`Auto-seeded class: ${cls.name}`);
      }
    }
  } catch (error) {
    console.error(`Auto-seeding failed: ${error.message}`);
  }
  
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
