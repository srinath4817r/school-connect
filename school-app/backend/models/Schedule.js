const mongoose = require('mongoose');

const PeriodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true
  }
});

const ScheduleSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  validFrom: {
    type: Date,
    required: function() { return !this.isPermanent; }
  },
  validTo: {
    type: Date,
    required: function() { return !this.isPermanent; }
  },
  isPermanent: {
    type: Boolean,
    default: false
  },
  schedule: {
    monday: { type: [PeriodSchema], default: [] },
    tuesday: { type: [PeriodSchema], default: [] },
    wednesday: { type: [PeriodSchema], default: [] },
    thursday: { type: [PeriodSchema], default: [] },
    friday: { type: [PeriodSchema], default: [] },
    saturday: { type: [PeriodSchema], default: [] },
    sunday: { type: [PeriodSchema], default: [] }
  }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);
