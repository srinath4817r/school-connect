const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({
  parent: {
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
  startDate: {
    type: String, // Keep as String (YYYY-MM-DD) like the frontend date inputs
    required: true
  },
  endDate: {
    type: String, // Keep as String (YYYY-MM-DD)
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Casual Leave', 'Personal Leave', 'Other'],
    default: 'Sick Leave',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    required: true
  },
  appliedOn: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);
