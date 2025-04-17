const mongoose = require('mongoose');

const recruitmentRequestSchema = new mongoose.Schema({
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String
  },
  requirements: {
    type: String
  },
  salary: {
    type: String
  },
  deadline: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RecruitmentRequest', recruitmentRequestSchema); 