/**
 * CMS Controller - Firestore Migration
 * Handles CMS features: banners, pages, themes
 */

const {
  findDocuments,
  findById,
  findOne,
  createDocument,
  updateById,
  deleteById
} = require('../utils/firestoreHelpers');

class CMSController {
  // BANNERS
  async getBanners(req, res) {
    try {
      const { page = 1, limit = 20, status = 'active', placement } = req.query;

      const filters = {};
      if (status !== 'all') filters.status = status;
      if (placement) filters.placement = placement;

      const banners = await findDocuments('banners', filters, {
        limit: parseInt(limit),
        orderBy: 'order',
        direction: 'asc'
      });

      res.json({ success: true, data: { banners } });
    } catch (error) {
      console.error('Error fetching banners:', error);
      res.status(500).json({ success: false, message: 'Error fetching banners', error: error.message });
    }
  }

  async createBanner(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { title, image, link, placement, order, status, startDate, endDate } = req.body;

      const banner = await createDocument('banners', {
        title,
        image,
        link: link || '',
        placement: placement || 'home',
        order: order || 0,
        status: status || 'active',
        startDate: startDate || null,
        endDate: endDate || null,
        clicks: 0,
        impressions: 0
      });

      res.status(201).json({ success: true, message: 'Banner created successfully', data: { banner } });
    } catch (error) {
      console.error('Error creating banner:', error);
      res.status(500).json({ success: false, message: 'Error creating banner', error: error.message });
    }
  }

  async updateBanner(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      const banner = await findById('banners', id);

      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }

      const updatedBanner = await updateById('banners', id, req.body);
      res.json({ success: true, message: 'Banner updated successfully', data: { banner: updatedBanner } });
    } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).json({ success: false, message: 'Error updating banner', error: error.message });
    }
  }

  async deleteBanner(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      await deleteById('banners', id);
      res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
      console.error('Error deleting banner:', error);
      res.status(500).json({ success: false, message: 'Error deleting banner', error: error.message });
    }
  }

  // PAGES
  async getPages(req, res) {
    try {
      const { status = 'published' } = req.query;
      const filters = status !== 'all' ? { status } : {};

      const pages = await findDocuments('pages', filters, {
        orderBy: 'title',
        direction: 'asc'
      });

      res.json({ success: true, data: { pages } });
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ success: false, message: 'Error fetching pages', error: error.message });
    }
  }

  async getPage(req, res) {
    try {
      const { id } = req.params;
      let page = await findById('pages', id);
      
      if (!page) {
        page = await findOne('pages', { slug: id });
      }

      if (!page) {
        return res.status(404).json({ success: false, message: 'Page not found' });
      }

      res.json({ success: true, data: { page } });
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ success: false, message: 'Error fetching page', error: error.message });
    }
  }

  async createPage(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { title, content, slug, status, seo } = req.body;

      const page = await createDocument('pages', {
        title,
        content,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: status || 'draft',
        seo: seo || {},
        views: 0
      });

      res.status(201).json({ success: true, message: 'Page created successfully', data: { page } });
    } catch (error) {
      console.error('Error creating page:', error);
      res.status(500).json({ success: false, message: 'Error creating page', error: error.message });
    }
  }

  async updatePage(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      const updatedPage = await updateById('pages', id, req.body);
      res.json({ success: true, message: 'Page updated successfully', data: { page: updatedPage } });
    } catch (error) {
      console.error('Error updating page:', error);
      res.status(500).json({ success: false, message: 'Error updating page', error: error.message });
    }
  }

  async deletePage(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      await deleteById('pages', id);
      res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ success: false, message: 'Error deleting page', error: error.message });
    }
  }

  // THEMES
  async getThemes(req, res) {
    try {
      const themes = await findDocuments('themes', {}, {
        orderBy: 'name',
        direction: 'asc'
      });

      res.json({ success: true, data: { themes } });
    } catch (error) {
      console.error('Error fetching themes:', error);
      res.status(500).json({ success: false, message: 'Error fetching themes', error: error.message });
    }
  }

  async getActiveTheme(req, res) {
    try {
      const theme = await findOne('themes', { isActive: true });
      res.json({ success: true, data: { theme: theme || {} } });
    } catch (error) {
      console.error('Error fetching active theme:', error);
      res.status(500).json({ success: false, message: 'Error fetching active theme', error: error.message });
    }
  }

  async activateTheme(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;

      // Deactivate all themes
      const themes = await findDocuments('themes', {});
      for (let theme of themes) {
        if (theme.isActive) {
          await updateById('themes', theme.id, { isActive: false });
        }
      }

      // Activate selected theme
      await updateById('themes', id, { isActive: true });

      res.json({ success: true, message: 'Theme activated successfully' });
    } catch (error) {
      console.error('Error activating theme:', error);
      res.status(500).json({ success: false, message: 'Error activating theme', error: error.message });
    }
  }

  // Get single banner
  async getBanner(req, res) {
    try {
      const { id } = req.params;
      const banner = await findById('banners', id);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner not found' });
      }
      res.json({ success: true, data: { banner } });
    } catch (error) {
      console.error('Error fetching banner:', error);
      res.status(500).json({ success: false, message: 'Error fetching banner', error: error.message });
    }
  }

  // Get active banners (public)
  async getActiveBanners(req, res) {
    try {
      const { placement } = req.query;
      const filters = { status: 'active' };
      if (placement) filters.placement = placement;

      const now = new Date().toISOString();
      const banners = await findDocuments('banners', filters);
      
      // Filter by date range
      const activeBanners = banners.filter(b => 
        (!b.startDate || b.startDate <= now) && 
        (!b.endDate || b.endDate >= now)
      );

      res.json({ success: true, data: { banners: activeBanners, total: activeBanners.length } });
    } catch (error) {
      console.error('Error fetching active banners:', error);
      res.status(500).json({ success: false, message: 'Error fetching banners', error: error.message });
    }
  }

  // Record banner impression
  async recordImpression(req, res) {
    try {
      const { id } = req.params;
      await incrementField('banners', id, 'impressions', 1);
      res.json({ success: true, message: 'Impression recorded' });
    } catch (error) {
      console.error('Error recording impression:', error);
      res.status(500).json({ success: false, message: 'Error recording impression', error: error.message });
    }
  }

  // Record banner click
  async recordClick(req, res) {
    try {
      const { id } = req.params;
      await incrementField('banners', id, 'clicks', 1);
      res.json({ success: true, message: 'Click recorded' });
    } catch (error) {
      console.error('Error recording click:', error);
      res.status(500).json({ success: false, message: 'Error recording click', error: error.message });
    }
  }

  // Get page by slug
  async getPageBySlug(req, res) {
    try {
      const { slug } = req.params;
      const page = await findOne('pages', { slug });
      if (!page) {
        return res.status(404).json({ success: false, message: 'Page not found' });
      }
      
      // Increment view count
      await incrementField('pages', page.id, 'views', 1);
      
      res.json({ success: true, data: { page } });
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ success: false, message: 'Error fetching page', error: error.message });
    }
  }

  // Publish page
  async publishPage(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      await updateById('pages', id, { 
        status: 'published',
        publishedAt: new Date().toISOString()
      });

      res.json({ success: true, message: 'Page published successfully' });
    } catch (error) {
      console.error('Error publishing page:', error);
      res.status(500).json({ success: false, message: 'Error publishing page', error: error.message });
    }
  }

  // Get single theme
  async getTheme(req, res) {
    try {
      const { id } = req.params;
      const theme = await findById('themes', id);
      if (!theme) {
        return res.status(404).json({ success: false, message: 'Theme not found' });
      }
      res.json({ success: true, data: { theme } });
    } catch (error) {
      console.error('Error fetching theme:', error);
      res.status(500).json({ success: false, message: 'Error fetching theme', error: error.message });
    }
  }

  // Get theme CSS
  async getThemeCSS(req, res) {
    try {
      const { id } = req.params;
      const theme = await findById('themes', id);
      if (!theme) {
        return res.status(404).json({ success: false, message: 'Theme not found' });
      }
      
      // Generate CSS from theme config
      const css = this.generateThemeCSS(theme.config || {});
      res.type('text/css').send(css);
    } catch (error) {
      console.error('Error fetching theme CSS:', error);
      res.status(500).json({ success: false, message: 'Error fetching theme CSS', error: error.message });
    }
  }

  // Create theme
  async createTheme(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const themeData = {
        ...req.body,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const themeId = await createDocument('themes', themeData);
      const theme = await findById('themes', themeId);

      res.status(201).json({ success: true, data: { theme } });
    } catch (error) {
      console.error('Error creating theme:', error);
      res.status(500).json({ success: false, message: 'Error creating theme', error: error.message });
    }
  }

  // Update theme
  async updateTheme(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      await updateById('themes', id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });

      const theme = await findById('themes', id);
      res.json({ success: true, data: { theme } });
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(500).json({ success: false, message: 'Error updating theme', error: error.message });
    }
  }

  // Delete theme
  async deleteTheme(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const { id } = req.params;
      const theme = await findById('themes', id);
      
      if (theme && theme.isActive) {
        return res.status(400).json({ success: false, message: 'Cannot delete active theme' });
      }

      await deleteById('themes', id);
      res.json({ success: true, message: 'Theme deleted successfully' });
    } catch (error) {
      console.error('Error deleting theme:', error);
      res.status(500).json({ success: false, message: 'Error deleting theme', error: error.message });
    }
  }

  // Helper: Generate CSS from theme config
  generateThemeCSS(config) {
    const { colors = {}, fonts = {}, spacing = {} } = config;
    
    let css = ':root {\n';
    
    // Colors
    if (colors.primary) css += `  --color-primary: ${colors.primary};\n`;
    if (colors.secondary) css += `  --color-secondary: ${colors.secondary};\n`;
    if (colors.accent) css += `  --color-accent: ${colors.accent};\n`;
    if (colors.background) css += `  --color-background: ${colors.background};\n`;
    if (colors.text) css += `  --color-text: ${colors.text};\n`;
    
    // Fonts
    if (fonts.primary) css += `  --font-primary: ${fonts.primary};\n`;
    if (fonts.secondary) css += `  --font-secondary: ${fonts.secondary};\n`;
    
    // Spacing
    if (spacing.unit) css += `  --spacing-unit: ${spacing.unit};\n`;
    
    css += '}\n';
    return css;
  }
}

module.exports = new CMSController();
