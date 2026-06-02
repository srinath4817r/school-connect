const mongoose = require('mongoose');

const SecretCodeSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['super_admin', 'school_admin', 'principal', 'teacher', 'parent', 'driver'],
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Compare secret code directly in plain text
SecretCodeSchema.methods.compareCode = async function(candidateCode) {
  return candidateCode === this.code;
};

module.exports = mongoose.model('SecretCode', SecretCodeSchema);

