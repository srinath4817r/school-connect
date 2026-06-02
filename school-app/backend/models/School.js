const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  wifiSSID: {
    type: String,
    default: 'Greenwood_High_Staff_WiFi'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  schoolPhoto: {
    type: String,
    default: ''
  },
  logoUrl: {
    type: String,
    default: ''
  },
  generatedCodes: [{
    code: { type: String },
    role: { type: String, enum: ['principal', 'teacher', 'parent', 'driver'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('School', SchoolSchema);
