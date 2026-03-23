#!/usr/bin/env node

/**
 * MemoryVault Pro - Live API Demo
 * 
 * This script demonstrates the complete MemoryVault Pro API flow:
 * 1. Health check
 * 2. Authenticate with wallet
 * 3. Store memories
 * 4. Query memories
 * 5. Search memories
 * 6. Mint NFT access
 * 7. Get analytics
 * 
 * Run: node demo.js
 */

const http = require('http');

const API_URL = 'localhost';
const API_PORT = 3001;
const API_BASE = '/v1';

// Demo wallet (in production, this would be MetaMask)
const DEMO_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const DEMO_SIGNATURE = '0x' + '1'.repeat(130); // Dummy signature for demo

let authToken = null;
let createdMemoryIds = [];

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${c[color]}${message}${c.reset}`);
}

function header(title) {
  log('\n' + '═'.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('═'.repeat(60) + '\n', 'cyan');
}

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: API_BASE + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkHealth() {
  header('🏥 STEP 1: Health Check');
  
  const res = await makeRequest('GET', '/health');
  
  if (res.status === 200) {
    log('✅ API is healthy!', 'green');
    log(`   Status: ${res.data.status}`, 'white');
    log(`   Version: ${res.data.version}`, 'white');
    log(`   Network: ${res.data.network}`, 'white');
    return true;
  }
  
  log('❌ API health check failed', 'red');
  return false;
}

async function authenticate() {
  header('🔐 STEP 2: Authentication');
  
  const message = 'Sign this message to authenticate with MemoryVault Pro';
  
  log('Signing message with wallet...', 'yellow');
  log(`Message: "${message}"`, 'white');
  log(`Address: ${DEMO_ADDRESS}`, 'white');
  
  const res = await makeRequest('POST', '/auth', {
    address: DEMO_ADDRESS,
    signature: DEMO_SIGNATURE,
    message
  });
  
  if (res.data?.success && res.data?.data?.token) {
    authToken = res.data.data.token;
    log('\n✅ Authenticated successfully!', 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'white');
    log(`   API Key: ${res.data.data.apiKey?.substring(0, 20)}...`, 'white');
    return true;
  }
  
  // For demo purposes, create a mock token if auth fails
  log('\n⚠️  Using demo mode (mock authentication)', 'yellow');
  authToken = 'demo-token-' + Date.now();
  return true;
}

async function storeMemories() {
  header('💾 STEP 3: Store Memories');
  
  const memories = [
    {
      content: JSON.stringify({
        query: "What's the weather like today?",
        response: "It's sunny and 72°F in San Francisco!",
        context: { location: "San Francisco", userPreference: "metric" }
      }),
      metadata: {
        agentId: 'weather-assistant',
        tags: ['conversation', 'weather', 'user-preference'],
        importance: 'low'
      }
    },
    {
      content: JSON.stringify({
        query: "Remind me about my meeting with Sarah",
        response: "You have a meeting with Sarah tomorrow at 2 PM to discuss the Q1 roadmap.",
        context: { meetingWith: "Sarah", topic: "Q1 Roadmap", time: "2 PM" }
      }),
      metadata: {
        agentId: 'calendar-assistant',
        tags: ['reminder', 'meeting', 'work'],
        importance: 'high'
      }
    },
    {
      content: JSON.stringify({
        code: "function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }",
        language: "javascript",
        purpose: "recursive fibonacci implementation"
      }),
      metadata: {
        agentId: 'code-assistant',
        tags: ['code', 'javascript', 'algorithm'],
        importance: 'medium'
      }
    }
  ];
  
  for (const mem of memories) {
    log(`Storing memory from ${mem.metadata.agentId}...`, 'yellow');
    
    const res = await makeRequest('POST', '/memories', {
      content: mem.content,
      encryptionType: 'tee-aes256',
      metadata: mem.metadata,
      accessControl: { public: false, requiresNFT: false }
    }, { 'Authorization': `Bearer ${authToken}` });
    
    if (res.data?.success) {
      createdMemoryIds.push(res.data.data.memoryId);
      log(`✅ Stored: ${res.data.data.memoryId}`, 'green');
      log(`   CID: ${res.data.data.cid}`, 'white');
      log(`   Size: ${res.data.data.size} bytes`, 'white');
      log(`   Block: ${res.data.data.blockNumber}`, 'white');
    } else {
      log(`❌ Failed: ${res.data?.error || 'Unknown error'}`, 'red');
    }
  }
}

async function queryMemories() {
  header('📋 STEP 4: Query Memories');
  
  log('Fetching all memories...', 'yellow');
  
  const res = await makeRequest('GET', '/memories?limit=10', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (res.data?.success) {
    log(`✅ Found ${res.data.data.memories.length} memories`, 'green');
    
    res.data.data.memories.forEach((mem, i) => {
      log(`\n   [${i + 1}] ${mem.memoryId}`, 'cyan');
      log(`       Agent: ${mem.metadata.agentId}`, 'white');
      log(`       Tags: ${mem.metadata.tags?.join(', ') || 'none'}`, 'white');
      log(`       Created: ${new Date(mem.metadata.createdAt).toLocaleString()}`, 'white');
    });
    
    log(`\n   Pagination: ${res.data.data.pagination.total} total`, 'magenta');
  }
}

async function searchMemories() {
  header('🔍 STEP 5: Search Memories');
  
  const queries = [
    { query: 'weather', semantic: false },
    { query: 'meeting reminder', semantic: true }
  ];
  
  for (const search of queries) {
    log(`\nSearching: "${search.query}" (semantic: ${search.semantic})`, 'yellow');
    
    const res = await makeRequest('POST', '/memories/search', {
      query: search.query,
      semantic: search.semantic,
      limit: 5
    }, { 'Authorization': `Bearer ${authToken}` });
    
    if (res.data?.success) {
      log(`✅ Found ${res.data.data.results.length} results`, 'green');
      
      res.data.data.results.forEach((r, i) => {
        log(`   [${i + 1}] Score: ${(r.score * 100).toFixed(1)}%`, 'cyan');
        log(`       ${r.excerpt.substring(0, 60)}...`, 'white');
      });
    }
  }
}

async function mintNFT() {
  header('🎨 STEP 6: Mint Access NFT');
  
  log('Minting access NFT for agent collaboration...', 'yellow');
  
  const res = await makeRequest('POST', '/nft/mint', {
    recipient: '0xRecipientAddress1234567890123456789012',
    name: 'Agent Collaboration Pass',
    description: 'Grants read access to weather and calendar memories',
    accessLevel: 'read',
    allowedMemories: createdMemoryIds.slice(0, 2),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, { 'Authorization': `Bearer ${authToken}` });
  
  if (res.data?.success) {
    log(`✅ NFT minted successfully!`, 'green');
    log(`   Token ID: ${res.data.data.tokenId}`, 'cyan');
    log(`   Access Level: ${res.data.data.accessLevel}`, 'white');
    log(`   Expires: ${new Date(res.data.data.expiresAt).toLocaleDateString()}`, 'white');
    log(`   Tx Hash: ${res.data.data.transactionHash.substring(0, 30)}...`, 'white');
    
    // Verify the NFT
    log('\nVerifying NFT access...', 'yellow');
    const verifyRes = await makeRequest('GET', `/nft/verify/${res.data.data.tokenId}`);
    
    if (verifyRes.data?.success) {
      log(`✅ NFT is ${verifyRes.data.data.valid ? 'VALID ✓' : 'INVALID ✗'}`, 
          verifyRes.data.data.valid ? 'green' : 'red');
    }
  }
}

async function getAnalytics() {
  header('📊 STEP 7: Analytics & Statistics');
  
  // Get stats
  log('Fetching usage statistics...', 'yellow');
  const statsRes = await makeRequest('GET', '/analytics/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (statsRes.data?.success) {
    const stats = statsRes.data.data;
    log('\n📈 Usage Statistics:', 'cyan');
    log(`   Total Memories: ${stats.totalMemories}`, 'white');
    log(`   Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`, 'white');
    log(`   Total Accesses: ${stats.totalAccesses}`, 'white');
    log(`   Public: ${stats.publicMemories} | Private: ${stats.privateMemories}`, 'white');
    log(`   Avg Response Time: ${stats.avgResponseTime}ms`, 'white');
    log(`   Uptime: ${stats.uptime}%`, 'white');
  }
  
  // Get logs
  log('\nFetching recent access logs...', 'yellow');
  const logsRes = await makeRequest('GET', '/analytics/logs?limit=10', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (logsRes.data?.success) {
    log(`\n📝 Recent Access Logs (${logsRes.data.data.logs.length}):`, 'cyan');
    logsRes.data.data.logs.slice(-5).forEach((entry, i) => {
      const status = entry.success ? '✓' : '✗';
      const color = entry.success ? 'green' : 'red';
      log(`   ${status} [${entry.action.toUpperCase()}] ${entry.memoryId?.substring(0, 20)}...`, color);
    });
  }
}

async function retrieveMemory() {
  header('📖 STEP 8: Retrieve Memory');
  
  if (createdMemoryIds.length === 0) {
    log('No memories to retrieve', 'yellow');
    return;
  }
  
  const memoryId = createdMemoryIds[0];
  log(`Retrieving memory: ${memoryId}...`, 'yellow');
  
  const res = await makeRequest('GET', `/memories/${memoryId}?decrypt=false`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (res.data?.success) {
    log(`✅ Memory retrieved!`, 'green');
    log(`   CID: ${res.data.data.provenance.cid}`, 'cyan');
    log(`   Stored on: ${res.data.data.provenance.storedOn}`, 'white');
    log(`   Access count: ${res.data.data.metadata.accessCount}`, 'white');
    log(`   Created: ${new Date(res.data.data.metadata.createdAt).toLocaleString()}`, 'white');
  }
}

async function runDemo() {
  log('\n' + '█'.repeat(60), 'magenta');
  log('█' + ' '.repeat(58) + '█', 'magenta');
  log('█' + '  🧠 MemoryVault Pro - Live API Demo'.padEnd(58) + '█', 'magenta');
  log('█' + ' '.repeat(58) + '█', 'magenta');
  log('█'.repeat(60) + '\n', 'magenta');
  
  try {
    // Check if server is running
    const healthy = await checkHealth();
    if (!healthy) {
      log('\n❌ API server is not running!', 'red');
      log('Start it with: cd api && npm install && npm start\n', 'yellow');
      process.exit(1);
    }
    
    // Run all demo steps
    await authenticate();
    await storeMemories();
    await queryMemories();
    await searchMemories();
    await mintNFT();
    await getAnalytics();
    await retrieveMemory();
    
    // Summary
    header('✨ DEMO COMPLETE');
    log('✅ Successfully demonstrated MemoryVault Pro API!', 'green');
    log('\nKey Features Showcased:', 'cyan');
    log('   • Health monitoring', 'white');
    log('   • Wallet-based authentication', 'white');
    log('   • Encrypted memory storage', 'white');
    log('   • Flexible querying with filters', 'white');
    log('   • Semantic search capabilities', 'white');
    log('   • NFT-based access control', 'white');
    log('   • Analytics and monitoring', 'white');
    log('\n🚀 Try the live demo at: https://memoryvault-pro.vercel.app', 'blue');
    log('\n', 'reset');
    
  } catch (error) {
    log(`\n❌ Demo failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n👋 Demo interrupted. Goodbye!\n', 'yellow');
  process.exit(0);
});

runDemo();
