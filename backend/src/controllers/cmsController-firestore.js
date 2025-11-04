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
}

module.exports = new CMSController();
