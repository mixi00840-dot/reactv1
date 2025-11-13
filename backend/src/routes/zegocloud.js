const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * ZegoCloud Token Generation Routes
 */

// Generate ZegoCloud token
router.post('/generate-token', async (req, res) => {
  try {
    const { roomID, userID = '', expirationTime = 7200 } = req.body;

    if (!roomID) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    // Get ZegoCloud credentials from environment
    const appID = parseInt(process.env.ZEGO_APP_ID || '0');
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appID) {
      return res.status(500).json({
        success: false,
        message: 'ZegoCloud App ID not configured',
      });
    }

    // If no server secret, return response without token (for testing)
    if (!serverSecret) {
      return res.json({
        success: true,
        data: {
          token: '', // Empty token for testing without secret
          roomID,
          userID,
          appID,
          expirationTime,
        },
      });
    }

    // Generate token using ZegoCloud algorithm
    const token = generateZegoToken(appID, userID, serverSecret, expirationTime);

    res.json({
      success: true,
      data: {
        token,
        roomID,
        userID,
        appID,
        expirationTime,
        expiresAt: new Date(Date.now() + expirationTime * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating ZegoCloud token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate token',
      error: error.message,
    });
  }
});

// Generate room ID
router.get('/generate-room-id', (req, res) => {
  try {
    const roomID = `room_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    res.json({
      success: true,
      data: {
        roomID,
      },
    });
  } catch (error) {
    console.error('Error generating room ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room ID',
    });
  }
});

// Validate token
router.post('/validate-token', (req, res) => {
  try {
    const { token, roomID, userID } = req.body;

    if (!token || !roomID) {
      return res.status(400).json({
        success: false,
        message: 'Token and room ID are required',
      });
    }

    // In production, you would validate the token here
    // For now, just return success
    res.json({
      success: true,
      data: {
        valid: true,
        roomID,
        userID,
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

/**
 * Generate ZegoCloud token
 * Algorithm based on ZegoCloud documentation
 */
function generateZegoToken(appID, userID, serverSecret, effectiveTimeInSeconds) {
  try {
    // Create nonce (random 16 bytes)
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Expiration timestamp
    const expiration = timestamp + effectiveTimeInSeconds;
    
    // Create payload
    const payload = {
      app_id: appID,
      user_id: userID,
      nonce: nonce,
      ctime: timestamp,
      expire: expiration,
    };
    
    // Convert payload to JSON
    const payloadString = JSON.stringify(payload);
    
    // Create signature
    const signature = crypto
      .createHmac('sha256', serverSecret)
      .update(payloadString)
      .digest('hex');
    
    // Create token object
    const tokenData = {
      ...payload,
      signature: signature,
    };
    
    // Encode to Base64
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    return token;
  } catch (error) {
    console.error('Error in generateZegoToken:', error);
    throw error;
  }
}

module.exports = router;
