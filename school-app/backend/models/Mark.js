const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema({
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
  subject: {
    type: String,
    required: true,
    trim: true
  },
  examName: {
    type: String,
    required: true,
    trim: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 1
  },
  grade: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Pre-save hook to calculate letter grade based on marks percentage
MarkSchema.pre('validate', function(next) {
  if (this.marksObtained !== undefined && this.totalMarks !== undefined) {
    const percentage = (this.marksObtained / this.totalMarks) * 100;
    if (percentage >= 90) this.grade = 'A+';
    else if (percentage >= 80) this.grade = 'A';
    else if (percentage >= 70) this.grade = 'B';
    else if (percentage >= 60) this.grade = 'C';
    else if (percentage >= 50) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

module.exports = mongoose.model('Mark', MarkSchema);
