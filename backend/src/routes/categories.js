const express = require('express');
const router = express.Router();
const { Category } = require('../models/Category');
const { authMiddleware } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      status = 'all',
      parentId,
      level,
      sort = '-createdAt',
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (parentId === 'null' || parentId === null) {
      query.parent = null;
    } else if (parentId && parentId !== 'all') {
      query.parent = parentId;
    }

    if (level) {
      query.level = parseInt(level);
    }

    // Get categories with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('children', 'name slug status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get category tree (hierarchical structure)
router.get('/tree', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const categories = await Category.find(query)
      .populate('children')
      .sort('sortOrder name')
      .lean();

    // Build tree structure
    const buildTree = (parentId = null) => {
      return categories
        .filter(cat => String(cat.parent) === String(parentId))
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id)
        }));
    };

    const tree = buildTree();

    res.json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree',
      error: error.message
    });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug status')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

// Create new category (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      slug,
      parent,
      icon,
      image,
      seo,
      attributeFields,
      status = 'active',
      sortOrder = 0
    } = req.body;

    // Check if slug already exists
    if (slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }
    }

    // Calculate level based on parent
    let level = 0;
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      level = parentCategory.level + 1;
    }

    const category = new Category({
      name,
      description,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parent: parent || null,
      level,
      icon,
      image,
      seo,
      attributeFields: attributeFields || [],
      status,
      sortOrder
    });

    await category.save();

    // Update parent's children array
    if (parent) {
      await Category.findByIdAndUpdate(
        parent,
        { $addToSet: { children: category._id } }
      );
    }

    const populatedCategory = await Category.findById(category._id)
      .populate('parent', 'name slug')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedCategory,
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// Update category (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      slug,
      parent,
      icon,
      image,
      seo,
      attributeFields,
      status,
      sortOrder
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        slug, 
        _id: { $ne: req.params.id } 
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists'
        });
      }
    }

    // Handle parent change
    const oldParent = category.parent;
    let level = category.level;
    
    if (parent !== oldParent) {
      // Remove from old parent
      if (oldParent) {
        await Category.findByIdAndUpdate(
          oldParent,
          { $pull: { children: category._id } }
        );
      }

      // Add to new parent
      if (parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found'
          });
        }
        level = parentCategory.level + 1;
        await Category.findByIdAndUpdate(
          parent,
          { $addToSet: { children: category._id } }
        );
      } else {
        level = 0;
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name || category.name,
        description: description || category.description,
        slug: slug || category.slug,
        parent: parent !== undefined ? parent : category.parent,
        level,
        icon: icon || category.icon,
        image: image || category.image,
        seo: seo || category.seo,
        attributeFields: attributeFields || category.attributeFields,
        status: status || category.status,
        sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('parent', 'name slug');

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories'
      });
    }

    // Remove from parent's children array
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { children: category._id } }
      );
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// Bulk update categories (admin only)
router.patch('/bulk', authMiddleware, async (req, res) => {
  try {
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs are required'
      });
    }

    await Category.updateMany(
      { _id: { $in: ids } },
      { 
        ...updates,
        updatedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${ids.length} categories updated successfully`
    });

  } catch (error) {
    console.error('Error bulk updating categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update categories',
      error: error.message
    });
  }
});

module.exports = router;