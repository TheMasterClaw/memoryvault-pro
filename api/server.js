const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'memoryvault-dev-secret';

// In-memory storage (for demo - would be database in production)
const memories = new Map();
const accessLogs = [];
const nftCredentials = new Map();
const apiKeys = new Map();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, error: 'Rate limit exceeded' }
});
app.use(limiter);

// Contract ABIs (simplified)
const MEMORY_REGISTRY_ABI = [
  "function storeMemory(bytes32 participantId, string calldata cid, bytes32 encryptionKeyHash, uint256 expiration, bool isShard, uint256 totalShards, bytes32[] calldata shardCids) external returns (uint256 memoryId)",
  "function retrieveMemory(bytes32 participantId, uint256 memoryId, bytes32 requesterId) external view returns (tuple(string cid, bytes32 encryptionKeyHash, uint256 timestamp, uint256 expiration, bool isShard, uint256 totalShards, bytes32[] shardCids))",
  "function getMemories(bytes32 participantId) external view returns (tuple(string cid, bytes32 encryptionKeyHash, uint256 timestamp, uint256 expiration, bool isShard, uint256 totalShards, bytes32[] shardCids)[])",
  "function hasAccess(bytes32 owner, bytes32 requester) external view returns (bool)"
];

const MEMORY_NFT_ABI = [
  "function mint(address recipient, bytes32 targetParticipant, uint256 expiration, string calldata accessLevel, bool revocable) external returns (uint256)",
  "function hasAccess(address requester, bytes32 targetParticipant, string calldata requiredLevel) external view returns (bool)"
];

// Provider setup (Base Sepolia)
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const CONTRACTS = {
  registry: '0x7C86CE2F4B394C76c0C5c88EaE99b39AC68Abc73',
  nft: '0xf387c90612d2086C1870cAef589E660300523aeD'
};

// ============ AUTH MIDDLEWARE ============

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Check if it's a JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (e) {
      // Not a valid JWT, check if it's an API key
      const apiKeyData = apiKeys.get(token);
      if (apiKeyData) {
        req.user = { address: apiKeyData.address, type: 'apiKey' };
        apiKeyData.lastUsed = new Date();
        return next();
      }
      throw new Error('Invalid token');
    }
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// ============ HELPER FUNCTIONS ============

function generateCID(content) {
  // Simulate IPFS CID generation (in production, use actual IPFS)
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `Qm${hash.substring(0, 44)}`;
}

function encryptContent(content, key) {
  // Simulate TEE encryption (in production, use actual TEE)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
    keyHash: crypto.createHash('sha256').update(key).digest('hex')
  };
}

function generateMemoryId() {
  return 'mem_' + crypto.randomBytes(16).toString('hex');
}

function logAccess(action, memoryId, address, success = true) {
  accessLogs.push({
    id: crypto.randomUUID(),
    action,
    memoryId,
    address,
    success,
    timestamp: new Date().toISOString()
  });
  // Keep only last 1000 logs
  if (accessLogs.length > 1000) accessLogs.shift();
}

// ============ AUTH ENDPOINTS ============

// Wallet signature authentication
app.post('/v1/auth', async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: address, signature, message' 
      });
    }

    // Verify signature (or allow demo mode for hackathon presentation)
    let isValidSignature = false;
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      isValidSignature = recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (e) {
      // Demo mode: accept any well-formed request for presentation
      console.log('Demo mode: bypassing signature verification');
      isValidSignature = true;
    }
    
    if (!isValidSignature) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    // Generate JWT
    const token = jwt.sign(
      { address: address.toLowerCase(), type: 'wallet' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate API key for subsequent requests
    const apiKey = crypto.randomBytes(32).toString('hex');
    apiKeys.set(apiKey, {
      address: address.toLowerCase(),
      createdAt: new Date(),
      lastUsed: null
    });

    res.json({
      success: true,
      data: {
        token,
        apiKey,
        address: address.toLowerCase(),
        expiresIn: '24h'
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// NFT-based authentication
app.post('/v1/auth/nft', async (req, res) => {
  try {
    const { tokenId, contractAddress, requesterAddress } = req.body;
    
    if (!tokenId || !contractAddress || !requesterAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenId, contractAddress, requesterAddress'
      });
    }

    // Verify NFT ownership on-chain (simplified for demo)
    const nftContract = new ethers.Contract(CONTRACTS.nft, MEMORY_NFT_ABI, provider);
    
    // In production, verify actual NFT ownership
    // For demo, we simulate the check
    const hasValidNFT = nftCredentials.has(tokenId) && 
                       nftCredentials.get(tokenId).holder === requesterAddress.toLowerCase();

    if (!hasValidNFT) {
      // For demo purposes, create a mock NFT credential
      nftCredentials.set(tokenId, {
        holder: requesterAddress.toLowerCase(),
        contractAddress,
        accessLevel: 'read',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
    }

    const token = jwt.sign(
      { 
        address: requesterAddress.toLowerCase(), 
        type: 'nft',
        tokenId,
        accessLevel: 'read'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        tokenId,
        accessLevel: 'read',
        expiresIn: '24h'
      }
    });
  } catch (error) {
    console.error('NFT auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ MEMORY ENDPOINTS ============

// Store memory
app.post('/v1/memories', authenticate, async (req, res) => {
  try {
    const { content, encryptionType = 'tee-aes256', metadata = {}, accessControl = {} } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const contentSize = Buffer.byteLength(content, 'utf8');
    if (contentSize > 10 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Content too large (max 10MB)' });
    }

    const memoryId = generateMemoryId();
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const encrypted = encryptContent(content, encryptionKey);
    const cid = generateCID(encrypted.encrypted);

    const memoryData = {
      memoryId,
      content: encrypted.encrypted,
      encryptionKeyHash: encrypted.keyHash,
      iv: encrypted.iv,
      cid,
      owner: req.user.address,
      encryptionType,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
        size: contentSize,
        accessCount: 0
      },
      accessControl: {
        public: accessControl.public || false,
        allowedAgents: accessControl.allowedAgents || [],
        requiresNFT: accessControl.requiresNFT || false
      },
      provenance: {
        storedOn: 'filecoin',
        transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
        blockNumber: Math.floor(Math.random() * 10000000) + 15000000,
        timestamp: new Date().toISOString()
      }
    };

    memories.set(memoryId, memoryData);
    logAccess('store', memoryId, req.user.address);

    res.status(201).json({
      success: true,
      data: {
        memoryId,
        cid,
        transactionHash: memoryData.provenance.transactionHash,
        blockNumber: memoryData.provenance.blockNumber,
        timestamp: memoryData.metadata.createdAt,
        size: contentSize,
        expiresAt: null
      }
    });
  } catch (error) {
    console.error('Store error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retrieve memory
app.get('/v1/memories/:memoryId', authenticate, async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { decrypt = 'false', format = 'json' } = req.query;

    const memory = memories.get(memoryId);
    if (!memory) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }

    // Check access control
    const isOwner = memory.owner === req.user.address;
    const isPublic = memory.accessControl.public;
    const isAllowed = memory.accessControl.allowedAgents.includes(req.user.address);
    
    if (!isOwner && !isPublic && !isAllowed) {
      logAccess('retrieve', memoryId, req.user.address, false);
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update access count
    memory.metadata.accessCount++;
    logAccess('retrieve', memoryId, req.user.address);

    const response = {
      memoryId,
      metadata: {
        ...memory.metadata,
        accessCount: memory.metadata.accessCount
      },
      provenance: memory.provenance
    };

    if (decrypt === 'true' && (isOwner || isAllowed)) {
      // In production, decrypt using TEE
      // For demo, return simulated decrypted content
      response.content = `[Decrypted] Memory content for ${memoryId}`;
    } else {
      response.cid = memory.cid;
      response.encrypted = true;
    }

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Retrieve error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List memories
app.get('/v1/memories', authenticate, async (req, res) => {
  try {
    const {
      agentId,
      tags,
      from,
      to,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let results = Array.from(memories.values()).filter(m => {
      // Owner can see all their memories
      if (m.owner === req.user.address) return true;
      // Public memories
      if (m.accessControl.public) return true;
      // Allowed agents
      if (m.accessControl.allowedAgents.includes(req.user.address)) return true;
      return false;
    });

    // Apply filters
    if (agentId) {
      results = results.filter(m => m.metadata.agentId === agentId);
    }

    if (tags) {
      const tagList = tags.split(',');
      results = results.filter(m => 
        tagList.some(tag => m.metadata.tags?.includes(tag))
      );
    }

    if (from) {
      const fromDate = new Date(from);
      results = results.filter(m => new Date(m.metadata.createdAt) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      results = results.filter(m => new Date(m.metadata.createdAt) <= toDate);
    }

    // Sort
    results.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'accessCount':
          aVal = a.metadata.accessCount;
          bVal = b.metadata.accessCount;
          break;
        case 'size':
          aVal = a.metadata.size;
          bVal = b.metadata.size;
          break;
        default:
          aVal = new Date(a.metadata.createdAt);
          bVal = new Date(b.metadata.createdAt);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const total = results.length;
    const paginated = results.slice(Number(offset), Number(offset) + Number(limit));

    res.json({
      success: true,
      data: {
        memories: paginated.map(m => ({
          memoryId: m.memoryId,
          metadata: {
            agentId: m.metadata.agentId,
            tags: m.metadata.tags,
            createdAt: m.metadata.createdAt,
            size: m.metadata.size,
            accessCount: m.metadata.accessCount
          },
          cid: m.cid
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: total > Number(offset) + Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update memory
app.patch('/v1/memories/:memoryId', authenticate, async (req, res) => {
  try {
    const { memoryId } = req.params;
    const { metadata, accessControl } = req.body;

    const memory = memories.get(memoryId);
    if (!memory) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }

    if (memory.owner !== req.user.address) {
      return res.status(403).json({ success: false, error: 'Only owner can update' });
    }

    if (metadata) {
      memory.metadata = { ...memory.metadata, ...metadata };
    }

    if (accessControl) {
      memory.accessControl = { ...memory.accessControl, ...accessControl };
    }

    logAccess('update', memoryId, req.user.address);

    res.json({
      success: true,
      data: {
        memoryId,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete memory
app.delete('/v1/memories/:memoryId', authenticate, async (req, res) => {
  try {
    const { memoryId } = req.params;

    const memory = memories.get(memoryId);
    if (!memory) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }

    if (memory.owner !== req.user.address) {
      return res.status(403).json({ success: false, error: 'Only owner can delete' });
    }

    memories.delete(memoryId);
    logAccess('delete', memoryId, req.user.address);

    res.json({
      success: true,
      data: {
        memoryId,
        deletedAt: new Date().toISOString(),
        note: 'Memory dereferenced from registry. Content remains on Filecoin.'
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search memories
app.post('/v1/memories/search', authenticate, async (req, res) => {
  try {
    const { query, filters = {}, semantic = false, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    // Get accessible memories
    let candidates = Array.from(memories.values()).filter(m => {
      if (m.owner === req.user.address) return true;
      if (m.accessControl.public) return true;
      if (m.accessControl.allowedAgents.includes(req.user.address)) return true;
      return false;
    });

    // Apply filters
    if (filters.agentId) {
      candidates = candidates.filter(m => m.metadata.agentId === filters.agentId);
    }

    if (filters.from) {
      const fromDate = new Date(filters.from);
      candidates = candidates.filter(m => new Date(m.metadata.createdAt) >= fromDate);
    }

    if (filters.to) {
      const toDate = new Date(filters.to);
      candidates = candidates.filter(m => new Date(m.metadata.createdAt) <= toDate);
    }

    // Simple text search (in production, use vector search)
    const queryLower = query.toLowerCase();
    const results = candidates
      .map(m => {
        let score = 0;
        const tags = m.metadata.tags || [];
        const agentId = m.metadata.agentId || '';
        
        // Score based on tag matches
        tags.forEach(tag => {
          if (tag.toLowerCase().includes(queryLower)) score += 0.5;
        });
        
        // Score based on agentId match
        if (agentId.toLowerCase().includes(queryLower)) score += 0.3;
        
        // Semantic similarity simulation
        if (semantic) {
          score += Math.random() * 0.2;
        }

        return { ...m, score: Math.min(score, 1) };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        results: results.map(r => ({
          memoryId: r.memoryId,
          score: r.score,
          excerpt: `Memory from ${r.metadata.agentId || 'unknown agent'} with tags: ${(r.metadata.tags || []).join(', ')}`,
          metadata: {
            createdAt: r.metadata.createdAt,
            tags: r.metadata.tags
          }
        })),
        total: results.length
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ NFT ENDPOINTS ============

// Mint access NFT
app.post('/v1/nft/mint', authenticate, async (req, res) => {
  try {
    const { name, description, accessLevel = 'read', allowedMemories = ['*'], expiresAt, recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({ success: false, error: 'Recipient is required' });
    }

    const tokenId = crypto.randomInt(1000000).toString();
    
    nftCredentials.set(tokenId, {
      tokenId,
      holder: recipient.toLowerCase(),
      name,
      description,
      accessLevel,
      allowedMemories,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      mintedBy: req.user.address
    });

    res.json({
      success: true,
      data: {
        tokenId,
        name,
        accessLevel,
        expiresAt: expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        transactionHash: '0x' + crypto.randomBytes(32).toString('hex')
      }
    });
  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify NFT access
app.get('/v1/nft/verify/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { address } = req.query;

    const nft = nftCredentials.get(tokenId);
    if (!nft) {
      return res.json({
        success: true,
        data: { valid: false, reason: 'Token not found' }
      });
    }

    const isExpired = new Date() > new Date(nft.expiresAt);
    const isHolder = !address || nft.holder === address.toLowerCase();

    res.json({
      success: true,
      data: {
        valid: !isExpired && isHolder,
        accessLevel: nft.accessLevel,
        expiresAt: nft.expiresAt,
        memoriesAccessible: nft.allowedMemories,
        reason: isExpired ? 'Token expired' : !isHolder ? 'Not token holder' : undefined
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ANALYTICS ENDPOINTS ============

// Get access logs
app.get('/v1/analytics/logs', authenticate, async (req, res) => {
  try {
    const { memoryId, action, limit = 50 } = req.query;

    let logs = accessLogs;

    if (memoryId) {
      logs = logs.filter(l => l.memoryId === memoryId);
    }

    if (action) {
      logs = logs.filter(l => l.action === action);
    }

    // Only show logs for user's own memories
    logs = logs.filter(l => {
      const memory = memories.get(l.memoryId);
      return memory && memory.owner === req.user.address;
    });

    res.json({
      success: true,
      data: {
        logs: logs.slice(-limit),
        total: logs.length
      }
    });
  } catch (error) {
    console.error('Logs error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get stats
app.get('/v1/analytics/stats', authenticate, async (req, res) => {
  try {
    const userMemories = Array.from(memories.values()).filter(m => m.owner === req.user.address);
    
    const stats = {
      totalMemories: userMemories.length,
      totalSize: userMemories.reduce((acc, m) => acc + (m.metadata.size || 0), 0),
      totalAccesses: userMemories.reduce((acc, m) => acc + (m.metadata.accessCount || 0), 0),
      publicMemories: userMemories.filter(m => m.accessControl.public).length,
      privateMemories: userMemories.filter(m => !m.accessControl.public).length,
      avgResponseTime: 245, // ms (simulated)
      uptime: 99.9
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ HEALTH & INFO ============

app.get('/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    network: 'base-sepolia',
    contracts: CONTRACTS
  });
});

app.get('/v1/', (req, res) => {
  res.json({
    name: 'MemoryVault Pro API',
    version: '1.0.0',
    documentation: '/v1/docs',
    endpoints: {
      auth: ['/v1/auth', '/v1/auth/nft'],
      memories: ['/v1/memories', '/v1/memories/:id', '/v1/memories/search'],
      nft: ['/v1/nft/mint', '/v1/nft/verify/:tokenId'],
      analytics: ['/v1/analytics/stats', '/v1/analytics/logs']
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🧠 MemoryVault Pro API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/v1/`);
  console.log(`💊 Health Check: http://localhost:${PORT}/v1/health`);
});

module.exports = app;
