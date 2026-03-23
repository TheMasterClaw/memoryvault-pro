const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const router = express.Router();

// In-memory storage (use Redis/database in production)
const pendingRegistrations = new Map();
const verifiedEmails = new Map();
const agentSessions = new Map();

// Rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, error: 'Too many registration attempts' }
});

// Email transporter (configure with your SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * @route POST /api/agents/register/initiate
 * @desc Initiate agent registration with email
 */
router.post('/register/initiate', registerLimiter, async (req, res) => {
  try {
    const { email, agentName, capabilities, publicKey } = req.body;
    
    // Validation
    if (!email || !agentName || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, agentName, publicKey'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Generate email hash
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    
    // Check if email already registered
    // In production, check the blockchain
    
    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const registrationId = crypto.randomUUID();
    
    // Store pending registration
    pendingRegistrations.set(registrationId, {
      email,
      emailHash,
      agentName,
      capabilities: capabilities || [],
      publicKey,
      verificationCode,
      createdAt: Date.now(),
      attempts: 0
    });
    
    // Send verification email
    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: '"MemoryVault" <noreply@memoryvault.xyz>',
        to: email,
        subject: 'Verify Your Agent Registration',
        html: `
          <h2>Agent Registration Verification</h2>
          <p>Your verification code is: <strong>${verificationCode}</strong></p>
          <p>This code expires in 15 minutes.</p>
          <p>Registration ID: ${registrationId}</p>
        `
      });
    }
    
    // Return registration ID (code sent via email in production)
    res.json({
      success: true,
      registrationId,
      message: 'Verification code sent to email',
      // In development, return the code
      ...(process.env.NODE_ENV === 'development' && { verificationCode })
    });
    
  } catch (error) {
    console.error('Registration initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate registration'
    });
  }
});

/**
 * @route POST /api/agents/register/verify
 * @desc Verify email and complete agent registration
 */
router.post('/register/verify', async (req, res) => {
  try {
    const { registrationId, verificationCode, metadata } = req.body;
    
    if (!registrationId || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing registrationId or verificationCode'
      });
    }
    
    // Get pending registration
    const pending = pendingRegistrations.get(registrationId);
    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or expired'
      });
    }
    
    // Check expiration (15 minutes)
    if (Date.now() - pending.createdAt > 15 * 60 * 1000) {
      pendingRegistrations.delete(registrationId);
      return res.status(400).json({
        success: false,
        error: 'Verification code expired'
      });
    }
    
    // Verify code
    if (pending.verificationCode !== verificationCode) {
      pending.attempts++;
      if (pending.attempts >= 3) {
        pendingRegistrations.delete(registrationId);
        return res.status(400).json({
          success: false,
          error: 'Too many failed attempts. Please start over.'
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        attemptsRemaining: 3 - pending.attempts
      });
    }
    
    // Generate participant ID (ERC-8004 style)
    const participantId = '0x' + crypto.createHash('sha256')
      .update(pending.emailHash + pending.publicKey + Date.now())
      .digest('hex');
    
    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // In production: Call AgentRegistry contract
    // const tx = await agentRegistry.registerAgent(...)
    
    // Store agent data
    const agentData = {
      participantId,
      email: pending.email,
      emailHash: pending.emailHash,
      agentName: pending.agentName,
      capabilities: pending.capabilities,
      publicKey: pending.publicKey,
      metadata: metadata || {},
      apiKeyHash,
      registeredAt: new Date().toISOString(),
      isActive: true
    };
    
    // Store in verified agents
    verifiedEmails.set(pending.emailHash, agentData);
    
    // Clean up pending registration
    pendingRegistrations.delete(registrationId);
    
    // Return credentials
    res.json({
      success: true,
      message: 'Agent registered successfully',
      agent: {
        participantId,
        agentName: pending.agentName,
        email: pending.email,
        capabilities: pending.capabilities
      },
      credentials: {
        apiKey,
        participantId
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete registration'
    });
  }
});

/**
 * @route POST /api/agents/auth
 * @desc Authenticate agent with API key
 */
router.post('/auth', async (req, res) => {
  try {
    const { participantId, apiKey } = req.body;
    
    if (!participantId || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing participantId or apiKey'
      });
    }
    
    // Find agent
    let agent = null;
    for (const [hash, data] of verifiedEmails) {
      if (data.participantId === participantId) {
        agent = data;
        break;
      }
    }
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Verify API key
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    if (agent.apiKeyHash !== apiKeyHash) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // Generate JWT
    const token = jwt.sign(
      {
        participantId: agent.participantId,
        agentName: agent.agentName,
        type: 'agent'
      },
      process.env.JWT_SECRET || 'memoryvault-dev-secret',
      { expiresIn: '7d' }
    );
    
    // Update last active
    agent.lastActive = new Date().toISOString();
    
    res.json({
      success: true,
      token,
      agent: {
        participantId: agent.participantId,
        agentName: agent.agentName,
        capabilities: agent.capabilities
      }
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

/**
 * @route POST /api/agents/rotate-key
 * @desc Rotate API key
 */
router.post('/rotate-key', async (req, res) => {
  try {
    const { participantId, currentApiKey } = req.body;
    
    // Verify current key
    let agent = null;
    let emailHash = null;
    for (const [hash, data] of verifiedEmails) {
      if (data.participantId === participantId) {
        agent = data;
        emailHash = hash;
        break;
      }
    }
    
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const currentKeyHash = crypto.createHash('sha256').update(currentApiKey).digest('hex');
    if (agent.apiKeyHash !== currentKeyHash) {
      return res.status(401).json({ success: false, error: 'Invalid current API key' });
    }
    
    // Generate new key
    const newApiKey = crypto.randomBytes(32).toString('hex');
    agent.apiKeyHash = crypto.createHash('sha256').update(newApiKey).digest('hex');
    
    res.json({
      success: true,
      message: 'API key rotated successfully',
      newApiKey
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to rotate key' });
  }
});

/**
 * @route GET /api/agents/profile
 * @desc Get agent profile
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing token' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'memoryvault-dev-secret');
    
    let agent = null;
    for (const [hash, data] of verifiedEmails) {
      if (data.participantId === decoded.participantId) {
        agent = data;
        break;
      }
    }
    
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      agent: {
        participantId: agent.participantId,
        agentName: agent.agentName,
        email: agent.email,
        capabilities: agent.capabilities,
        registeredAt: agent.registeredAt,
        isActive: agent.isActive
      }
    });
    
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

/**
 * @route GET /api/agents/discover
 * @desc Discover agents by capability
 */
router.get('/discover', async (req, res) => {
  try {
    const { capability } = req.query;
    
    const agents = [];
    for (const [hash, data] of verifiedEmails) {
      if (data.isActive) {
        if (!capability || data.capabilities.includes(capability)) {
          agents.push({
            participantId: data.participantId,
            agentName: data.agentName,
            capabilities: data.capabilities,
            registeredAt: data.registeredAt
          });
        }
      }
    }
    
    res.json({
      success: true,
      count: agents.length,
      agents
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to discover agents' });
  }
});

/**
 * @route POST /api/agents/session/initiate
 * @desc Initiate multi-agent session
 */
router.post('/session/initiate', async (req, res) => {
  try {
    const { coordinatorId, participantIds, purpose, ttl } = req.body;
    
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      coordinatorId,
      participantIds: [coordinatorId, ...participantIds],
      purpose: purpose || 'Collaboration',
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || 3600) * 1000, // Default 1 hour
      messages: []
    };
    
    agentSessions.set(sessionId, session);
    
    res.json({
      success: true,
      sessionId,
      participants: session.participantIds,
      expiresAt: session.expiresAt
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

module.exports = router;
