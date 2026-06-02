const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
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
    required: true,
    default: 'A'
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  periods: [{
    periodNumber: {
      type: Number,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    teacherName: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

// Ensure unique timetable per class, section, and day within a school
TimetableSchema.index({ school: 1, class: 1, section: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', TimetableSchema);
