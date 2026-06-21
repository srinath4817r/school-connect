const mongoose = require('mongoose');
const connectDB = require('../config/database');
require('dotenv').config();

const User = require('../models/User');
const PreRegisteredStudent = require('../models/PreRegisteredStudent');

const runDiagnostics = async () => {
  try {
    await connectDB();
    console.log('Connected to database...');

    const parents = await User.find({ role: 'parent' }).select('_id fullName email classAssigned sectionAssigned');
    const teachers = await User.find({ role: 'teacher' }).select('_id fullName email classAssigned sectionAssigned');
    const preStudents = await PreRegisteredStudent.find({});

    console.log('\n--- PARENTS IN SYSTEM ---');
    parents.forEach(p => {
      console.log(`Parent ID: ${p._id} | Name: ${p.fullName} | Email: ${p.email} | Class: ${p.classAssigned} | Section: ${p.sectionAssigned}`);
    });

    console.log('\n--- TEACHERS IN SYSTEM ---');
    teachers.forEach(t => {
      console.log(`Teacher ID: ${t._id} | Name: ${t.fullName} | Email: ${t.email} | Class: ${t.classAssigned} | Section: ${t.sectionAssigned}`);
    });

    console.log('\n--- PRE-REGISTERED STUDENTS ---');
    preStudents.forEach(s => {
      console.log(`Student Name: ${s.name} | Admission: ${s.admissionNumber} | Class: ${s.className} | Section: ${s.section} | Parent Pointer: ${s.parent}`);
    });

    console.log('\n=========================');
    process.exit(0);
  } catch (error) {
    console.error('Error running diagnostics:', error);
    process.exit(1);
  }
};

runDiagnostics();
