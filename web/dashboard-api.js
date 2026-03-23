/**
 * MemoryVault Pro - Dashboard Backend
 * Express.js API for managing NFT access credentials
 */

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Contract ABIs (simplified - use full ABIs in production)
const MEMORY_REGISTRY_ABI = [
  "function storeMemory(bytes32 participantId, string calldata cid, bytes32 encryptionKeyHash, uint256 expiration, bool isShard, uint256 totalShards, bytes32[] calldata shardCids) external returns (uint256 memoryId)",
  "function retrieveMemory(bytes32 participantId, uint256 memoryId, bytes32 requesterId) external view returns (tuple(string cid, bytes32 encryptionKeyHash, uint256 timestamp, uint256 expiration, bool isShard, uint256 totalShards, bytes32[] shardCids))",
  "function hasAccess(bytes32 owner, bytes32 requester) external view returns (bool)",
  "function grantDelegation(bytes32 participantId, bytes32 delegate, uint256 expiration) external",
  "function memories(bytes32, uint256) external view returns (string memory, bytes32, uint256, uint256, bool, uint256)",
];

const NFT_CONTRACT_ABI = [
  "function issueCredential(address recipient, bytes32 targetParticipant, uint256 expiration, string calldata accessLevel, string calldata metadataURI, bool revocable) external returns (uint256 tokenId)",
  "function batchIssueCredentials(address[] calldata recipients, bytes32 targetParticipant, uint256 expiration, string calldata accessLevel, bool revocable) external returns (uint256[] memory tokenIds)",
  "function revokeCredential(uint256 tokenId, string calldata reason) external",
  "function renewCredential(uint256 tokenId, uint256 newExpiration) external",
  "function hasAccess(address requester, bytes32 targetParticipant, string calldata requiredLevel) external view returns (bool)",
  "function credentials(uint256) external view returns (bytes32 targetParticipant, uint256 expiration, string memory accessLevel, string memory metadataURI, bool revocable, uint256 issuedAt)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)"
];

// Initialize provider and contracts
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const memoryRegistry = new ethers.Contract(
  process.env.MEMORY_REGISTRY_ADDRESS,
  MEMORY_REGISTRY_ABI,
  wallet
);

const nftContract = new ethers.Contract(
  process.env.NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_ABI,
  wallet
);

// ============ NFT MINTING ENDPOINTS ============

/**
 * POST /api/nft/mint
 * Mint a single access credential NFT
 */
app.post('/api/nft/mint', async (req, res) => {
  try {
    const {
      recipient,
      targetParticipant,
      accessLevel,
      expirationDays,
      revocable,
      metadataURI
    } = req.body;

    // Calculate expiration
    const expiration = expirationDays 
      ? Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60)
      : 0;

    // Mint NFT
    const tx = await nftContract.issueCredential(
      recipient,
      targetParticipant,
      expiration,
      accessLevel,
      metadataURI || '',
      revocable !== false
    );

    const receipt = await tx.wait();
    
    // Parse token ID from event
    const event = receipt.logs.find(
      log => log.topics[0] === ethers.id('CredentialIssued(uint256,bytes32,bytes32,string,uint256)')
    );
    const tokenId = event ? parseInt(event.topics[1], 16) : null;

    res.json({
      success: true,
      tokenId,
      transactionHash: receipt.hash,
      recipient,
      accessLevel,
      expiration: expiration > 0 ? new Date(expiration * 1000).toISOString() : 'never'
    });
  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/nft/mint-batch
 * Mint multiple access credential NFTs
 */
app.post('/api/nft/mint-batch', async (req, res) => {
  try {
    const {
      recipients,
      targetParticipant,
      accessLevel,
      expirationDays,
      revocable
    } = req.body;

    const expiration = expirationDays 
      ? Math.floor(Date.now() / 1000) + (expirationDays * 24 * 60 * 60)
      : 0;

    const tx = await nftContract.batchIssueCredentials(
      recipients,
      targetParticipant,
      expiration,
      accessLevel,
      revocable !== false
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.hash,
      recipientsCount: recipients.length,
      accessLevel
    });
  } catch (error) {
    console.error('Batch mint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/nft/revoke
 * Revoke an NFT access credential
 */
app.post('/api/nft/revoke', async (req, res) => {
  try {
    const { tokenId, reason } = req.body;

    const tx = await nftContract.revokeCredential(tokenId, reason || '');
    const receipt = await tx.wait();

    res.json({
      success: true,
      tokenId,
      transactionHash: receipt.hash,
      reason
    });
  } catch (error) {
    console.error('Revoke error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/nft/renew
 * Renew/extend an NFT access credential
 */
app.post('/api/nft/renew', async (req, res) => {
  try {
    const { tokenId, newExpirationDays } = req.body;

    const newExpiration = Math.floor(Date.now() / 1000) + (newExpirationDays * 24 * 60 * 60);

    const tx = await nftContract.renewCredential(tokenId, newExpiration);
    const receipt = await tx.wait();

    res.json({
      success: true,
      tokenId,
      newExpiration: new Date(newExpiration * 1000).toISOString(),
      transactionHash: receipt.hash
    });
  } catch (error) {
    console.error('Renew error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/nft/check-access
 * Check if an address has NFT access
 */
app.get('/api/nft/check-access', async (req, res) => {
  try {
    const { requester, targetParticipant, requiredLevel } = req.query;

    const hasAccess = await nftContract.hasAccess(
      requester,
      targetParticipant,
      requiredLevel || 'read'
    );

    res.json({
      success: true,
      hasAccess,
      requester,
      targetParticipant,
      requiredLevel: requiredLevel || 'read'
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/nft/credentials/:address
 * List all credentials held by an address
 */
app.get('/api/nft/credentials/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const balance = await nftContract.balanceOf(address);
    const credentials = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
      const cred = await nftContract.credentials(tokenId);
      
      credentials.push({
        tokenId: tokenId.toString(),
        targetParticipant: cred.targetParticipant,
        accessLevel: cred.accessLevel,
        expiration: cred.expiration > 0 ? new Date(cred.expiration * 1000).toISOString() : 'never',
        revocable: cred.revocable,
        issuedAt: new Date(cred.issuedAt * 1000).toISOString()
      });
    }

    res.json({
      success: true,
      address,
      count: credentials.length,
      credentials
    });
  } catch (error) {
    console.error('List credentials error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ MEMORY REGISTRY ENDPOINTS ============

/**
 * GET /api/memories/:participantId
 * List all memories for a participant
 */
app.get('/api/memories/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { requesterId } = req.query;

    // Check access
    const hasAccess = await memoryRegistry.hasAccess(
      participantId,
      requesterId || participantId
    );

    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get memory count
    const count = await memoryRegistry.getMemoryCount(participantId);
    const memories = [];

    for (let i = 0; i < count; i++) {
      const memory = await memoryRegistry.memories(participantId, i);
      memories.push({
        memoryId: i,
        cid: memory[0],
        encryptionKeyHash: memory[1],
        timestamp: new Date(memory[2] * 1000).toISOString(),
        expiration: memory[3] > 0 ? new Date(memory[3] * 1000).toISOString() : 'never',
        isShard: memory[4],
        totalShards: memory[5].toString()
      });
    }

    res.json({
      success: true,
      participantId,
      count: memories.length,
      memories
    });
  } catch (error) {
    console.error('List memories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    contracts: {
      memoryRegistry: process.env.MEMORY_REGISTRY_ADDRESS,
      nftContract: process.env.NFT_CONTRACT_ADDRESS
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MemoryVault Pro Dashboard API running on port ${PORT}`);
  console.log(`Memory Registry: ${process.env.MEMORY_REGISTRY_ADDRESS}`);
  console.log(`NFT Contract: ${process.env.NFT_CONTRACT_ADDRESS}`);
});

module.exports = app;
