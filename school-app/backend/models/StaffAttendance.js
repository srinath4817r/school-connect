const mongoose = require('mongoose');

const StaffAttendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  date: {
    type: String, // Store in YYYY-MM-DD format for unique index checks
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  wifiSSID: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present'
  }
}, { timestamps: true });

// Unique daily check-in index per staff member
StaffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendance', StaffAttendanceSchema);
