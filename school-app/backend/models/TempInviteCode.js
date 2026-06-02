const mongoose = require('mongoose');

const TempInviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'principal', 'teacher', 'parent', 'driver'],
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  }
}, { timestamps: true });

// Check if expired
TempInviteCodeSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false; // Permanent codes do not expire
  return Date.now() > this.expiresAt;
};

module.exports = mongoose.model('TempInviteCode', TempInviteCodeSchema);
