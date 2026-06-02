const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  recipientRole: {
    type: String,
    enum: ['all', 'teacher', 'parent', 'driver', 'staff'],
    required: false
  },
  type: {
    type: String,
    enum: ['retake_attendance', 'update_details', 'general'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    },
    section: String,
    date: Date,
    shift: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
