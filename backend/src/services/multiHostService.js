const MultiHostSession = require('../models/MultiHostSession');
const LiveStream = require('../models/LiveStream');
const Notification = require('../models/Notification');

/**
 * Multi-Host Service
 * 
 * Handles collaborative live streaming with multiple hosts
 */

class MultiHostService {
  /**
   * Create multi-host session
   */
  static async createSession(primaryHostId, sessionType = 'co-host', maxHosts = 4) {
    try {
      const session = await MultiHostSession.create({
        primaryHost: primaryHostId,
        hosts: [{
          user: primaryHostId,
          role: 'primary',
          status: 'joined',
          joinedAt: new Date(),
          position: 0
        }],
        type: sessionType,
        maxHosts,
        status: 'pending'
      });
      
      await session.populate('primaryHost hosts.user', 'username avatar fullName');
      
      return session;
      
    } catch (error) {
      console.error('Error creating multi-host session:', error);
      throw error;
    }
  }
  
  /**
   * Start session
   */
  static async startSession(sessionId, userId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.primaryHost.toString() !== userId.toString()) {
        throw new Error('Only primary host can start session');
      }
      
      await session.startSession();
      
      // Notify all hosts
      if (io) {
        session.hosts.forEach(host => {
          if (host.status === 'joined') {
            io.to(`user_${host.user}`).emit('session:started', session);
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }
  
  /**
   * Invite user to session
   */
  static async inviteUser(sessionId, inviterId, inviteeId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Check permissions
      if (!session.permissions.hostCanInvite) {
        if (session.primaryHost.toString() !== inviterId.toString()) {
          throw new Error('Not authorized to invite');
        }
      }
      
      await session.inviteUser(inviteeId, inviterId);
      
      // Notify invitee
      await Notification.create({
        user: inviteeId,
        type: 'system',
        actor: inviterId,
        title: 'Multi-Host Invitation',
        body: 'You have been invited to join a live session!',
        actionUrl: `/session/${sessionId}`,
        priority: 'high'
      });
      
      if (io) {
        io.to(`user_${inviteeId}`).emit('session:invitation', {
          sessionId,
          inviter: inviterId
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }
  
  /**
   * Accept invitation
   */
  static async acceptInvitation(sessionId, userId, streamId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.acceptInvitation(userId);
      
      // Update stream reference
      const host = session.hosts.find(h => h.user.toString() === userId.toString());
      if (host) {
        host.stream = streamId;
        await session.save();
      }
      
      // Notify all hosts
      if (io) {
        session.hosts.forEach(h => {
          if (h.status === 'joined') {
            io.to(`user_${h.user}`).emit('session:host-joined', {
              sessionId,
              newHost: userId
            });
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }
  
  /**
   * Request to join
   */
  static async requestToJoin(sessionId, userId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (!session.permissions.anyoneCanRequest) {
        throw new Error('Join requests are not allowed');
      }
      
      // Check if already requested
      const existingRequest = session.requests.find(
        req => req.user.toString() === userId.toString() && req.status === 'pending'
      );
      
      if (existingRequest) {
        throw new Error('Request already pending');
      }
      
      session.requests.push({
        user: userId,
        requestedAt: new Date(),
        status: 'pending'
      });
      
      await session.save();
      
      // Notify primary host
      await Notification.create({
        user: session.primaryHost,
        type: 'system',
        actor: userId,
        title: 'Join Request',
        body: 'Someone wants to join your live session',
        actionUrl: `/session/${sessionId}`,
        priority: 'normal'
      });
      
      if (io) {
        io.to(`user_${session.primaryHost}`).emit('session:join-request', {
          sessionId,
          requester: userId
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error requesting to join:', error);
      throw error;
    }
  }
  
  /**
   * Approve join request
   */
  static async approveRequest(sessionId, primaryHostId, requesterId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.primaryHost.toString() !== primaryHostId.toString()) {
        throw new Error('Only primary host can approve requests');
      }
      
      const request = session.requests.find(
        req => req.user.toString() === requesterId.toString() && req.status === 'pending'
      );
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      request.status = 'approved';
      
      // Add to hosts
      await session.addHost(requesterId, 'co-host');
      
      // Notify requester
      await Notification.create({
        user: requesterId,
        type: 'system',
        title: 'Request Approved',
        body: 'Your request to join the session was approved!',
        actionUrl: `/session/${sessionId}`,
        priority: 'high'
      });
      
      if (io) {
        io.to(`user_${requesterId}`).emit('session:request-approved', {
          sessionId
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }
  
  /**
   * Remove host
   */
  static async removeHost(sessionId, primaryHostId, hostToRemove, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.primaryHost.toString() !== primaryHostId.toString()) {
        throw new Error('Only primary host can remove hosts');
      }
      
      await session.kickHost(hostToRemove);
      
      // Notify removed host
      if (io) {
        io.to(`user_${hostToRemove}`).emit('session:removed', {
          sessionId
        });
        
        // Notify other hosts
        session.hosts.forEach(h => {
          if (h.status === 'joined' && h.user.toString() !== hostToRemove.toString()) {
            io.to(`user_${h.user}`).emit('session:host-removed', {
              sessionId,
              removedHost: hostToRemove
            });
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error removing host:', error);
      throw error;
    }
  }
  
  /**
   * Update host settings
   */
  static async updateHostSettings(sessionId, userId, settings, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      await session.updateHostSettings(userId, settings);
      
      // Notify all hosts
      if (io) {
        session.hosts.forEach(h => {
          if (h.status === 'joined') {
            io.to(`user_${h.user}`).emit('session:settings-updated', {
              sessionId,
              userId,
              settings
            });
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error updating host settings:', error);
      throw error;
    }
  }
  
  /**
   * Change layout
   */
  static async changeLayout(sessionId, userId, layoutType, spotlightUser = null, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.primaryHost.toString() !== userId.toString()) {
        throw new Error('Only primary host can change layout');
      }
      
      await session.changeLayout(layoutType, spotlightUser);
      
      // Notify all hosts and viewers
      if (io) {
        io.to(`session_${sessionId}`).emit('session:layout-changed', {
          sessionId,
          layout: {
            type: layoutType,
            spotlightUser
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error changing layout:', error);
      throw error;
    }
  }
  
  /**
   * End session
   */
  static async endSession(sessionId, userId, io = null) {
    try {
      const session = await MultiHostSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      if (session.primaryHost.toString() !== userId.toString()) {
        throw new Error('Only primary host can end session');
      }
      
      await session.endSession();
      
      // Notify all hosts
      if (io) {
        session.hosts.forEach(h => {
          if (h.status === 'joined') {
            io.to(`user_${h.user}`).emit('session:ended', {
              sessionId
            });
          }
        });
      }
      
      return session;
      
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }
  
  /**
   * Get active sessions
   */
  static async getActiveSessions(limit = 20) {
    try {
      return await MultiHostSession.getActiveSessions(limit);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }
  
  /**
   * Get user sessions
   */
  static async getUserSessions(userId, status = null) {
    try {
      return await MultiHostSession.getUserSessions(userId, status);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }
}

module.exports = MultiHostService;
