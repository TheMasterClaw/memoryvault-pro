# MemoryVault Pro API & SDK

Complete REST API and JavaScript SDK for MemoryVault Pro - Private AI Agent Memory on Blockchain.

## 🚀 Quick Start

### Start the API Server

```bash
cd api
npm install
npm start
```

The API will be available at `http://localhost:3001/v1`

### Use the SDK

```html
<!-- Browser -->
<script src="sdk/memoryvault.js"></script>
<script>
  const vault = new MemoryVault({ baseUrl: 'http://localhost:3001/v1' });
</script>
```

```javascript
// Node.js
const { MemoryVault } = require('./sdk/memoryvault.js');

const vault = new MemoryVault({
  baseUrl: 'http://localhost:3001/v1',
  apiKey: 'your-api-key'
});
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth` | Authenticate with wallet signature |
| POST | `/v1/auth/nft` | Authenticate with NFT credential |

### Memories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/memories` | Store a new memory |
| GET | `/v1/memories` | List memories with filters |
| GET | `/v1/memories/:id` | Retrieve a memory |
| PATCH | `/v1/memories/:id` | Update memory metadata |
| DELETE | `/v1/memories/:id` | Delete a memory |
| POST | `/v1/memories/search` | Search memories |

### NFT Access

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/nft/mint` | Mint access NFT |
| GET | `/v1/nft/verify/:tokenId` | Verify NFT access |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/analytics/stats` | Get usage statistics |
| GET | `/v1/analytics/logs` | Get access logs |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/health` | Health check |
| GET | `/v1/` | API info |

## 💻 SDK Examples

### Store a Memory

```javascript
const vault = new MemoryVault({ baseUrl: 'http://localhost:3001/v1' });

// Authenticate first
await vault.authenticate(
  '0xYourAddress',
  '0xYourSignature',
  'Sign this message to authenticate with MemoryVault Pro'
);

// Store memory
const memory = await vault.store({
  content: JSON.stringify({
    query: "What's the weather?",
    response: "It's sunny today!"
  }),
  metadata: {
    agentId: 'my-assistant',
    tags: ['conversation', 'weather']
  },
  accessControl: {
    public: false,
    requiresNFT: false
  }
});

console.log('Stored:', memory.memoryId);
console.log('CID:', memory.cid);
```

### Query Memories

```javascript
// Get all memories
const all = await vault.query();

// Filtered query
const filtered = await vault.query({
  agentId: 'my-assistant',
  tags: ['conversation'],
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

console.log(`Found ${filtered.memories.length} memories`);
```

### Search Memories

```javascript
const results = await vault.search('weather preferences', {
  semantic: true,
  filters: {
    agentId: 'my-assistant'
  },
  limit: 5
});

results.results.forEach(r => {
  console.log(`${r.memoryId}: ${r.excerpt} (score: ${r.score})`);
});
```

### NFT Access Control

```javascript
// Mint access NFT
const nft = await vault.mintAccessNFT({
  recipient: '0xRecipientAddress',
  name: 'Agent Access Pass',
  description: 'Full access to agent memories',
  accessLevel: 'read-write',
  expiresAt: '2027-03-22T00:00:00Z'
});

console.log('NFT minted:', nft.tokenId);

// Verify access
const access = await vault.verifyNFT(nft.tokenId, '0xRecipientAddress');
console.log('Has access:', access.valid);
```

### Get Analytics

```javascript
// Get stats
const stats = await vault.getStats();
console.log(`Total memories: ${stats.totalMemories}`);
console.log(`Storage used: ${stats.totalSize} bytes`);
console.log(`Total accesses: ${stats.totalAccesses}`);

// Get access logs
const logs = await vault.getAccessLogs({ limit: 10 });
logs.logs.forEach(log => {
  console.log(`${log.action}: ${log.memoryId} at ${log.timestamp}`);
});
```

## 🔐 Authentication Flow

### Wallet Signature Authentication

1. Generate message to sign
2. User signs with MetaMask
3. Send address + signature to `/v1/auth`
4. Receive JWT token + API key
5. Use token for subsequent requests

```javascript
const message = 'Sign this message to authenticate with MemoryVault Pro';
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, userAddress]
});

const vault = new MemoryVault({ baseUrl: 'http://localhost:3001/v1' });
await vault.authenticate(userAddress, signature, message);
```

### NFT Authentication

```javascript
const vault = new MemoryVault({ baseUrl: 'http://localhost:3001/v1' });
await vault.authenticateWithNFT(
  tokenId,
  '0xf387c90612d2086C1870cAef589E660300523aeD',
  userAddress
);
```

## 🧪 Testing

Run the API test suite:

```bash
cd api
npm test
# or
node test.js
```

## 📊 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... }
}
```

Errors:

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **Helmet.js**: Security headers
- **CORS**: Configurable cross-origin rules
- **JWT**: Stateless authentication
- **AES-256-GCM**: Content encryption
- **Access Control**: Owner, delegated, or NFT-based

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | API server port |
| `JWT_SECRET` | `memoryvault-dev-secret` | JWT signing secret |

## 📦 Dependencies

### API Server
- express - Web framework
- cors - Cross-origin support
- helmet - Security headers
- express-rate-limit - Rate limiting
- jsonwebtoken - JWT authentication
- ethers - Blockchain interactions

### SDK
- No external dependencies (uses native fetch)

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────>│  MemoryVault API │────>│  Filecoin/IPFS  │
│   (SDK)         │<────│  (Express.js)    │<────│  (Storage)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Base Sepolia    │
                        │  Smart Contracts │
                        └──────────────────┘
```

## 📝 License

MIT License - see LICENSE file

## 🤝 Support

- Documentation: https://docs.memoryvault.pro
- Discord: https://discord.gg/memoryvault
- Email: api@memoryvault.pro
