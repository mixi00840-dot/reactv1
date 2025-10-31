const ContentRights = require('../models/ContentRights');
const RightsManagementService = require('../services/rightsManagementService');
const Content = require('../models/Content');
const Sound = require('../models/Sound');

/**
 * @desc Scan content for copyrighted audio
 * @route POST /api/rights/scan/:contentId
 * @access Private (Creator/Admin)
 */
exports.scanContent = async (req, res) => {
  try {
    const result = await RightsManagementService.scanContent(req.params.contentId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Bulk scan multiple contents
 * @route POST /api/rights/scan/bulk
 * @access Private (Admin)
 */
exports.bulkScan = async (req, res) => {
  try {
    const { contentIds, batchSize } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'contentIds array required'
      });
    }
    
    const result = await RightsManagementService.bulkScan(contentIds, { batchSize });
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get rights status for content
 * @route GET /api/rights/:contentId
 * @access Private
 */
exports.getRights = async (req, res) => {
  try {
    const rights = await ContentRights.findOne({ content: req.params.contentId })
      .populate('detectedMusic.soundId', 'title artist')
      .populate('content', 'title creator views');
    
    if (!rights) {
      return res.status(404).json({
        success: false,
        message: 'Rights record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get batch rights status
 * @route POST /api/rights/batch/status
 * @access Private
 */
exports.getBatchStatus = async (req, res) => {
  try {
    const { contentIds } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'contentIds array required'
      });
    }
    
    const statusMap = await RightsManagementService.getBatchStatus(contentIds);
    
    res.status(200).json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc File copyright claim manually
 * @route POST /api/rights/:contentId/claim
 * @access Private (Admin/Rights Holder)
 */
exports.fileClaim = async (req, res) => {
  try {
    let rights = await ContentRights.findOne({ content: req.params.contentId });
    
    if (!rights) {
      rights = new ContentRights({
        content: req.params.contentId,
        status: 'claimed'
      });
    }
    
    const claimData = {
      rightsHolder: req.body.rightsHolder,
      claimedMusic: req.body.claimedMusic,
      claimType: req.body.claimType,
      action: req.body.action,
      rightsHolderPercentage: req.body.rightsHolderPercentage,
      creatorPercentage: req.body.creatorPercentage,
      territories: req.body.territories,
      automated: false
    };
    
    const claim = await rights.addClaim(claimData);
    
    res.status(201).json({
      success: true,
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get pending claims for review
 * @route GET /api/rights/claims/pending
 * @access Private (Admin)
 */
exports.getPendingClaims = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const claims = await ContentRights.getPendingClaims(limit);
    
    res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc File dispute against claim
 * @route POST /api/rights/:contentId/dispute/:claimId
 * @access Private (Creator)
 */
exports.fileDispute = async (req, res) => {
  try {
    const rights = await ContentRights.findOne({ content: req.params.contentId });
    
    if (!rights) {
      return res.status(404).json({
        success: false,
        message: 'Rights record not found'
      });
    }
    
    const disputeData = {
      disputedBy: req.user._id,
      reason: req.body.reason,
      explanation: req.body.explanation,
      supportingDocuments: req.body.supportingDocuments
    };
    
    const dispute = await rights.fileDispute(req.params.claimId, disputeData);
    
    res.status(201).json({
      success: true,
      data: dispute
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get active disputes
 * @route GET /api/rights/disputes
 * @access Private (Admin)
 */
exports.getDisputes = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const disputes = await ContentRights.getActiveDisputes(status);
    
    res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Resolve dispute
 * @route POST /api/rights/disputes/:disputeId/resolve
 * @access Private (Admin)
 */
exports.resolveDispute = async (req, res) => {
  try {
    const rights = await ContentRights.findOne({
      'disputes.disputeId': req.params.disputeId
    });
    
    if (!rights) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }
    
    const resolution = {
      upheld: req.body.upheld,
      decision: req.body.decision,
      reason: req.body.reason,
      decidedBy: req.user._id
    };
    
    const dispute = await rights.resolveDispute(req.params.disputeId, resolution);
    
    res.status(200).json({
      success: true,
      data: dispute
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Calculate royalties for content
 * @route POST /api/rights/:contentId/royalties
 * @access Private (Admin)
 */
exports.calculateRoyalties = async (req, res) => {
  try {
    const { views, revenue } = req.body;
    
    const distribution = await RightsManagementService.calculateRoyalties(
      req.params.contentId,
      views,
      revenue
    );
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get royalty report for rights holder
 * @route GET /api/rights/royalties/report/:rightsHolderId
 * @access Private (Admin/Rights Holder)
 */
exports.getRoyaltyReport = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    const report = await ContentRights.getRoyaltyReport(
      req.params.rightsHolderId,
      startDate,
      endDate
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Process batch royalty payouts
 * @route POST /api/rights/royalties/payout/:rightsHolderId
 * @access Private (Admin)
 */
exports.processPayout = async (req, res) => {
  try {
    const { period } = req.body;
    
    const result = await RightsManagementService.processBatchPayouts(
      req.params.rightsHolderId,
      period
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Validate music license
 * @route POST /api/rights/validate-license
 * @access Private
 */
exports.validateLicense = async (req, res) => {
  try {
    const { contentId, soundId } = req.body;
    
    if (!contentId || !soundId) {
      return res.status(400).json({
        success: false,
        message: 'contentId and soundId required'
      });
    }
    
    const validation = await RightsManagementService.validateLicense(contentId, soundId);
    
    res.status(200).json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc Get creator's content rights summary
 * @route GET /api/rights/creator/:creatorId/summary
 * @access Private (Creator/Admin)
 */
exports.getCreatorSummary = async (req, res) => {
  try {
    // Get all content by creator
    const content = await Content.find({ creator: req.params.creatorId })
      .select('_id');
    
    const contentIds = content.map(c => c._id);
    
    // Get rights for all content
    const rights = await ContentRights.find({
      content: { $in: contentIds }
    });
    
    const summary = {
      totalContent: contentIds.length,
      scanned: rights.length,
      pendingScan: contentIds.length - rights.length,
      clear: 0,
      claimed: 0,
      blocked: 0,
      monetizedShared: 0,
      totalClaims: 0,
      totalDisputes: 0,
      activeStrikes: 0
    };
    
    for (const right of rights) {
      if (right.status === 'clear') summary.clear++;
      if (right.status === 'claimed') summary.claimed++;
      if (right.status === 'blocked') summary.blocked++;
      if (right.status === 'monetized_shared') summary.monetizedShared++;
      
      summary.totalClaims += right.claims.length;
      summary.totalDisputes += right.disputes.length;
      summary.activeStrikes += right.enforcement.strikes;
    }
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
