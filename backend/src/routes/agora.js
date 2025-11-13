const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Agora Token Generation Routes
 */

// Generate RTC token for live streaming
router.post('/generate-token', async (req, res) => {
  try {
    const { channelName, uid = 0, role = 'publisher', expirationTime = 3600 } = req.body;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        message: 'Channel name is required',
      });
    }

    // Get Agora credentials from environment
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId) {
      return res.status(500).json({
        success: false,
        message: 'Agora App ID not configured',
      });
    }

    // If no certificate, return response without token (for testing)
    if (!appCertificate) {
      return res.json({
        success: true,
        data: {
          token: '', // Empty token for testing without certificate
          channelName,
          uid,
          appId,
          expirationTime,
        },
      });
    }

    // Determine role
    const agoraRole = role === 'publisher' 
      ? RtcRole.PUBLISHER 
      : RtcRole.SUBSCRIBER;

    // Calculate expiration timestamp
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTime;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      data: {
        token,
        channelName,
        uid,
        appId,
        expirationTime,
        expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message,
    });
  }
});

// Generate channel ID
router.get('/generate-channel-id', (req, res) => {
  try {
    const channelId = `live_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    res.json({
      success: true,
      data: {
        channelId,
      },
    });
  } catch (error) {
    console.error('Error generating channel ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate channel ID',
    });
  }
});

// Validate token
router.post('/validate-token', (req, res) => {
  try {
    const { token, channelName, uid } = req.body;

    if (!token || !channelName) {
      return res.status(400).json({
        success: false,
        message: 'Token and channel name are required',
      });
    }

    // In production, you would validate the token here
    // For now, just return success
    res.json({
      success: true,
      data: {
        valid: true,
        channelName,
        uid,
      },
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate token',
    });
  }
});

module.exports = router;
