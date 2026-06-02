const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
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
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    required: true,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  officePhone: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

// Pre-save hook to calculate pending amount
FeeSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model('Fee', FeeSchema);
