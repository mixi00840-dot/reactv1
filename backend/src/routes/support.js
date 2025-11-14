const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

// ===========================
// ADMIN ROUTES - TICKETS
// ===========================

// Get all tickets
router.get('/admin/support/tickets', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      category, 
      assignedTo,
      search,
      page = 1, 
      limit = 20,
      sortBy = '-createdAt'
    } = req.query;
    
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const tickets = await Ticket.find(query)
      .populate('userId', 'username email avatar')
      .populate('assignedTo', 'username email')
      .populate('replies.userId', 'username avatar')
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Ticket.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get support analytics
router.get('/admin/support/analytics', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const [ticketStats, faqStats] = await Promise.all([
      Ticket.aggregate([
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            openTickets: { 
              $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'waiting']] }, 1, 0] }
            },
            resolvedTickets: { 
              $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
            }
          }
        }
      ]),
      FAQ.aggregate([
        {
          $group: {
            _id: null,
            totalFAQs: { $sum: 1 },
            publishedFAQs: { $sum: { $cond: ['$isPublished', 1, 0] } },
            totalViews: { $sum: '$views' }
          }
        }
      ])
    ]);
    
    // Calculate average response time
    const resolvedTickets = await Ticket.find({ 
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');
    
    let avgResponseTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        return sum + (ticket.resolvedAt - ticket.createdAt);
      }, 0);
      avgResponseTime = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // hours
    }
    
    const tickets = ticketStats[0] || { totalTickets: 0, openTickets: 0, resolvedTickets: 0 };
    const faqs = faqStats[0] || { totalFAQs: 0, publishedFAQs: 0, totalViews: 0 };
    
    res.json({
      success: true,
      data: {
        ...tickets,
        ...faqs,
        avgResponseTime
      }
    });
  } catch (error) {
    console.error('Error fetching support analytics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create ticket
router.post('/admin/support/tickets', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { userId, subject, description, category, priority, assignedTo } = req.body;
    
    if (!userId || !subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId, subject, and description are required' 
      });
    }
    
    const ticket = new Ticket({
      userId,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      assignedTo,
      status: 'open'
    });
    
    await ticket.save();
    await ticket.populate('userId', 'username email avatar');
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update ticket
router.put('/admin/support/tickets/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { status, priority, category, assignedTo } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    if (status) {
      ticket.status = status;
      if (status === 'resolved') ticket.resolvedAt = new Date();
      if (status === 'closed') ticket.closedAt = new Date();
    }
    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    
    await ticket.save();
    await ticket.populate(['userId', 'assignedTo']);
    
    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Reply to ticket
router.post('/admin/support/tickets/:id/reply', verifyJWT, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required' 
      });
    }
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    ticket.replies.push({
      userId: req.user._id,
      message,
      isStaff: req.user.role === 'admin',
      createdAt: new Date()
    });
    
    // Update status if it was open
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
    
    await ticket.save();
    await ticket.populate(['userId', 'assignedTo', 'replies.userId']);
    
    res.json({
      success: true,
      message: 'Reply added successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Close ticket
router.patch('/admin/support/tickets/:id/close', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Ticket closed successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete ticket
router.delete('/admin/support/tickets/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================
// ADMIN ROUTES - FAQ
// ===========================

// Get all FAQs
router.get('/admin/support/faq', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { category, published, page = 1, limit = 50, sortBy = 'order' } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (published !== undefined) query.isPublished = published === 'true';
    
    const skip = (page - 1) * limit;
    
    const faqs = await FAQ.find(query)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email')
      .sort(sortBy === 'order' ? { order: 1, createdAt: -1 } : sortBy)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await FAQ.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        faqs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create FAQ
router.post(['/admin/support/faq', '/support/faq'], verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { question, answer, category, isPublished, order } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question and answer are required' 
      });
    }
    
    const faq = new FAQ({
      question,
      answer,
      category: category || 'general',
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order !== undefined ? order : 0,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    
    await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update FAQ
router.put(['/admin/support/faq/:id', '/support/faq/:id'], verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { question, answer, category, isPublished, order } = req.body;
    
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (category) faq.category = category;
    if (isPublished !== undefined) faq.isPublished = isPublished;
    if (order !== undefined) faq.order = order;
    faq.updatedBy = req.user._id;
    
    await faq.save();
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Delete FAQ
router.delete(['/admin/support/faq/:id', '/support/faq/:id'], verifyJWT, requireAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Toggle FAQ published status
router.patch(['/admin/support/faq/:id/toggle', '/support/faq/:id/toggle'], verifyJWT, requireAdmin, async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    faq.isPublished = !faq.isPublished;
    await faq.save();
    
    res.json({
      success: true,
      message: `FAQ ${faq.isPublished ? 'published' : 'unpublished'}`,
      data: faq
    });
  } catch (error) {
    console.error('Error toggling FAQ:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================
// PUBLIC ROUTES
// ===========================

// Get published FAQs (public)
router.get('/support/faq', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    const query = { isPublished: true };
    if (category) query.category = category;
    
    const faqs = await FAQ.find(query)
      .select('-createdBy -updatedBy -helpful -notHelpful -views')
      .sort('order -createdAt')
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: { faqs }
    });
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Create ticket (public - authenticated users)
router.post('/support/tickets', verifyJWT, async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    
    if (!subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and description are required' 
      });
    }
    
    const ticket = new Ticket({
      userId: req.user._id,
      subject,
      description,
      category: category || 'other',
      priority: 'medium',
      status: 'open'
    });
    
    await ticket.save();
    
    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { ticketNumber: ticket.ticketNumber }
    });
  } catch (error) {
    console.error('Error creating public ticket:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get user's tickets (public - authenticated users)
router.get('/support/tickets/my', verifyJWT, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .populate('replies.userId', 'username avatar')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: { tickets }
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
