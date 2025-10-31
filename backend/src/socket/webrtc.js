const webrtcService = require('../services/webrtcService');
const LiveStream = require('../models/LiveStream');
const PKBattle = require('../models/PKBattle');
const MultiHostSession = require('../models/MultiHostSession');

/**
 * WebRTC Socket.io Handlers
 * Handles real-time peer-to-peer connections for advanced streaming
 */

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`WebRTC client connected: ${socket.id}`);
    
    // Join WebRTC room
    socket.on('webrtc:join-room', async ({ roomId, userId, streamId }) => {
      try {
        socket.join(`webrtc:${roomId}`);
        socket.webrtcRoom = roomId;
        socket.webrtcUserId = userId;
        socket.webrtcStreamId = streamId;
        
        // Notify others in the room
        socket.to(`webrtc:${roomId}`).emit('webrtc:peer-joined', {
          peerId: socket.id,
          userId,
          streamId
        });
        
        // Get existing peers in room
        const sockets = await io.in(`webrtc:${roomId}`).fetchSockets();
        const peers = sockets
          .filter(s => s.id !== socket.id)
          .map(s => ({
            peerId: s.id,
            userId: s.webrtcUserId,
            streamId: s.webrtcStreamId
          }));
        
        socket.emit('webrtc:existing-peers', { peers });
        
      } catch (error) {
        console.error('Error joining WebRTC room:', error);
        socket.emit('webrtc:error', { message: 'Failed to join room' });
      }
    });
    
    // Leave WebRTC room
    socket.on('webrtc:leave-room', ({ roomId }) => {
      if (socket.webrtcRoom) {
        socket.to(`webrtc:${socket.webrtcRoom}`).emit('webrtc:peer-left', {
          peerId: socket.id,
          userId: socket.webrtcUserId
        });
        socket.leave(`webrtc:${socket.webrtcRoom}`);
        socket.webrtcRoom = null;
        socket.webrtcUserId = null;
        socket.webrtcStreamId = null;
      }
    });
    
    // WebRTC Offer
    socket.on('webrtc:offer', async ({ targetPeerId, offer, streamId }) => {
      try {
        const result = await webrtcService.createOffer(streamId, offer);
        
        // Send offer to target peer
        io.to(targetPeerId).emit('webrtc:offer', {
          fromPeerId: socket.id,
          offer: result.offer,
          streamId
        });
        
      } catch (error) {
        console.error('Error creating WebRTC offer:', error);
        socket.emit('webrtc:error', { message: 'Failed to create offer' });
      }
    });
    
    // WebRTC Answer
    socket.on('webrtc:answer', async ({ targetPeerId, answer, streamId }) => {
      try {
        const result = await webrtcService.createAnswer(streamId, answer);
        
        // Send answer to target peer
        io.to(targetPeerId).emit('webrtc:answer', {
          fromPeerId: socket.id,
          answer: result.answer,
          streamId
        });
        
      } catch (error) {
        console.error('Error creating WebRTC answer:', error);
        socket.emit('webrtc:error', { message: 'Failed to create answer' });
      }
    });
    
    // ICE Candidate
    socket.on('webrtc:ice-candidate', async ({ targetPeerId, candidate, streamId }) => {
      try {
        await webrtcService.addICECandidate(streamId, candidate);
        
        // Send ICE candidate to target peer
        io.to(targetPeerId).emit('webrtc:ice-candidate', {
          fromPeerId: socket.id,
          candidate,
          streamId
        });
        
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
        socket.emit('webrtc:error', { message: 'Failed to add ICE candidate' });
      }
    });
    
    // Start PK Battle Stream
    socket.on('webrtc:start-pk-battle', async ({ battleId, userId }) => {
      try {
        const battle = await PKBattle.findOne({ battleId }).populate('host1.host host2.host');
        if (!battle) {
          return socket.emit('webrtc:error', { message: 'Battle not found' });
        }
        
        // Join battle room
        socket.join(`pk-battle:${battleId}`);
        
        // Setup WebRTC for PK battle
        const setup = await webrtcService.setupPKBattleWebRTC(battleId);
        
        // Notify both hosts
        io.to(`pk-battle:${battleId}`).emit('webrtc:pk-battle-ready', {
          battleId,
          iceServers: setup.iceServers,
          host1StreamId: battle.host1.stream,
          host2StreamId: battle.host2.stream
        });
        
      } catch (error) {
        console.error('Error starting PK battle stream:', error);
        socket.emit('webrtc:error', { message: 'Failed to start PK battle' });
      }
    });
    
    // Start Multi-Host Stream
    socket.on('webrtc:start-multihost', async ({ sessionId, userId }) => {
      try {
        const session = await MultiHostSession.findOne({ sessionId })
          .populate('primaryHost hosts.user');
        
        if (!session) {
          return socket.emit('webrtc:error', { message: 'Session not found' });
        }
        
        // Join multi-host room
        socket.join(`multihost:${sessionId}`);
        
        // Setup WebRTC for multi-host
        const setup = await webrtcService.setupMultiHostWebRTC(sessionId);
        
        // Get all host stream IDs
        const hostStreams = session.hosts.map(h => ({
          userId: h.user._id,
          streamId: h.stream,
          position: h.position
        }));
        
        // Notify all hosts
        io.to(`multihost:${sessionId}`).emit('webrtc:multihost-ready', {
          sessionId,
          iceServers: setup.iceServers,
          hosts: hostStreams,
          layout: session.settings.layout,
          networkType: setup.networkType
        });
        
      } catch (error) {
        console.error('Error starting multi-host stream:', error);
        socket.emit('webrtc:error', { message: 'Failed to start multi-host' });
      }
    });
    
    // Quality Adaptation Request
    socket.on('webrtc:adapt-quality', async ({ streamId, networkConditions }) => {
      try {
        const result = await webrtcService.adaptStreamQuality(streamId, networkConditions);
        
        // Notify peer to adjust quality
        socket.emit('webrtc:quality-adapted', {
          streamId,
          quality: result.quality,
          settings: result.settings
        });
        
        // Notify room about quality change
        if (socket.webrtcRoom) {
          socket.to(`webrtc:${socket.webrtcRoom}`).emit('webrtc:peer-quality-changed', {
            peerId: socket.id,
            quality: result.quality
          });
        }
        
      } catch (error) {
        console.error('Error adapting quality:', error);
        socket.emit('webrtc:error', { message: 'Failed to adapt quality' });
      }
    });
    
    // Connection Health Monitoring
    socket.on('webrtc:health-check', async ({ streamId, stats }) => {
      try {
        const health = await webrtcService.monitorConnection(streamId, stats);
        
        socket.emit('webrtc:health-status', {
          streamId,
          health: health.health,
          recommendations: health.recommendations
        });
        
        // If health is critical, notify about issues
        if (health.health.overall === 'poor' || health.health.overall === 'critical') {
          socket.emit('webrtc:connection-warning', {
            severity: health.health.overall,
            issues: health.recommendations
          });
        }
        
      } catch (error) {
        console.error('Error checking connection health:', error);
      }
    });
    
    // Network stats update
    socket.on('webrtc:stats-update', ({ streamId, stats }) => {
      // Broadcast stats to room for monitoring
      if (socket.webrtcRoom) {
        socket.to(`webrtc:${socket.webrtcRoom}`).emit('webrtc:peer-stats', {
          peerId: socket.id,
          streamId,
          stats: {
            bitrate: stats.bitrate,
            packetLoss: stats.packetLoss,
            latency: stats.latency,
            fps: stats.fps
          }
        });
      }
    });
    
    // Toggle audio/video in multi-host
    socket.on('webrtc:toggle-track', async ({ sessionId, trackType, enabled }) => {
      try {
        const session = await MultiHostSession.findOne({ sessionId });
        if (!session) {
          return socket.emit('webrtc:error', { message: 'Session not found' });
        }
        
        // Update host settings
        const hostIndex = session.hosts.findIndex(
          h => h.user.toString() === socket.webrtcUserId
        );
        
        if (hostIndex !== -1) {
          if (trackType === 'audio') {
            session.hosts[hostIndex].audioEnabled = enabled;
          } else if (trackType === 'video') {
            session.hosts[hostIndex].videoEnabled = enabled;
          }
          await session.save();
          
          // Notify all participants
          io.to(`multihost:${sessionId}`).emit('webrtc:track-toggled', {
            userId: socket.webrtcUserId,
            trackType,
            enabled
          });
        }
        
      } catch (error) {
        console.error('Error toggling track:', error);
        socket.emit('webrtc:error', { message: 'Failed to toggle track' });
      }
    });
    
    // Layout change in multi-host
    socket.on('webrtc:change-layout', async ({ sessionId, layout }) => {
      try {
        const session = await MultiHostSession.findOne({ sessionId });
        if (!session) {
          return socket.emit('webrtc:error', { message: 'Session not found' });
        }
        
        // Only primary host can change layout
        if (session.primaryHost.toString() !== socket.webrtcUserId) {
          return socket.emit('webrtc:error', { message: 'Only primary host can change layout' });
        }
        
        session.settings.layout = layout;
        await session.save();
        
        // Notify all participants
        io.to(`multihost:${sessionId}`).emit('webrtc:layout-changed', {
          layout,
          positions: session.hosts.map(h => ({
            userId: h.user,
            position: h.position
          }))
        });
        
      } catch (error) {
        console.error('Error changing layout:', error);
        socket.emit('webrtc:error', { message: 'Failed to change layout' });
      }
    });
    
    // Renegotiation needed
    socket.on('webrtc:renegotiate', ({ targetPeerId, streamId }) => {
      io.to(targetPeerId).emit('webrtc:renegotiation-needed', {
        fromPeerId: socket.id,
        streamId
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`WebRTC client disconnected: ${socket.id}`);
      
      // Notify room about peer leaving
      if (socket.webrtcRoom) {
        socket.to(`webrtc:${socket.webrtcRoom}`).emit('webrtc:peer-left', {
          peerId: socket.id,
          userId: socket.webrtcUserId
        });
      }
    });
  });
};
