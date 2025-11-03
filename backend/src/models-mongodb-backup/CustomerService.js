const mongoose = require('mongoose');

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Ticket Information
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'order_issue',
      'payment_problem',
      'shipping_inquiry',
      'product_question',
      'account_issue',
      'technical_support',
      'refund_request',
      'complaint',
      'suggestion',
      'other'
    ]
  },
  
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  status: {
    type: String,
    required: true,
    enum: [
      'open',
      'in_progress',
      'waiting_customer',
      'waiting_internal',
      'escalated',
      'resolved',
      'closed'
    ],
    default: 'open'
  },
  
  // User Information
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  customerEmail: {
    type: String,
    required: true
  },
  
  customerName: {
    type: String,
    required: true
  },
  
  // Assignment Information
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  assignedTeam: {
    type: String,
    enum: ['general', 'technical', 'billing', 'shipping', 'escalation']
  },
  
  // Related Information
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  relatedStore: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags for organization
  tags: [String],
  
  // Internal Notes (not visible to customer)
  internalNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution Information
  resolution: {
    summary: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionTime: Number, // in minutes
    customerSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      ratedAt: Date
    }
  },
  
  // SLA Tracking
  sla: {
    firstResponseTime: Date,
    firstResponseDue: Date,
    resolutionDue: Date,
    breachedSLA: {
      type: Boolean,
      default: false
    }
  },
  
  // Communication History
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketMessage'
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'email', 'chat', 'phone', 'social'],
    default: 'web'
  },
  
  language: {
    type: String,
    default: 'en'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ticket Message Schema
const ticketMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true,
    index: true
  },
  
  // Message Content
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  messageType: {
    type: String,
    enum: ['customer', 'agent', 'system', 'internal'],
    required: true
  },
  
  // Sender Information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  senderName: {
    type: String,
    required: true
  },
  
  senderEmail: {
    type: String,
    required: true
  },
  
  // Message Properties
  isInternal: {
    type: Boolean,
    default: false
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Response Information
  inResponseTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketMessage'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Live Chat Schema
const liveChatSchema = new mongoose.Schema({
  // Session Information
  sessionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Participants
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Session Status
  status: {
    type: String,
    enum: [
      'waiting',
      'active',
      'transferred',
      'ended',
      'abandoned'
    ],
    default: 'waiting'
  },
  
  // Queue Information
  queue: {
    type: String,
    enum: ['general', 'technical', 'billing', 'vip'],
    default: 'general'
  },
  
  waitTime: {
    type: Number, // in seconds
    default: 0
  },
  
  // Chat Information
  subject: {
    type: String,
    maxlength: 200
  },
  
  department: {
    type: String,
    enum: ['sales', 'support', 'technical', 'billing']
  },
  
  // Customer Information
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    ipAddress: String,
    userAgent: String,
    referrer: String,
    currentPage: String
  },
  
  // Messages
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }],
  
  // Session Metrics
  metrics: {
    startedAt: Date,
    endedAt: Date,
    duration: Number, // in seconds
    messageCount: {
      type: Number,
      default: 0
    },
    customerMessageCount: {
      type: Number,
      default: 0
    },
    agentMessageCount: {
      type: Number,
      default: 0
    }
  },
  
  // Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  
  // Transfer Information
  transferHistory: [{
    fromAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    toAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    transferredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Related Information
  relatedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket'
  },
  
  // Tags
  tags: [String],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  chatSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveChat',
    required: true,
    index: true
  },
  
  // Message Content
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system', 'quick_reply'],
    default: 'text'
  },
  
  // Sender Information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  senderType: {
    type: String,
    enum: ['customer', 'agent', 'system'],
    required: true
  },
  
  senderName: {
    type: String,
    required: true
  },
  
  // Message Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  // Attachments
  attachment: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  },
  
  // Quick Reply Data
  quickReply: {
    options: [String],
    selectedOption: String
  },
  
  // System Message Data
  systemData: {
    type: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// FAQ Schema
const faqSchema = new mongoose.Schema({
  // FAQ Content
  question: {
    type: String,
    required: true,
    maxlength: 300
  },
  
  answer: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Organization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQCategory',
    required: true,
    index: true
  },
  
  subcategory: {
    type: String,
    maxlength: 100
  },
  
  // Content Properties
  isPublished: {
    type: Boolean,
    default: false
  },
  
  language: {
    type: String,
    default: 'en'
  },
  
  // SEO and Search
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  keywords: [String],
  
  metaDescription: {
    type: String,
    maxlength: 160
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  unhelpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Related Information
  relatedFAQs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  
  relatedArticles: [String],
  
  // Content Management
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  version: {
    type: Number,
    default: 1
  },
  
  // Order/Priority
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishedAt: Date
}, {
  timestamps: true
});

// FAQ Category Schema
const faqCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  slug: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQCategory'
  },
  
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQCategory'
  }],
  
  // Display Properties
  icon: String,
  
  color: String,
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  faqCount: {
    type: Number,
    default: 0
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Knowledge Base Article Schema
const knowledgeBaseSchema = new mongoose.Schema({
  // Article Content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  content: {
    type: String,
    required: true
  },
  
  summary: {
    type: String,
    maxlength: 500
  },
  
  // Organization
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQCategory',
    required: true
  },
  
  tags: [String],
  
  // Publication Status
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  
  // SEO
  slug: {
    type: String,
    unique: true,
    index: true
  },
  
  metaTitle: String,
  metaDescription: String,
  
  // Content Properties
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  estimatedReadTime: Number, // in minutes
  
  // Media
  featuredImage: String,
  
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }],
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  likes: {
    type: Number,
    default: 0
  },
  
  shares: {
    type: Number,
    default: 0
  },
  
  // User Engagement
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  averageRating: {
    type: Number,
    default: 0
  },
  
  // Content Management
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  
  changeLog: [{
    version: Number,
    changes: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  publishedAt: Date
}, {
  timestamps: true
});

// Add indexes for performance
supportTicketSchema.index({ ticketNumber: 1 });
supportTicketSchema.index({ customer: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ 'sla.resolutionDue': 1 });

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });
ticketMessageSchema.index({ sender: 1 });

liveChatSchema.index({ sessionId: 1 });
liveChatSchema.index({ customer: 1, status: 1 });
liveChatSchema.index({ agent: 1, status: 1 });
liveChatSchema.index({ createdAt: -1 });

chatMessageSchema.index({ chatSession: 1, createdAt: 1 });

faqSchema.index({ category: 1, isPublished: 1 });
faqSchema.index({ keywords: 1 });
faqSchema.index({ displayOrder: 1 });

faqCategorySchema.index({ slug: 1 });
faqCategorySchema.index({ parent: 1 });
faqCategorySchema.index({ displayOrder: 1 });

knowledgeBaseSchema.index({ category: 1, status: 1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ slug: 1 });

// Pre-save middleware
supportTicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

liveChatSchema.pre('save', function(next) {
  if (!this.sessionId) {
    this.sessionId = `CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

faqSchema.pre('save', function(next) {
  if (!this.slug && this.question) {
    this.slug = this.question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  this.updatedAt = new Date();
  next();
});

knowledgeBaseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  if (this.content) {
    // Estimate read time (average 200 words per minute)
    const wordCount = this.content.split(/\s+/).length;
    this.estimatedReadTime = Math.ceil(wordCount / 200);
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual fields
supportTicketSchema.virtual('isOverdue').get(function() {
  return this.sla.resolutionDue && new Date() > this.sla.resolutionDue;
});

liveChatSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

faqSchema.virtual('helpfulRatio').get(function() {
  const total = this.helpfulVotes + this.unhelpfulVotes;
  return total > 0 ? this.helpfulVotes / total : 0;
});

// Create models
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema);
const LiveChat = mongoose.model('LiveChat', liveChatSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const FAQ = mongoose.model('FAQ', faqSchema);
const FAQCategory = mongoose.model('FAQCategory', faqCategorySchema);
const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

module.exports = {
  SupportTicket,
  TicketMessage,
  LiveChat,
  ChatMessage,
  FAQ,
  FAQCategory,
  KnowledgeBase
};