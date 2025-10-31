const {
  FAQ,
  FAQCategory,
  KnowledgeBase
} = require('../models/CustomerService');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class FAQManagementController {
  // FAQ Management

  // Create FAQ
  async createFAQ(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const faqData = {
        ...req.body,
        author: req.user._id
      };

      // Generate slug if not provided
      if (!faqData.slug && faqData.question) {
        faqData.slug = faqData.question
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      }

      const faq = new FAQ(faqData);
      await faq.save();

      // Populate references
      await faq.populate([
        { path: 'category', select: 'name slug' },
        { path: 'author', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        data: faq
      });

    } catch (error) {
      console.error('Error creating FAQ:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating FAQ',
        error: error.message
      });
    }
  }

  // Update FAQ
  async updateFAQ(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const faq = await FAQ.findById(id);

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      // Update fields
      Object.assign(faq, updates);
      faq.lastModifiedBy = req.user._id;
      faq.version += 1;

      await faq.save();

      // Populate references
      await faq.populate([
        { path: 'category', select: 'name slug' },
        { path: 'author', select: 'firstName lastName' },
        { path: 'lastModifiedBy', select: 'firstName lastName' }
      ]);

      res.json({
        success: true,
        message: 'FAQ updated successfully',
        data: faq
      });

    } catch (error) {
      console.error('Error updating FAQ:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating FAQ',
        error: error.message
      });
    }
  }

  // Delete FAQ
  async deleteFAQ(req, res) {
    try {
      const { id } = req.params;

      const faq = await FAQ.findByIdAndDelete(id);

      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ not found'
        });
      }

      res.json({
        success: true,
        message: 'FAQ deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting FAQ:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting FAQ',
        error: error.message
      });
    }
  }

  // FAQ Category Management

  // Create FAQ category
  async createFAQCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const categoryData = req.body;

      // Generate slug if not provided
      if (!categoryData.slug && categoryData.name) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      }

      const category = new FAQCategory(categoryData);
      await category.save();

      // Update parent category if specified
      if (category.parent) {
        await FAQCategory.findByIdAndUpdate(
          category.parent,
          { $addToSet: { children: category._id } }
        );
      }

      res.status(201).json({
        success: true,
        message: 'FAQ category created successfully',
        data: category
      });

    } catch (error) {
      console.error('Error creating FAQ category:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating FAQ category',
        error: error.message
      });
    }
  }

  // Update FAQ category
  async updateFAQCategory(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const category = await FAQCategory.findByIdAndUpdate(
        id,
        updates,
        { new: true }
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'FAQ category not found'
        });
      }

      res.json({
        success: true,
        message: 'FAQ category updated successfully',
        data: category
      });

    } catch (error) {
      console.error('Error updating FAQ category:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating FAQ category',
        error: error.message
      });
    }
  }

  // Knowledge Base Management

  // Get knowledge base articles
  async getKnowledgeBaseArticles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      let query = {};

      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { title: new RegExp(search, 'i') },
          { content: new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') }
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get articles
      const articles = await KnowledgeBase.find(query)
        .populate('category', 'name slug')
        .populate('author', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count
      const total = await KnowledgeBase.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          articles,
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
      console.error('Error fetching knowledge base articles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching knowledge base articles',
        error: error.message
      });
    }
  }

  // Create knowledge base article
  async createKnowledgeBaseArticle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const articleData = {
        ...req.body,
        author: req.user._id
      };

      // Generate slug if not provided
      if (!articleData.slug && articleData.title) {
        articleData.slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
      }

      const article = new KnowledgeBase(articleData);
      await article.save();

      // Populate references
      await article.populate([
        { path: 'category', select: 'name slug' },
        { path: 'author', select: 'firstName lastName' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Knowledge base article created successfully',
        data: article
      });

    } catch (error) {
      console.error('Error creating knowledge base article:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating knowledge base article',
        error: error.message
      });
    }
  }

  // Update knowledge base article
  async updateKnowledgeBaseArticle(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const article = await KnowledgeBase.findById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Knowledge base article not found'
        });
      }

      // Add to change log
      const oldVersion = article.version;
      const changeLogEntry = {
        version: oldVersion,
        changes: updates.changeDescription || 'Updated article',
        modifiedBy: req.user._id,
        modifiedAt: new Date()
      };

      article.changeLog.push(changeLogEntry);

      // Update fields
      Object.assign(article, updates);
      article.lastModifiedBy = req.user._id;
      article.version += 1;

      await article.save();

      // Populate references
      await article.populate([
        { path: 'category', select: 'name slug' },
        { path: 'author', select: 'firstName lastName' },
        { path: 'lastModifiedBy', select: 'firstName lastName' }
      ]);

      res.json({
        success: true,
        message: 'Knowledge base article updated successfully',
        data: article
      });

    } catch (error) {
      console.error('Error updating knowledge base article:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating knowledge base article',
        error: error.message
      });
    }
  }

  // Publish/unpublish knowledge base article
  async toggleArticleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const article = await KnowledgeBase.findById(id);

      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Knowledge base article not found'
        });
      }

      article.status = status;
      
      if (status === 'published') {
        article.publishedAt = new Date();
      }

      await article.save();

      res.json({
        success: true,
        message: `Article ${status} successfully`,
        data: article
      });

    } catch (error) {
      console.error('Error updating article status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating article status',
        error: error.message
      });
    }
  }

  // Get content analytics
  async getContentAnalytics(req, res) {
    try {
      const {
        startDate,
        endDate,
        type = 'all' // 'faq', 'kb', 'all'
      } = req.query;

      // Date range
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      let analytics = {};

      if (type === 'faq' || type === 'all') {
        // FAQ analytics
        const faqStats = await FAQ.aggregate([
          {
            $group: {
              _id: '$category',
              totalFAQs: { $sum: 1 },
              totalViews: { $sum: '$viewCount' },
              avgHelpfulness: { $avg: '$helpfulRatio' },
              publishedFAQs: {
                $sum: { $cond: ['$isPublished', 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'faqcategories',
              localField: '_id',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $unwind: '$category'
          },
          {
            $project: {
              categoryName: '$category.name',
              totalFAQs: 1,
              totalViews: 1,
              avgHelpfulness: 1,
              publishedFAQs: 1,
              publishRate: {
                $cond: [
                  { $gt: ['$totalFAQs', 0] },
                  { $divide: ['$publishedFAQs', '$totalFAQs'] },
                  0
                ]
              }
            }
          }
        ]);

        analytics.faq = faqStats;
      }

      if (type === 'kb' || type === 'all') {
        // Knowledge base analytics
        const kbStats = await KnowledgeBase.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: {
                category: '$category',
                status: '$status'
              },
              count: { $sum: 1 },
              totalViews: { $sum: '$viewCount' },
              avgRating: { $avg: '$averageRating' },
              totalLikes: { $sum: '$likes' }
            }
          },
          {
            $lookup: {
              from: 'faqcategories',
              localField: '_id.category',
              foreignField: '_id',
              as: 'category'
            }
          },
          {
            $unwind: '$category'
          },
          {
            $project: {
              categoryName: '$category.name',
              status: '$_id.status',
              count: 1,
              totalViews: 1,
              avgRating: 1,
              totalLikes: 1
            }
          }
        ]);

        analytics.knowledgeBase = kbStats;
      }

      // Category performance
      const categoryStats = await FAQCategory.aggregate([
        {
          $lookup: {
            from: 'faqs',
            localField: '_id',
            foreignField: 'category',
            as: 'faqs'
          }
        },
        {
          $lookup: {
            from: 'knowledgebases',
            localField: '_id',
            foreignField: 'category',
            as: 'articles'
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            faqCount: { $size: '$faqs' },
            articleCount: { $size: '$articles' },
            totalViews: { $add: [
              { $sum: '$faqs.viewCount' },
              { $sum: '$articles.viewCount' }
            ]},
            avgFAQHelpfulness: { $avg: '$faqs.helpfulRatio' },
            avgArticleRating: { $avg: '$articles.averageRating' }
          }
        },
        {
          $sort: { totalViews: -1 }
        }
      ]);

      analytics.categories = categoryStats;

      res.json({
        success: true,
        data: {
          period: { start, end },
          type,
          analytics
        }
      });

    } catch (error) {
      console.error('Error fetching content analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching content analytics',
        error: error.message
      });
    }
  }

  // Search content
  async searchContent(req, res) {
    try {
      const {
        query: searchQuery,
        type = 'all', // 'faq', 'kb', 'all'
        limit = 20
      } = req.query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchRegex = new RegExp(searchQuery, 'i');
      let results = {};

      if (type === 'faq' || type === 'all') {
        const faqResults = await FAQ.find({
          $or: [
            { question: searchRegex },
            { answer: searchRegex },
            { keywords: searchRegex }
          ],
          isPublished: true
        })
        .populate('category', 'name slug')
        .limit(parseInt(limit))
        .select('question answer slug viewCount helpfulRatio');

        results.faqs = faqResults;
      }

      if (type === 'kb' || type === 'all') {
        const kbResults = await KnowledgeBase.find({
          $or: [
            { title: searchRegex },
            { content: searchRegex },
            { summary: searchRegex },
            { tags: searchRegex }
          ],
          status: 'published'
        })
        .populate('category', 'name slug')
        .limit(parseInt(limit))
        .select('title summary slug viewCount averageRating estimatedReadTime');

        results.knowledgeBase = kbResults;
      }

      res.json({
        success: true,
        data: {
          query: searchQuery,
          results
        }
      });

    } catch (error) {
      console.error('Error searching content:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching content',
        error: error.message
      });
    }
  }
}

module.exports = new FAQManagementController();
