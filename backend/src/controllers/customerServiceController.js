const CustomerService = require('../models/CustomerService');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class CustomerServiceController {
  // Support Ticket Operations
  
  // Get support tickets
  async getTickets(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category,
        assignedTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on user role
      let query = {};

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        // Sellers can see tickets related to their store/products
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          query.$or = [
            { relatedStore: store._id },
            { assignedTo: req.user._id }
          ];
        }
      } else if (req.user.role === 'support_agent') {
        // Support agents can see assigned tickets or unassigned
        if (assignedTo === 'me') {
          query.assignedTo = req.user._id;
        } else if (assignedTo === 'unassigned') {
          query.assignedTo = { $exists: false };
        }
      }

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (priority) {
        query.priority = priority;
      }

      if (category) {
        query.category = category;
      }

      if (assignedTo && assignedTo !== 'me' && assignedTo !== 'unassigned') {
        query.assignedTo = assignedTo;
      }

      if (search) {
        query.$or = [
          { subject: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { ticketNumber: new RegExp(search, 'i') },
          { customerName: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get tickets
      const tickets = await CustomerService.find(query)
        .populate('customer', 'firstName lastName email avatar')
        .populate('assignedTo', 'firstName lastName email')
        .populate('relatedOrder', 'orderNumber status')
        .populate('relatedProduct', 'name images')
        .populate('relatedStore', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await CustomerService.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching support tickets',
        error: error.message
      });
    }
  }

  // Create support ticket
  async createTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        subject,
        description,
        category,
        priority = 'medium',
        relatedOrderId,
        relatedProductId
      } = req.body;

      // Create ticket data
      const ticketData = {
        subject,
        description,
        category,
        priority,
        customer: req.user._id,
        customerEmail: req.user.email,
        customerName: `${req.user.firstName} ${req.user.lastName}`,
        source: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web'
      };

      // Add related entities if provided
      if (relatedOrderId) {
        const order = await Order.findById(relatedOrderId);
        if (order && order.customer.toString() === req.user._id.toString()) {
          ticketData.relatedOrder = relatedOrderId;
          ticketData.relatedStore = order.storeId;
        }
      }

      if (relatedProductId) {
        const product = await Product.findById(relatedProductId);
        if (product) {
          ticketData.relatedProduct = relatedProductId;
          ticketData.relatedStore = product.storeId;
        }
      }

      // Set SLA based on priority
      const slaHours = this.getSLAHours(priority);
      ticketData.sla = {
        firstResponseDue: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        resolutionDue: new Date(Date.now() + slaHours * 60 * 60 * 1000)
      };

      // Auto-assign based on category and store
      if (ticketData.relatedStore) {
        const agent = await this.findBestAgent(category, ticketData.relatedStore);
        if (agent) {
          ticketData.assignedTo = agent._id;
          ticketData.assignedTeam = this.getCategoryTeam(category);
        }
      }

      // Create ticket
      const ticket = new CustomerService(ticketData);
      await ticket.save();

      // Populate references
      await ticket.populate([
        { path: 'customer', select: 'firstName lastName email' },
        { path: 'assignedTo', select: 'firstName lastName email' },
        { path: 'relatedOrder', select: 'orderNumber status' },
        { path: 'relatedProduct', select: 'name images' },
        { path: 'relatedStore', select: 'name slug' }
      ]);

      // Send notification to assigned agent
      if (ticket.assignedTo) {
        await this.notifyAgent(ticket, 'new_ticket');
      }

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: ticket
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating support ticket',
        error: error.message
      });
    }
  }

  // Get ticket details
  async getTicketDetails(req, res) {
    try {
      const { id } = req.params;

      // Build query with role-based restrictions
      let query = { _id: id };

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          query.relatedStore = store._id;
        }
      }

      const ticket = await CustomerService.findOne(query)
        .populate('customer', 'firstName lastName email avatar')
        .populate('assignedTo', 'firstName lastName email avatar')
        .populate('relatedOrder', 'orderNumber status totalAmount')
        .populate('relatedProduct', 'name images price')
        .populate('relatedStore', 'name slug')
        .populate({
          path: 'messages',
          populate: {
            path: 'sender',
            select: 'firstName lastName email avatar'
          }
        });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
      }

      // Get messages
      const messages = await TicketMessage.find({ ticket: ticket._id })
        .populate('sender', 'firstName lastName email avatar')
        .sort('createdAt');

      res.json({
        success: true,
        data: {
          ticket,
          messages
        }
      });

    } catch (error) {
      console.error('Error fetching ticket details:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ticket details',
        error: error.message
      });
    }
  }

  // Add message to ticket
  async addTicketMessage(req, res) {
    try {
      const { id } = req.params;
      const { message, isInternal = false } = req.body;

      // Find ticket with permissions check
      let query = { _id: id };

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (store) {
          query.relatedStore = store._id;
        }
      }

      const ticket = await CustomerService.findOne(query);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
      }

      // Determine message type
      let messageType = 'customer';
      if (req.user.role === 'admin' || req.user.role === 'support_agent') {
        messageType = isInternal ? 'internal' : 'agent';
      } else if (req.user.role === 'seller') {
        messageType = 'agent';
      }

      // Create message
      const ticketMessage = new TicketMessage({
        ticket: ticket._id,
        message,
        messageType,
        sender: req.user._id,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        senderEmail: req.user.email,
        isInternal
      });

      await ticketMessage.save();

      // Update ticket
      ticket.messages.push(ticketMessage._id);
      ticket.lastActivityAt = new Date();

      // Update status if needed
      if (ticket.status === 'waiting_customer' && messageType === 'customer') {
        ticket.status = 'in_progress';
      } else if (messageType === 'agent' && ticket.status === 'open') {
        ticket.status = 'in_progress';
        ticket.sla.firstResponseTime = new Date();
      }

      await ticket.save();

      // Populate message
      await ticketMessage.populate('sender', 'firstName lastName email avatar');

      // Send notifications
      await this.notifyTicketParticipants(ticket, ticketMessage);

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: ticketMessage
      });

    } catch (error) {
      console.error('Error adding ticket message:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding message to ticket',
        error: error.message
      });
    }
  }

  // Update ticket status
  async updateTicketStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resolution, assignedTo, priority, tags } = req.body;

      // Check permissions
      if (req.user.role === 'customer' && status && !['closed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Customers can only close tickets'
        });
      }

      // Find ticket
      const ticket = await CustomerService.findById(id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
      }

      // Check permissions for sellers
      if (req.user.role === 'seller') {
        const store = await Store.findOne({ ownerId: req.user._id });
        if (!store || ticket.relatedStore?.toString() !== store._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Update fields
      if (status) {
        ticket.status = status;

        if (status === 'resolved' || status === 'closed') {
          ticket.resolution = ticket.resolution || {};
          ticket.resolution.resolvedBy = req.user._id;
          ticket.resolution.resolvedAt = new Date();

          if (resolution) {
            ticket.resolution.summary = resolution;
          }

          // Calculate resolution time
          const resolutionTime = Math.round(
            (new Date() - ticket.createdAt) / (1000 * 60)
          );
          ticket.resolution.resolutionTime = resolutionTime;

          // Check SLA breach
          if (ticket.sla.resolutionDue && new Date() > ticket.sla.resolutionDue) {
            ticket.sla.breachedSLA = true;
          }
        }
      }

      if (assignedTo) {
        ticket.assignedTo = assignedTo;
      }

      if (priority) {
        ticket.priority = priority;
        // Update SLA if priority changed
        const slaHours = this.getSLAHours(priority);
        ticket.sla.resolutionDue = new Date(ticket.createdAt.getTime() + slaHours * 60 * 60 * 1000);
      }

      if (tags) {
        ticket.tags = tags;
      }

      await ticket.save();

      // Populate references
      await ticket.populate([
        { path: 'customer', select: 'firstName lastName email' },
        { path: 'assignedTo', select: 'firstName lastName email' }
      ]);

      // Send notifications
      await this.notifyTicketUpdate(ticket);

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
      });

    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating ticket',
        error: error.message
      });
    }
  }

  // Live Chat Operations

  // Start chat session
  async startChatSession(req, res) {
    try {
      const {
        subject,
        department = 'support',
        customerInfo = {}
      } = req.body;

      // Check for existing active session
      const existingSession = await LiveChat.findOne({
        customer: req.user._id,
        status: { $in: ['waiting', 'active'] }
      });

      if (existingSession) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active chat session',
          data: existingSession
        });
      }

      // Create chat session
      const chatSession = new LiveChat({
        customer: req.user._id,
        subject,
        department,
        queue: this.getDepartmentQueue(department),
        customerInfo: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
          ...customerInfo
        },
        metrics: {
          startedAt: new Date()
        }
      });

      await chatSession.save();

      // Find available agent
      const agent = await this.findAvailableAgent(department);
      
      if (agent) {
        chatSession.agent = agent._id;
        chatSession.status = 'active';
        await chatSession.save();

        // Notify agent
        await this.notifyAgent(agent, 'new_chat', { chatSession });
      } else {
        // Add to queue
        await this.addToQueue(chatSession);
      }

      // Populate references
      await chatSession.populate([
        { path: 'customer', select: 'firstName lastName email avatar' },
        { path: 'agent', select: 'firstName lastName email avatar' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Chat session started',
        data: chatSession
      });

    } catch (error) {
      console.error('Error starting chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Error starting chat session',
        error: error.message
      });
    }
  }

  // Get chat sessions
  async getChatSessions(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        agent,
        search
      } = req.query;

      // Build query based on user role
      let query = {};

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'support_agent') {
        if (agent === 'me') {
          query.agent = req.user._id;
        } else if (agent === 'unassigned') {
          query.agent = { $exists: false };
        }
      }

      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { subject: new RegExp(search, 'i') },
          { sessionId: new RegExp(search, 'i') },
          { 'customerInfo.name': new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get chat sessions
      const sessions = await LiveChat.find(query)
        .populate('customer', 'firstName lastName email avatar')
        .populate('agent', 'firstName lastName email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await LiveChat.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat sessions',
        error: error.message
      });
    }
  }

  // Get chat messages
  async getChatMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Find chat session with permissions
      let query = { sessionId };

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'support_agent') {
        query.agent = req.user._id;
      }

      const session = await LiveChat.findOne(query);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get messages
      const messages = await ChatMessage.find({ chatSession: session._id })
        .populate('sender', 'firstName lastName email avatar')
        .sort('createdAt')
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          messages,
          session
        }
      });

    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat messages',
        error: error.message
      });
    }
  }

  // Send chat message
  async sendChatMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { message, messageType = 'text', quickReply } = req.body;

      // Find chat session
      let query = { sessionId };

      if (req.user.role === 'customer') {
        query.customer = req.user._id;
      } else if (req.user.role === 'support_agent') {
        query.agent = req.user._id;
      }

      const session = await LiveChat.findOne(query);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      if (session.status === 'ended') {
        return res.status(400).json({
          success: false,
          message: 'Chat session has ended'
        });
      }

      // Determine sender type
      let senderType = 'customer';
      if (req.user.role === 'support_agent' || req.user.role === 'admin') {
        senderType = 'agent';
      }

      // Create message
      const chatMessage = new ChatMessage({
        chatSession: session._id,
        message,
        messageType,
        sender: req.user._id,
        senderType,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
        quickReply
      });

      await chatMessage.save();

      // Update session metrics
      session.metrics.messageCount += 1;
      if (senderType === 'customer') {
        session.metrics.customerMessageCount += 1;
      } else {
        session.metrics.agentMessageCount += 1;
      }

      session.messages.push(chatMessage._id);
      await session.save();

      // Populate message
      await chatMessage.populate('sender', 'firstName lastName email avatar');

      // Send real-time notification
      await this.sendChatNotification(session, chatMessage);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: chatMessage
      });

    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending chat message',
        error: error.message
      });
    }
  }

  // End chat session
  async endChatSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { feedback } = req.body;

      // Find chat session
      const session = await LiveChat.findOne({ sessionId });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Check permissions
      if (req.user.role === 'customer' && session.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (req.user.role === 'support_agent' && session.agent?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update session
      session.status = 'ended';
      session.metrics.endedAt = new Date();
      session.metrics.duration = Math.round(
        (session.metrics.endedAt - session.metrics.startedAt) / 1000
      );

      if (feedback) {
        session.feedback = {
          ...feedback,
          submittedAt: new Date()
        };
      }

      await session.save();

      res.json({
        success: true,
        message: 'Chat session ended successfully',
        data: session
      });

    } catch (error) {
      console.error('Error ending chat session:', error);
      res.status(500).json({
        success: false,
        message: 'Error ending chat session',
        error: error.message
      });
    }
  }

  // FAQ Operations

  // Get FAQs
  async getFAQs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        search,
        published = true
      } = req.query;

      // Build query
      let query = {};

      if (published === 'true') {
        query.isPublished = true;
      } else if (published === 'false') {
        query.isPublished = false;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { question: new RegExp(search, 'i') },
          { answer: new RegExp(search, 'i') },
          { keywords: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get FAQs
      const faqs = await FAQ.find(query)
        .populate('category', 'name slug')
        .populate('author', 'firstName lastName')
        .sort('displayOrder')
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await FAQ.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          faqs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching FAQs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching FAQs',
        error: error.message
      });
    }
  }

  // Get FAQ categories
  async getFAQCategories(req, res) {
    try {
      const { includeCount = true } = req.query;

      const categories = await FAQCategory.find({ isActive: true })
        .sort('displayOrder')
        .lean();

      if (includeCount === 'true') {
        // Add FAQ count for each category
        for (const category of categories) {
          category.faqCount = await FAQ.countDocuments({
            category: category._id,
            isPublished: true
          });
        }
      }

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching FAQ categories',
        error: error.message
      });
    }
  }

  // Vote on FAQ helpfulness
  async voteFAQ(req, res) {
    try {
      const { id } = req.params;
      const { helpful } = req.body;

      const faq = await FAQ.findById(id);

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      // Update vote count
      if (helpful) {
        faq.helpfulVotes += 1;
      } else {
        faq.unhelpfulVotes += 1;
      }

      await faq.save();

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          helpfulVotes: faq.helpfulVotes,
          unhelpfulVotes: faq.unhelpfulVotes,
          helpfulRatio: faq.helpfulRatio
        }
      });

    } catch (error) {
      console.error('Error voting on FAQ:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording vote',
        error: error.message
      });
    }
  }

  // Get customer service analytics
  async getAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Ticket analytics
      const ticketStats = await CustomerService.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              category: '$category',
              priority: '$priority'
            },
            count: { $sum: 1 },
            avgResolutionTime: { $avg: '$resolution.resolutionTime' },
            slaBreaches: {
              $sum: { $cond: ['$sla.breachedSLA', 1, 0] }
            }
          }
        }
      ]);

      // Chat analytics
      const chatStats = await LiveChat.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$metrics.duration' },
            avgWaitTime: { $avg: '$waitTime' },
            avgSatisfaction: { $avg: '$feedback.rating' }
          }
        }
      ]);

      // FAQ analytics
      const faqStats = await FAQ.aggregate([
        {
          $group: {
            _id: '$category',
            totalViews: { $sum: '$viewCount' },
            avgHelpfulness: { $avg: '$helpfulRatio' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          summary: {
            period: { start, end },
            totalTickets: ticketStats.reduce((sum, stat) => sum + stat.count, 0),
            totalChats: chatStats.reduce((sum, stat) => sum + stat.count, 0),
            totalFAQs: faqStats.reduce((sum, stat) => sum + stat.count, 0)
          },
          tickets: ticketStats,
          chats: chatStats,
          faqs: faqStats
        }
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching customer service analytics',
        error: error.message
      });
    }
  }

  // Helper methods

  getSLAHours(priority) {
    const slaMap = {
      'urgent': 4,
      'high': 8,
      'medium': 24,
      'low': 48
    };
    return slaMap[priority] || 24;
  }

  getCategoryTeam(category) {
    const teamMap = {
      'order_issue': 'general',
      'payment_problem': 'billing',
      'shipping_inquiry': 'shipping',
      'technical_support': 'technical',
      'product_question': 'general',
      'account_issue': 'general',
      'refund_request': 'billing'
    };
    return teamMap[category] || 'general';
  }

  getDepartmentQueue(department) {
    const queueMap = {
      'sales': 'general',
      'support': 'general',
      'technical': 'technical',
      'billing': 'billing'
    };
    return queueMap[department] || 'general';
  }

  async findBestAgent(category, storeId) {
    // Simplified agent assignment logic
    // In production, this would consider agent availability, workload, etc.
    const team = this.getCategoryTeam(category);
    
    const agent = await User.findOne({
      role: 'support_agent',
      'profile.team': team,
      isActive: true
    }).sort('profile.currentTickets');

    return agent;
  }

  async findAvailableAgent(department) {
    // Find available chat agent
    const agent = await User.findOne({
      role: 'support_agent',
      'profile.availableForChat': true,
      isActive: true
    }).sort('profile.currentChats');

    return agent;
  }

  async notifyAgent(agent, type, data = {}) {
    // Send notification to agent (WebSocket, email, etc.)
    console.log(`Notify agent ${agent._id || agent} about ${type}:`, data);
  }

  async notifyTicketParticipants(ticket, message) {
    // Send notifications to ticket participants
    console.log(`Notify participants about new message in ticket ${ticket.ticketNumber}`);
  }

  async notifyTicketUpdate(ticket) {
    // Send notifications about ticket updates
    console.log(`Notify about ticket update: ${ticket.ticketNumber}`);
  }

  async addToQueue(chatSession) {
    // Add chat session to queue
    console.log(`Added chat session ${chatSession.sessionId} to queue`);
  }

  async sendChatNotification(session, message) {
    // Send real-time chat notification
    console.log(`Send chat notification for session ${session.sessionId}`);
  }
}

module.exports = new CustomerServiceController();
