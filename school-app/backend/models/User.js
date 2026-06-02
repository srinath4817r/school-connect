const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'principal', 'teacher', 'parent', 'driver'],
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function() {
      // Super Admin does not need a school association
      return this.role !== 'super_admin';
    }
  },
  classAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false
  },
  sectionAssigned: {
    type: String,
    required: false
  },
  // Teacher fields
  subjects: {
    type: [String],
    default: []
  },
  primaryClass: {
    type: String,
    default: ''
  },
  primarySection: {
    type: String,
    default: ''
  },
  classesTeaching: {
    type: [String],
    default: []
  },
  // Parent fields
  fatherName: {
    type: String,
    default: ''
  },
  motherName: {
    type: String,
    default: ''
  },
  fatherPhone: {
    type: String,
    default: ''
  },
  motherPhone: {
    type: String,
    default: ''
  },
  relationship: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  homeAddress: {
    type: String,
    default: ''
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'parent' ? 'pending' : 'approved';
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  // Driver fields
  vehicleNumber: {
    type: String,
    default: ''
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  assignedRoute: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  profilePhotoUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if locked
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', UserSchema);
