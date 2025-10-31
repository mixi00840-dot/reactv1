const MultiHostService = require('../services/multiHostService');

/**
 * Multi-Host Controller
 */

exports.createSession = async (req, res) => {
  try {
    const { type, maxHosts } = req.body;
    
    const session = await MultiHostService.createSession(
      req.user._id,
      type,
      maxHosts
    );
    
    res.status(201).json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.startSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await MultiHostService.startSession(
      sessionId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.inviteUser = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    const session = await MultiHostService.inviteUser(
      sessionId,
      req.user._id,
      userId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { streamId } = req.body;
    
    const session = await MultiHostService.acceptInvitation(
      sessionId,
      req.user._id,
      streamId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.requestToJoin = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await MultiHostService.requestToJoin(
      sessionId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error requesting to join:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    const session = await MultiHostService.approveRequest(
      sessionId,
      req.user._id,
      userId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.removeHost = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    
    const session = await MultiHostService.removeHost(
      sessionId,
      req.user._id,
      userId,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error removing host:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const settings = req.body;
    
    const session = await MultiHostService.updateHostSettings(
      sessionId,
      req.user._id,
      settings,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.changeLayout = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { layoutType, spotlightUser } = req.body;
    
    const session = await MultiHostService.changeLayout(
      sessionId,
      req.user._id,
      layoutType,
      spotlightUser,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error changing layout:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await MultiHostService.endSession(
      sessionId,
      req.user._id,
      req.app.get('io')
    );
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const MultiHostSession = require('../models/MultiHostSession');
    const session = await MultiHostSession.findOne({ sessionId })
      .populate('primaryHost hosts.user', 'username avatar fullName');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session
    });
    
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveSessions = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const sessions = await MultiHostService.getActiveSessions(parseInt(limit));
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;
    
    const sessions = await MultiHostService.getUserSessions(userId, status);
    
    res.json({
      success: true,
      sessions
    });
    
  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
