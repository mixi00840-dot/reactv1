const mongoose = require('mongoose');

const CustomerServiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  subject: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['account', 'payment', 'technical', 'content', 'order', 'other'],
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  messages: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isStaff: Boolean
  }],
  
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true
});

CustomerServiceSchema.index({ ticketNumber: 1 }, { unique: true });
CustomerServiceSchema.index({ userId: 1, status: 1 });
CustomerServiceSchema.index({ status: 1, priority: -1, createdAt: 1 });

const CustomerService = mongoose.model('CustomerService', CustomerServiceSchema);

module.exports = CustomerService;

