const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['teacher', 'parent'],
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  text: {
    type: String,
    required: true
  },
  linkToTab: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // 7 days in seconds (TTL Index)
  }
}, { timestamps: true });

// Ensure we index parent and teacher fields for fast querying
MessageSchema.index({ parent: 1, teacher: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
