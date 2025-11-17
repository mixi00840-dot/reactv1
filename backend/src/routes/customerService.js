const express = require('express');
const router = express.Router();
const customerServiceController = require('../controllers/customerServiceController');
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');

// Rate limiting for customer service operations
const { rateLimitMiddleware } = require('../middleware/auth');

// Validation schemas
const ticketValidation = [
  body('subject')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('category')
    .isIn([
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
    ])
    .withMessage('Invalid ticket category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('relatedOrderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('relatedProductId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID')
];

const messageValidation = [
  body('message')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  body('isInternal')
    .optional()
    .isBoolean()
    .withMessage('isInternal must be a boolean')
];

const ticketUpdateValidation = [
  body('status')
    .optional()
    .isIn([
      'open',
      'in_progress',
      'waiting_customer',
      'waiting_internal',
      'escalated',
      'resolved',
      'closed'
    ])
    .withMessage('Invalid ticket status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID for assignment'),
  
  body('resolution')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Resolution summary cannot exceed 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const chatValidation = [
  body('subject')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),
  
  body('department')
    .optional()
    .isIn(['sales', 'support', 'technical', 'billing'])
    .withMessage('Invalid department'),
  
  body('customerInfo')
    .optional()
    .isObject()
    .withMessage('Customer info must be an object')
];

const chatMessageValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'quick_reply'])
    .withMessage('Invalid message type'),
  
  body('quickReply')
    .optional()
    .isObject()
    .withMessage('Quick reply must be an object')
];

const faqVoteValidation = [
  body('helpful')
    .isBoolean()
    .withMessage('Helpful must be a boolean value')
];

// Query validation schemas
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters')
];

const ticketQueryValidation = [
  ...paginationValidation,
  
  query('status')
    .optional()
    .isIn([
      'open',
      'in_progress',
      'waiting_customer',
      'waiting_internal',
      'escalated',
      'resolved',
      'closed'
    ])
    .withMessage('Invalid status filter'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  
  query('category')
    .optional()
    .isIn([
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
    ])
    .withMessage('Invalid category filter'),
  
  query('assignedTo')
    .optional()
    .custom((value) => {
      if (value !== 'me' && value !== 'unassigned' && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid assignedTo filter');
      }
      return true;
    }),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'priority', 'status'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const chatQueryValidation = [
  ...paginationValidation,
  
  query('status')
    .optional()
    .isIn(['waiting', 'active', 'transferred', 'ended', 'abandoned'])
    .withMessage('Invalid chat status'),
  
  query('agent')
    .optional()
    .custom((value) => {
      if (value !== 'me' && value !== 'unassigned' && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid agent filter');
      }
      return true;
    })
];

const analyticsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('groupBy')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('groupBy must be one of: day, week, month, year')
];

// Support Ticket Routes

// Get support tickets
router.get('/tickets',
  auth.authenticate,
  rateLimitMiddleware('get_tickets', 100, 60000),
  ticketQueryValidation,
  customerServiceController.getTickets
);

// Create support ticket
router.post('/tickets',
  auth.authenticate,
  auth.customerMiddleware,
  rateLimitMiddleware('create_ticket', 10, 60000), // 10 tickets per minute
  ticketValidation,
  customerServiceController.createTicket
);

// Get ticket details
router.get('/tickets/:id',
  auth.authenticate,
  rateLimitMiddleware('get_ticket_details', 100, 60000),
  param('id').isMongoId().withMessage('Invalid ticket ID'),
  customerServiceController.getTicketDetails
);

// Add message to ticket
router.post('/tickets/:id/messages',
  auth.authenticate,
  rateLimitMiddleware('add_ticket_message', 30, 60000),
  [
    param('id').isMongoId().withMessage('Invalid ticket ID'),
    ...messageValidation
  ],
  customerServiceController.addTicketMessage
);

// Update ticket status
router.put('/tickets/:id',
  auth.authenticate,
  rateLimitMiddleware('update_ticket', 20, 60000),
  [
    param('id').isMongoId().withMessage('Invalid ticket ID'),
    ...ticketUpdateValidation
  ],
  customerServiceController.updateTicketStatus
);

// Live Chat Routes

// Start chat session
router.post('/chat/start',
  auth.authenticate,
  auth.customerMiddleware,
  rateLimitMiddleware('start_chat', 5, 60000), // 5 chat sessions per minute
  chatValidation,
  customerServiceController.startChatSession
);

// Get chat sessions
router.get('/chat/sessions',
  auth.authenticate,
  rateLimitMiddleware('get_chat_sessions', 100, 60000),
  chatQueryValidation,
  customerServiceController.getChatSessions
);

// Get chat messages
router.get('/chat/:sessionId/messages',
  auth.authenticate,
  rateLimitMiddleware('get_chat_messages', 100, 60000),
  [
    param('sessionId').isLength({ min: 5, max: 50 }).withMessage('Invalid session ID'),
    ...paginationValidation
  ],
  customerServiceController.getChatMessages
);

// Send chat message
router.post('/chat/:sessionId/messages',
  auth.authenticate,
  rateLimitMiddleware('send_chat_message', 60, 60000), // 60 messages per minute
  [
    param('sessionId').isLength({ min: 5, max: 50 }).withMessage('Invalid session ID'),
    ...chatMessageValidation
  ],
  customerServiceController.sendChatMessage
);

// End chat session
router.post('/chat/:sessionId/end',
  auth.authenticate,
  rateLimitMiddleware('end_chat', 10, 60000),
  [
    param('sessionId').isLength({ min: 5, max: 50 }).withMessage('Invalid session ID'),
    body('feedback')
      .optional()
      .isObject()
      .withMessage('Feedback must be an object'),
    body('feedback.rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('feedback.comment')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Feedback comment cannot exceed 500 characters')
  ],
  customerServiceController.endChatSession
);

// FAQ Routes

// Get FAQs
router.get('/faq',
  rateLimitMiddleware('get_faqs', 100, 60000),
  [
    ...paginationValidation,
    query('category')
      .optional()
      .isMongoId()
      .withMessage('Invalid category ID'),
    query('published')
      .optional()
      .isBoolean()
      .withMessage('Published must be a boolean')
  ],
  customerServiceController.getFAQs
);

// Get FAQ categories
router.get('/faq/categories',
  rateLimitMiddleware('get_faq_categories', 100, 60000),
  query('includeCount')
    .optional()
    .isBoolean()
    .withMessage('includeCount must be a boolean'),
  customerServiceController.getFAQCategories
);

// Vote on FAQ helpfulness
router.post('/faq/:id/vote',
  auth.authenticate,
  rateLimitMiddleware('vote_faq', 10, 60000),
  [
    param('id').isMongoId().withMessage('Invalid FAQ ID'),
    ...faqVoteValidation
  ],
  customerServiceController.voteFAQ
);

// Customer Service Analytics

// Get customer service analytics
router.get('/analytics',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('cs_analytics', 30, 60000),
  analyticsValidation,
  customerServiceController.getAnalytics
);

// Admin Routes (Support Agent/Admin Only)

// Assign ticket to agent
router.put('/admin/tickets/:id/assign',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('assign_ticket', 20, 60000),
  [
    param('id').isMongoId().withMessage('Invalid ticket ID'),
    body('agentId')
      .isMongoId()
      .withMessage('Valid agent ID is required'),
    body('team')
      .optional()
      .isIn(['general', 'technical', 'billing', 'shipping', 'escalation'])
      .withMessage('Invalid team')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { agentId, team } = req.body;

      const { SupportTicket } = require('../models/CustomerService');
      const User = require('../models/User');

      // Verify agent exists and has correct role
      const agent = await User.findById(agentId);
      if (!agent || !['support_agent', 'admin'].includes(agent.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid agent or agent role'
        });
      }

      // Update ticket
      const ticket = await SupportTicket.findByIdAndUpdate(
        id,
        {
          assignedTo: agentId,
          assignedTeam: team,
          status: 'in_progress'
        },
        { new: true }
      ).populate('assignedTo', 'firstName lastName email');

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: ticket
      });

    } catch (error) {
      console.error('Error assigning ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning ticket',
        error: error.message
      });
    }
  }
);

// Transfer chat to another agent
router.put('/admin/chat/:sessionId/transfer',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('transfer_chat', 10, 60000),
  [
    param('sessionId').isLength({ min: 5, max: 50 }).withMessage('Invalid session ID'),
    body('toAgentId')
      .isMongoId()
      .withMessage('Valid agent ID is required'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ],
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { toAgentId, reason } = req.body;

      // Try to import LiveChat model
      let LiveChat;
      try {
        const customerService = require('../models/CustomerService');
        LiveChat = customerService.LiveChat || null;
      } catch (error) {
        return res.status(503).json({
          success: false,
          message: 'Live chat feature not available'
        });
      }

      if (!LiveChat) {
        return res.status(503).json({
          success: false,
          message: 'Live chat model not configured'
        });
      }

      const User = require('../models/User');

      // Verify target agent
      const targetAgent = await User.findById(toAgentId);
      if (!targetAgent || !['support_agent', 'admin'].includes(targetAgent.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target agent'
        });
      }

      // Find and update chat session
      const session = await LiveChat.findOne({ sessionId });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Add transfer record
      session.transferHistory.push({
        fromAgent: session.agent,
        toAgent: toAgentId,
        reason: reason || 'Manual transfer',
        transferredAt: new Date()
      });

      // Update agent assignment
      session.agent = toAgentId;
      session.status = 'transferred';

      await session.save();

      res.json({
        success: true,
        message: 'Chat transferred successfully',
        data: session
      });

    } catch (error) {
      console.error('Error transferring chat:', error);
      res.status(500).json({
        success: false,
        message: 'Error transferring chat',
        error: error.message
      });
    }
  }
);

// Get agent performance metrics
router.get('/admin/agents/performance',
  auth.authenticate,
  auth.adminMiddleware,
  rateLimitMiddleware('agent_performance', 20, 60000),
  [
    query('agentId')
      .optional()
      .isMongoId()
      .withMessage('Invalid agent ID'),
    ...analyticsValidation
  ],
  async (req, res) => {
    try {
      const {
        agentId,
        startDate,
        endDate
      } = req.query;

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Build match query
      let matchQuery = {
        createdAt: { $gte: start, $lte: end }
      };

      if (agentId) {
        matchQuery.assignedTo = mongoose.Types.ObjectId(agentId);
      }

      // Try to import models
      let SupportTicket, LiveChat;
      try {
        const customerService = require('../models/CustomerService');
        SupportTicket = customerService.SupportTicket || customerService;
        LiveChat = customerService.LiveChat || null;
      } catch (error) {
        console.warn('CustomerService models not available:', error.message);
        SupportTicket = require('../models/CustomerService');
        LiveChat = null;
      }

      // Ticket performance
      const ticketPerformance = await SupportTicket.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$assignedTo',
            totalTickets: { $sum: 1 },
            resolvedTickets: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            avgResolutionTime: { $avg: '$resolution.resolutionTime' },
            slaBreaches: {
              $sum: { $cond: ['$sla.breachedSLA', 1, 0] }
            },
            avgSatisfaction: { $avg: '$resolution.customerSatisfaction.rating' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent'
          }
        },
        {
          $unwind: '$agent'
        },
        {
          $project: {
            agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
            agentEmail: '$agent.email',
            totalTickets: 1,
            resolvedTickets: 1,
            resolutionRate: {
              $cond: [
                { $gt: ['$totalTickets', 0] },
                { $divide: ['$resolvedTickets', '$totalTickets'] },
                0
              ]
            },
            avgResolutionTime: 1,
            slaBreaches: 1,
            slaCompliance: {
              $cond: [
                { $gt: ['$totalTickets', 0] },
                { $divide: [{ $subtract: ['$totalTickets', '$slaBreaches'] }, '$totalTickets'] },
                0
              ]
            },
            avgSatisfaction: 1
          }
        }
      ]);

      // Chat performance (only if LiveChat model available)
      let chatPerformance = [];
      if (LiveChat) {
        chatPerformance = await LiveChat.aggregate([
          {
            $match: {
              ...matchQuery,
              agent: { $exists: true }
            }
          },
          {
            $group: {
              _id: '$agent',
              totalChats: { $sum: 1 },
              avgDuration: { $avg: '$metrics.duration' },
              avgWaitTime: { $avg: '$waitTime' },
              avgSatisfaction: { $avg: '$feedback.rating' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'agent'
            }
          },
          {
            $unwind: '$agent'
          },
          {
            $project: {
              agentName: { $concat: ['$agent.firstName', ' ', '$agent.lastName'] },
              agentEmail: '$agent.email',
              totalChats: 1,
              avgDuration: 1,
              avgWaitTime: 1,
              avgSatisfaction: 1
            }
          }
        ]);
      }

      res.json({
        success: true,
        data: {
          period: { start, end },
          ticketPerformance,
          chatPerformance
        }
      });

    } catch (error) {
      console.error('Error fetching agent performance:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching agent performance metrics',
        error: error.message
      });
    }
  }
);

// Bulk ticket operations
router.post('/admin/tickets/bulk',
  auth.authenticate,
  auth.adminOrSupportMiddleware,
  rateLimitMiddleware('bulk_ticket_ops', 5, 60000),
  [
    body('ticketIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('Must provide 1-50 ticket IDs'),
    body('ticketIds.*')
      .isMongoId()
      .withMessage('All ticket IDs must be valid'),
    body('action')
      .isIn(['assign', 'update_status', 'add_tags', 'set_priority'])
      .withMessage('Invalid bulk action'),
    body('data')
      .isObject()
      .withMessage('Action data is required')
  ],
  async (req, res) => {
    try {
      const { ticketIds, action, data } = req.body;

      const { SupportTicket } = require('../models/CustomerService');
      let updateQuery = {};

      switch (action) {
        case 'assign':
          if (!data.agentId) {
            return res.status(400).json({
              success: false,
              message: 'Agent ID is required for assignment'
            });
          }
          updateQuery = {
            assignedTo: data.agentId,
            assignedTeam: data.team
          };
          break;

        case 'update_status':
          if (!data.status) {
            return res.status(400).json({
              success: false,
              message: 'Status is required'
            });
          }
          updateQuery = { status: data.status };
          break;

        case 'add_tags':
          if (!data.tags || !Array.isArray(data.tags)) {
            return res.status(400).json({
              success: false,
              message: 'Tags array is required'
            });
          }
          updateQuery = { $addToSet: { tags: { $each: data.tags } } };
          break;

        case 'set_priority':
          if (!data.priority) {
            return res.status(400).json({
              success: false,
              message: 'Priority is required'
            });
          }
          updateQuery = { priority: data.priority };
          break;
      }

      // Update tickets
      const result = await SupportTicket.updateMany(
        { _id: { $in: ticketIds } },
        updateQuery
      );

      res.json({
        success: true,
        message: `Bulk ${action} completed successfully`,
        data: {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount
        }
      });

    } catch (error) {
      console.error('Error in bulk ticket operation:', error);
      res.status(500).json({
        success: false,
        message: 'Error performing bulk operation',
        error: error.message
      });
    }
  }
);

// Error handling middleware for customer service routes
router.use((error, req, res, next) => {
  console.error('Customer service routes error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error in customer service operations'
  });
});

module.exports = router;