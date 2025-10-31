const { Banner } = require('../models/Banner');
const { Page } = require('../models/Page');
const { Theme } = require('../models/Theme');
const { AuditLog } = require('../models/AuditLog');

// ==================== BANNERS ====================

exports.getBanners = async (req, res) => {
  try {
    const { status, placement, type, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (placement) query.placement = placement;
    if (type) query.type = type;
    
    const skip = (page - 1) * limit;
    
    const banners = await Banner.find(query)
      .populate('createdBy', 'fullName')
      .sort({ priority: -1, position: 1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Banner.countDocuments(query);
    
    res.json({
      success: true,
      data: banners,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
  }
};

exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate('createdBy lastModifiedBy', 'fullName');
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banner', error: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const banner = await Banner.create({ ...req.body, createdBy: req.user._id });
    
    await AuditLog.logChange({
      entityType: 'banner',
      entityId: banner._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created banner: ${banner.title}`,
      severity: 'low'
    });
    
    res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create banner', error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    Object.assign(banner, req.body, { lastModifiedBy: req.user._id });
    await banner.save();
    
    await AuditLog.logChange({
      entityType: 'banner',
      entityId: banner._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated banner: ${banner.title}`,
      severity: 'low'
    });
    
    res.json({ success: true, message: 'Banner updated successfully', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    await banner.deleteOne();
    
    await AuditLog.logChange({
      entityType: 'banner',
      entityId: banner._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted banner: ${banner.title}`,
      severity: 'medium',
      snapshot: banner.toObject()
    });
    
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
  }
};

exports.getActiveBanners = async (req, res) => {
  try {
    const { placement, device, userType, language } = req.query;
    const banners = await Banner.getActiveForPlacement(placement, { device, userType, language });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active banners', error: error.message });
  }
};

exports.recordImpression = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    await banner.recordImpression();
    res.json({ success: true, message: 'Impression recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record impression', error: error.message });
  }
};

exports.recordClick = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    await banner.recordClick();
    res.json({ success: true, message: 'Click recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to record click', error: error.message });
  }
};

// ==================== PAGES ====================

exports.getPages = async (req, res) => {
  try {
    const { status, type, featured, search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (featured) query.featured = featured === 'true';
    if (search) query.$or = [{ title: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }];
    
    const skip = (page - 1) * limit;
    
    const pages = await Page.find(query)
      .populate('createdBy', 'fullName')
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Page.countDocuments(query);
    
    res.json({
      success: true,
      data: pages,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pages', error: error.message });
  }
};

exports.getPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('createdBy lastModifiedBy', 'fullName')
      .populate('parentPage', 'title slug');
    
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch page', error: error.message });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.getBySlug(req.params.slug, req.query.preview === 'true');
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    
    // Record view (check if unique by IP or session)
    await page.recordView(true);
    
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch page', error: error.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const page = await Page.create({ ...req.body, createdBy: req.user._id });
    
    await AuditLog.logChange({
      entityType: 'page',
      entityId: page._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created page: ${page.title}`,
      severity: 'low'
    });
    
    res.status(201).json({ success: true, message: 'Page created successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create page', error: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    
    // Save version before update
    if (req.body.saveVersion) {
      await page.saveVersion(req.user._id, req.body.versionNote);
    }
    
    Object.assign(page, req.body, { lastModifiedBy: req.user._id });
    await page.save();
    
    await AuditLog.logChange({
      entityType: 'page',
      entityId: page._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated page: ${page.title}`,
      severity: 'low'
    });
    
    res.json({ success: true, message: 'Page updated successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update page', error: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    
    await page.deleteOne();
    
    await AuditLog.logChange({
      entityType: 'page',
      entityId: page._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted page: ${page.title}`,
      severity: 'medium',
      snapshot: page.toObject()
    });
    
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete page', error: error.message });
  }
};

exports.publishPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    
    await page.publish(req.user._id);
    res.json({ success: true, message: 'Page published successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to publish page', error: error.message });
  }
};

// ==================== THEMES ====================

exports.getThemes = async (req, res) => {
  try {
    const { status, category } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const themes = await Theme.find(query)
      .populate('createdBy', 'fullName')
      .sort({ isDefault: -1, createdAt: -1 });
    
    res.json({ success: true, data: themes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch themes', error: error.message });
  }
};

exports.getTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id).populate('createdBy lastModifiedBy', 'fullName');
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    res.json({ success: true, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch theme', error: error.message });
  }
};

exports.getActiveTheme = async (req, res) => {
  try {
    const theme = await Theme.getActive();
    res.json({ success: true, data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active theme', error: error.message });
  }
};

exports.createTheme = async (req, res) => {
  try {
    const theme = await Theme.create({ ...req.body, createdBy: req.user._id });
    
    await AuditLog.logChange({
      entityType: 'theme',
      entityId: theme._id,
      action: 'create',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Created theme: ${theme.displayName}`,
      severity: 'low'
    });
    
    res.status(201).json({ success: true, message: 'Theme created successfully', data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create theme', error: error.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    
    Object.assign(theme, req.body, { lastModifiedBy: req.user._id });
    await theme.save();
    
    await AuditLog.logChange({
      entityType: 'theme',
      entityId: theme._id,
      action: 'update',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Updated theme: ${theme.displayName}`,
      severity: 'low'
    });
    
    res.json({ success: true, message: 'Theme updated successfully', data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update theme', error: error.message });
  }
};

exports.deleteTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    
    if (theme.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default theme' });
    }
    
    await theme.deleteOne();
    
    await AuditLog.logChange({
      entityType: 'theme',
      entityId: theme._id,
      action: 'delete',
      userId: req.user._id,
      userName: req.user.fullName,
      description: `Deleted theme: ${theme.displayName}`,
      severity: 'medium',
      snapshot: theme.toObject()
    });
    
    res.json({ success: true, message: 'Theme deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete theme', error: error.message });
  }
};

exports.activateTheme = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    
    await theme.activate();
    res.json({ success: true, message: 'Theme activated successfully', data: theme });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate theme', error: error.message });
  }
};

exports.getThemeCSS = async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) return res.status(404).json({ success: false, message: 'Theme not found' });
    
    const css = theme.generateCSS();
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate CSS', error: error.message });
  }
};
