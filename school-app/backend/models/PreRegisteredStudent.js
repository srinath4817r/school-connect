const mongoose = require('mongoose');

const PreRegisteredStudentSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  admissionNumber: {
    type: String,
    required: false,
    trim: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  bloodGroup: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  previousSchool: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Ensure unique admission numbers within the same school
PreRegisteredStudentSchema.index({ school: 1, admissionNumber: 1 }, { unique: true });

module.exports = mongoose.model('PreRegisteredStudent', PreRegisteredStudentSchema);
