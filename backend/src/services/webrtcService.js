const PKBattle = require('../models/PKBattle');
const MultiHostSession = require('../models/MultiHostSession');
const Livestream = require('../models/Livestream');
const User = require('../models/User');

/**
 * WebRTC Service
 * 
 * Handles WebRTC signaling, peer connections, and real-time
 * audio/video streaming for live broadcasts, PK battles, and multi-host sessions.
 */

class WebRTCService {
  /**
   * Create peer connection offer
   */
  static async createOffer(streamId, userId, offerSDP) {
    try {
      const stream = await Livestream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      // Store offer in temporary storage (Redis recommended for production)
      const offer = {
        streamId,
        userId,
        type: 'offer',
        sdp: offerSDP,
        timestamp: new Date()
      };
      
      return offer;
      
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }
  
  /**
   * Create peer connection answer
   */
  static async createAnswer(streamId, userId, answerSDP) {
    try {
      const stream = await Livestream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      const answer = {
        streamId,
        userId,
        type: 'answer',
        sdp: answerSDP,
        timestamp: new Date()
      };
      
      return answer;
      
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }
  
  /**
   * Handle ICE candidate
   */
  static async addICECandidate(streamId, userId, candidate) {
    try {
      // Store ICE candidate
      const iceCandidate = {
        streamId,
        userId,
        candidate,
        timestamp: new Date()
      };
      
      return iceCandidate;
      
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }
  
  /**
   * Start WebRTC stream
   */
  static async startWebRTCStream(streamId, userId, streamConfig) {
    try {
      const stream = await Livestream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      // Verify user is the stream owner
      if (stream.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to start this stream');
      }
      
      // Update stream with WebRTC configuration
      stream.streaming.protocol = 'webrtc';
      stream.streaming.rtcConfig = {
        iceServers: streamConfig.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        sdpSemantics: 'unified-plan'
      };
      
      await stream.save();
      
      return stream;
      
    } catch (error) {
      console.error('Error starting WebRTC stream:', error);
      throw error;
    }
  }
  
  /**
   * Join WebRTC stream as viewer
   */
  static async joinWebRTCStream(streamId, userId) {
    try {
      const stream = await Livestream.findById(streamId);
      
      if (!stream) {
        throw new Error('Stream not found');
      }
      
      if (stream.streaming.protocol !== 'webrtc') {
        throw new Error('Stream is not using WebRTC');
      }
      
      // Return stream configuration for viewer
      return {
        streamId: stream._id,
        rtcConfig: stream.streaming.rtcConfig,
        streamUrl: stream.streaming.streamUrl
      };
      
    } catch (error) {
      console.error('Error joining WebRTC stream:', error);
      throw error;
    }
  }
  
  /**
   * Setup PK Battle WebRTC
   */
  static async setupPKBattleWebRTC(battleId) {
    try {
      const battle = await PKBattle.findOne({ battleId })
        .populate('host1.stream')
        .populate('host2.stream');
      
      if (!battle) {
        throw new Error('Battle not found');
      }
      
      // Configure WebRTC for both streams
      const config = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        sdpSemantics: 'unified-plan',
        // Enable simulcast for better quality
        encodings: [
          { maxBitrate: 100000 },
          { maxBitrate: 300000 },
          { maxBitrate: 900000 }
        ]
      };
      
      return {
        battleId,
        host1Config: config,
        host2Config: config,
        layout: 'split-screen'
      };
      
    } catch (error) {
      console.error('Error setting up PK battle WebRTC:', error);
      throw error;
    }
  }
  
  /**
   * Setup Multi-Host WebRTC
   */
  static async setupMultiHostWebRTC(sessionId) {
    try {
      const session = await MultiHostSession.findOne({ sessionId })
        .populate('hosts.stream');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      const activeHosts = session.hosts.filter(h => h.status === 'joined');
      
      if (activeHosts.length > session.maxHosts) {
        throw new Error('Maximum number of hosts exceeded');
      }
      
      // Create mesh network configuration for multi-host
      const meshConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        sdpSemantics: 'unified-plan',
        // SFU (Selective Forwarding Unit) recommended for >4 hosts
        architecture: activeHosts.length > 4 ? 'sfu' : 'mesh',
        maxHosts: session.maxHosts
      };
      
      // Configure each host's peer connections
      const hostConfigs = activeHosts.map(host => ({
        userId: host.user,
        streamId: host.stream,
        position: host.position,
        settings: host.settings,
        peerConnections: activeHosts
          .filter(h => h.user.toString() !== host.user.toString())
          .map(peer => ({
            peerId: peer.user,
            role: peer.role
          }))
      }));
      
      return {
        sessionId,
        layout: session.layout,
        architecture: meshConfig.architecture,
        hosts: hostConfigs,
        config: meshConfig
      };
      
    } catch (error) {
      console.error('Error setting up multi-host WebRTC:', error);
      throw error;
    }
  }
  
  /**
   * Handle stream quality adaptation
   */
  static async adaptStreamQuality(streamId, userId, networkStats) {
    try {
      // Analyze network conditions
      const { bandwidth, latency, packetLoss } = networkStats;
      
      let recommendedQuality = 'high';
      
      if (bandwidth < 500000 || packetLoss > 5) {
        recommendedQuality = 'low';
      } else if (bandwidth < 1500000 || packetLoss > 2) {
        recommendedQuality = 'medium';
      }
      
      // Quality presets
      const qualityPresets = {
        low: {
          video: {
            width: 480,
            height: 360,
            frameRate: 15,
            bitrate: 300000
          },
          audio: {
            bitrate: 32000
          }
        },
        medium: {
          video: {
            width: 854,
            height: 480,
            frameRate: 24,
            bitrate: 800000
          },
          audio: {
            bitrate: 64000
          }
        },
        high: {
          video: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrate: 2000000
          },
          audio: {
            bitrate: 128000
          }
        }
      };
      
      return {
        recommendedQuality,
        settings: qualityPresets[recommendedQuality],
        networkStats
      };
      
    } catch (error) {
      console.error('Error adapting stream quality:', error);
      throw error;
    }
  }
  
  /**
   * Monitor connection health
   */
  static async monitorConnection(streamId, userId, connectionStats) {
    try {
      const {
        bytesReceived,
        bytesSent,
        packetsLost,
        jitter,
        roundTripTime
      } = connectionStats;
      
      // Calculate health score (0-100)
      let healthScore = 100;
      
      if (packetsLost > 0) {
        healthScore -= Math.min(packetsLost * 2, 40);
      }
      
      if (jitter > 30) {
        healthScore -= 20;
      }
      
      if (roundTripTime > 200) {
        healthScore -= 20;
      }
      
      const status = healthScore >= 80 ? 'excellent' :
                     healthScore >= 60 ? 'good' :
                     healthScore >= 40 ? 'fair' : 'poor';
      
      return {
        healthScore,
        status,
        stats: connectionStats,
        recommendations: healthScore < 60 ? [
          'Consider switching to a lower quality',
          'Check your network connection',
          'Close other bandwidth-intensive applications'
        ] : []
      };
      
    } catch (error) {
      console.error('Error monitoring connection:', error);
      throw error;
    }
  }
  
  /**
   * Handle connection recovery
   */
  static async handleConnectionRecovery(streamId, userId) {
    try {
      // Implement reconnection logic
      const reconnectionAttempt = {
        streamId,
        userId,
        timestamp: new Date(),
        status: 'reconnecting'
      };
      
      return reconnectionAttempt;
      
    } catch (error) {
      console.error('Error handling connection recovery:', error);
      throw error;
    }
  }
}

module.exports = WebRTCService;
