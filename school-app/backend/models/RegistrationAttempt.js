const mongoose = require('mongoose');

const RegistrationAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  attempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, { timestamps: true });

// Check if blocked
RegistrationAttemptSchema.methods.isBlocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('RegistrationAttempt', RegistrationAttemptSchema);
