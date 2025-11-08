const express = require('express');
const router = express.Router();
const Currency = require('../models/Currency');
const { verifyJWT, requireAdmin } = require('../middleware/jwtAuth');

/**
 * Currencies Routes - MongoDB Implementation
 * Manage currencies and exchange rates
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Currencies API is working (MongoDB)',
    database: 'MongoDB'
  });
});

/**
 * @route   GET /api/currencies
 * @desc    Get all currencies (active only for public, all for admin)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    let query = {};
    if (!includeInactive || includeInactive === 'false') {
      query.isActive = true;
    }

    const currencies = await Currency.find(query)
      .sort({ isDefault: -1, code: 1 });

    res.json({
      success: true,
      data: { currencies }
    });

  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching currencies'
    });
  }
});

/**
 * @route   GET /api/currencies/default
 * @desc    Get default currency
 * @access  Public
 */
router.get('/default', async (req, res) => {
  try {
    const currency = await Currency.getDefault();

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'No default currency found'
      });
    }

    res.json({
      success: true,
      data: { currency }
    });

  } catch (error) {
    console.error('Get default currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching default currency'
    });
  }
});

/**
 * @route   GET /api/currencies/:code
 * @desc    Get currency by code
 * @access  Public
 */
router.get('/:code', async (req, res) => {
  try {
    const currency = await Currency.findOne({ 
      code: req.params.code.toUpperCase() 
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    res.json({
      success: true,
      data: { currency }
    });

  } catch (error) {
    console.error('Get currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching currency'
    });
  }
});

/**
 * @route   POST /api/currencies
 * @desc    Create new currency
 * @access  Admin
 */
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      code, 
      name, 
      symbol, 
      exchangeRate, 
      baseCurrency = 'USD',
      isActive = true,
      isDefault = false,
      decimalPlaces = 2,
      country,
      flag
    } = req.body;

    // Validation
    if (!code || !name || !symbol) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, and symbol are required'
      });
    }

    // Check if currency already exists
    const existing = await Currency.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Currency with this code already exists'
      });
    }

    const currency = new Currency({
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRate: exchangeRate || 1,
      baseCurrency,
      isActive,
      isDefault,
      decimalPlaces,
      country,
      flag
    });

    await currency.save();

    res.status(201).json({
      success: true,
      message: 'Currency created successfully',
      data: { currency }
    });

  } catch (error) {
    console.error('Create currency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating currency'
    });
  }
});

/**
 * @route   PUT /api/currencies/:code
 * @desc    Update currency
 * @access  Admin
 */
router.put('/:code', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      symbol, 
      exchangeRate, 
      baseCurrency,
      isActive,
      isDefault,
      decimalPlaces,
      country,
      flag
    } = req.body;

    const currency = await Currency.findOne({ 
      code: req.params.code.toUpperCase() 
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    // Update fields
    if (name) currency.name = name;
    if (symbol) currency.symbol = symbol;
    if (exchangeRate !== undefined) currency.exchangeRate = exchangeRate;
    if (baseCurrency) currency.baseCurrency = baseCurrency;
    if (isActive !== undefined) currency.isActive = isActive;
    if (isDefault !== undefined) currency.isDefault = isDefault;
    if (decimalPlaces !== undefined) currency.decimalPlaces = decimalPlaces;
    if (country) currency.country = country;
    if (flag) currency.flag = flag;

    currency.lastUpdated = new Date();

    await currency.save();

    res.json({
      success: true,
      message: 'Currency updated successfully',
      data: { currency }
    });

  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating currency'
    });
  }
});

/**
 * @route   DELETE /api/currencies/:code
 * @desc    Delete currency
 * @access  Admin
 */
router.delete('/:code', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const currency = await Currency.findOne({ 
      code: req.params.code.toUpperCase() 
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    if (currency.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default currency'
      });
    }

    await currency.deleteOne();

    res.json({
      success: true,
      message: 'Currency deleted successfully'
    });

  } catch (error) {
    console.error('Delete currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting currency'
    });
  }
});

/**
 * @route   PUT /api/currencies/:code/rate
 * @desc    Update exchange rate
 * @access  Admin
 */
router.put('/:code/rate', verifyJWT, requireAdmin, async (req, res) => {
  try {
    const { rate } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid exchange rate is required'
      });
    }

    const currency = await Currency.findOne({ 
      code: req.params.code.toUpperCase() 
    });

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }

    await currency.updateRate(rate);

    res.json({
      success: true,
      message: 'Exchange rate updated successfully',
      data: { currency }
    });

  } catch (error) {
    console.error('Update rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exchange rate'
    });
  }
});

module.exports = router;
