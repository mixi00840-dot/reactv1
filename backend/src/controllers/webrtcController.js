const WebRTCService = require('../services/webrtcService');

/**
 * WebRTC Signaling Controller
 */

exports.createOffer = async (req, res) => {
  try {
    const { streamId, sdp } = req.body;
    
    const offer = await WebRTCService.createOffer(streamId, req.user._id, sdp);
    
    res.json({
      success: true,
      offer
    });
    
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const { streamId, sdp } = req.body;
    
    const answer = await WebRTCService.createAnswer(streamId, req.user._id, sdp);
    
    res.json({
      success: true,
      answer
    });
    
  } catch (error) {
    console.error('Error creating answer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.addICECandidate = async (req, res) => {
  try {
    const { streamId, candidate } = req.body;
    
    const iceCandidate = await WebRTCService.addICECandidate(
      streamId,
      req.user._id,
      candidate
    );
    
    res.json({
      success: true,
      candidate: iceCandidate
    });
    
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.startWebRTCStream = async (req, res) => {
  try {
    const { streamId, config } = req.body;
    
    const stream = await WebRTCService.startWebRTCStream(
      streamId,
      req.user._id,
      config
    );
    
    res.json({
      success: true,
      stream
    });
    
  } catch (error) {
    console.error('Error starting WebRTC stream:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.joinWebRTCStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    
    const streamConfig = await WebRTCService.joinWebRTCStream(
      streamId,
      req.user._id
    );
    
    res.json({
      success: true,
      config: streamConfig
    });
    
  } catch (error) {
    console.error('Error joining WebRTC stream:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.setupPKBattle = async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const config = await WebRTCService.setupPKBattleWebRTC(battleId);
    
    res.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Error setting up PK battle WebRTC:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.setupMultiHost = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const config = await WebRTCService.setupMultiHostWebRTC(sessionId);
    
    res.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Error setting up multi-host WebRTC:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.adaptQuality = async (req, res) => {
  try {
    const { streamId, networkStats } = req.body;
    
    const recommendation = await WebRTCService.adaptStreamQuality(
      streamId,
      req.user._id,
      networkStats
    );
    
    res.json({
      success: true,
      recommendation
    });
    
  } catch (error) {
    console.error('Error adapting quality:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.monitorConnection = async (req, res) => {
  try {
    const { streamId, connectionStats } = req.body;
    
    const health = await WebRTCService.monitorConnection(
      streamId,
      req.user._id,
      connectionStats
    );
    
    res.json({
      success: true,
      health
    });
    
  } catch (error) {
    console.error('Error monitoring connection:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
