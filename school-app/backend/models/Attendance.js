const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    required: true
  },
  shift: {
    type: String,
    enum: ['Morning', 'Afternoon'],
    default: 'Morning',
    required: true
  },
  date: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Ensure unique attendance per student per shift per day (ignoring hours/minutes/seconds)
AttendanceSchema.index({ student: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
