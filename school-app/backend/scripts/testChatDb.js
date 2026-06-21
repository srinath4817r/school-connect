const mongoose = require('mongoose');
const connectDB = require('../config/database');
require('dotenv').config();

const Message = require('../models/Message');
const User = require('../models/User');

const runTest = async () => {
  try {
    await connectDB();
    console.log('Connected to database...');

    const parentId = '6a170658ceaab7173ac51684';
    const teacherId = '6a16fd71a5af63dc71e3c18c';

    // 1. Clear any existing messages between this parent and teacher
    await Message.deleteMany({ parent: parentId, teacher: teacherId });
    console.log('Cleared existing test messages.');

    // 2. Parent sends a message to Teacher
    const msgFromParent = new Message({
      sender: 'parent',
      parent: parentId,
      teacher: teacherId,
      text: "Hello teacher, I would like to inquire about my child's progress."
    });
    await msgFromParent.save();
    console.log('Saved message from parent.');

    // 3. Teacher sends a message to Parent
    const msgFromTeacher = new Message({
      sender: 'teacher',
      parent: parentId,
      teacher: teacherId,
      text: "Academic Progress Report for parent:\nEnglish: 10/100\nMathematics: 2/100",
      linkToTab: 'marks'
    });
    await msgFromTeacher.save();
    console.log('Saved message from teacher.');

    // 4. Retrieve messages and assert
    const messages = await Message.find({
      parent: parentId,
      teacher: teacherId
    }).sort({ createdAt: 1 });

    console.log(`\n--- RETRIEVED ${messages.length} MESSAGES ---`);
    messages.forEach(m => {
      console.log(`[${m.sender.toUpperCase()}] ${m.text} | linkToTab: ${m.linkToTab || 'none'} | timestamp: ${m.createdAt}`);
    });

    if (messages.length === 2 && 
        messages[0].sender === 'parent' && 
        messages[1].sender === 'teacher' && 
        messages[1].linkToTab === 'marks') {
      console.log('\nSUCCESS: Database-backed message sync and retrieval works perfectly!');
      process.exit(0);
    } else {
      console.error('\nFAILURE: Message sync verification failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
};

runTest();
