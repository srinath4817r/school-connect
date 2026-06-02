const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
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
  sections: [{
    type: String,
    default: 'A'
  }]
}, { timestamps: true });

// Ensure unique class names within the same school
ClassSchema.index({ school: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Class', ClassSchema);
