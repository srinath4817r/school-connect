const mongoose = require('mongoose');

const DiarySchema = new mongoose.Schema({
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
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  homework: [{
    subject: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    // Store IDs of parents who marked this subject's homework as completed/done
    completedByParents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  classwork: {
    type: String,
    required: true
  },
  reminders: {
    type: String,
    required: true
  },
  notice: {
    type: String,
    required: true
  },
  teacherNote: {
    type: String
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  postedAt: {
    type: Date,
    default: Date.now
  },
  lastEditedAt: {
    type: Date
  },
  // Store parent views with read timestamp and markedAsRead status
  parentViews: [{
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    markedAsRead: {
      type: Boolean,
      default: false
    }
  }]
}, { timestamps: true });

// Index for query efficiency and cleanup
DiarySchema.index({ createdAt: 1 });
DiarySchema.index({ school: 1, class: 1, section: 1, createdAt: -1 });

module.exports = mongoose.model('Diary', DiarySchema);
