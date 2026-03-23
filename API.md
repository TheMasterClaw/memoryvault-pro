# MemoryVault Pro API Documentation

## Overview

MemoryVault Pro provides a RESTful API for storing, retrieving, and managing encrypted AI agent memories on the blockchain. This API enables developers to integrate persistent memory capabilities into their AI applications.

**Base URL:** `https://api.memoryvault.pro/v1`

**Authentication:** Bearer token (JWT) or MetaMask signature

---

## Authentication

### Method 1: Wallet Signature (Recommended)

```javascript
const message = "Sign this message to authenticate with MemoryVault Pro";
const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, userAddress]
});

const response = await fetch('https://api.memoryvault.pro/v1/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: userAddress, signature, message })
});

const { token } = await response.json();
```

### Method 2: NFT Access Credential

```javascript
const response = await fetch('https://api.memoryvault.pro/v1/auth/nft', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    tokenId: '123',
    contractAddress: '0xf387c90612d2086C1870cAef589E660300523aeD'
  })
});
```

---

## Core Endpoints

### 1. Store Memory

Store an encrypted memory fragment to Filecoin via the MemoryVault registry.

**Endpoint:** `POST /memories`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Encrypted memory content (base64)",
  "encryptionType": "tee-aes256",
  "metadata": {
    "agentId": "my-ai-agent-001",
    "sessionId": "session-abc123",
    "tags": ["conversation", "user-preference"],
    "importance": "high",
    "ttl": null
  },
  "accessControl": {
    "public": false,
    "allowedAgents": ["agent-001", "agent-002"],
    "requiresNFT": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "memoryId": "mem_abc123xyz",
    "cid": "QmYwRzW7qqYUPp9s3vLbqcYf1eN5ffpSama9979dDnUeyA",
    "transactionHash": "0xabc123...",
    "blockNumber": 12345678,
    "timestamp": "2026-03-22T12:00:00Z",
    "size": 2048,
    "expiresAt": null
  }
}
```

**Status Codes:**
- `201` - Memory stored successfully
- `400` - Invalid request format
- `401` - Unauthorized
- `413` - Memory too large (max 10MB)
- `429` - Rate limit exceeded

---

### 2. Retrieve Memory

Fetch a stored memory by its ID.

**Endpoint:** `GET /memories/:memoryId`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `decrypt` (boolean) - Whether to decrypt the content (requires proper credentials)
- `format` (string) - Response format: `raw`, `json`, `base64`

**Response:**
```json
{
  "success": true,
  "data": {
    "memoryId": "mem_abc123xyz",
    "content": "Decrypted memory content",
    "metadata": {
      "agentId": "my-ai-agent-001",
      "sessionId": "session-abc123",
      "tags": ["conversation", "user-preference"],
      "createdAt": "2026-03-22T12:00:00Z",
      "accessCount": 5
    },
    "provenance": {
      "cid": "QmYwRzW7qqYUPp9s3vLbqcYf1eN5ffpSama9979dDnUeyA",
      "transactionHash": "0xabc123...",
      "blockNumber": 12345678,
      "storedOn": "filecoin"
    }
  }
}
```

---

### 3. List Memories

Query memories with filters and pagination.

**Endpoint:** `GET /memories`

**Query Parameters:**
- `agentId` (string) - Filter by agent
- `tags` (array) - Filter by tags
- `from` (timestamp) - Start date
- `to` (timestamp) - End date
- `limit` (number) - Max results (default: 20, max: 100)
- `offset` (number) - Pagination offset
- `sortBy` (string) - `createdAt`, `accessCount`, `importance`
- `sortOrder` (string) - `asc`, `desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [
      {
        "memoryId": "mem_abc123xyz",
        "metadata": {
          "agentId": "my-ai-agent-001",
          "tags": ["conversation"],
          "createdAt": "2026-03-22T12:00:00Z",
          "size": 2048
        },
        "cid": "QmYwRzW7qqYUPp9s3vLbqcYf1eN5ffpSama9979dDnUeyA"
      }
    ],
    "pagination": {
      "total": 156,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 4. Update Memory

Update memory metadata or access controls.

**Endpoint:** `PATCH /memories/:memoryId`

**Request Body:**
```json
{
  "metadata": {
    "tags": ["updated-tag"],
    "importance": "critical"
  },
  "accessControl": {
    "allowedAgents": ["agent-001", "agent-003"]
  }
}
```

---

### 5. Delete Memory

Remove a memory from the registry (does not delete from Filecoin).

**Endpoint:** `DELETE /memories/:memoryId`

**Response:**
```json
{
  "success": true,
  "data": {
    "memoryId": "mem_abc123xyz",
    "deletedAt": "2026-03-22T12:00:00Z",
    "note": "Memory dereferenced from registry. Content remains on Filecoin."
  }
}
```

---

### 6. Search Memories

Full-text search across memory content (requires decryption permission).

**Endpoint:** `POST /memories/search`

**Request Body:**
```json
{
  "query": "user preferences about dark mode",
  "filters": {
    "agentId": "my-ai-agent-001",
    "from": "2026-01-01",
    "to": "2026-03-22"
  },
  "semantic": true,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "memoryId": "mem_abc123xyz",
        "score": 0.95,
        "excerpt": "...user prefers dark mode in all applications...",
        "metadata": {
          "createdAt": "2026-02-15T10:30:00Z",
          "tags": ["preference", "ui"]
        }
      }
    ],
    "total": 3
  }
}
```

---

## NFT Access Credentials

### Mint Access NFT

**Endpoint:** `POST /nft/mint`

**Request Body:**
```json
{
  "name": "Agent Access Pass",
  "description": "Access to agent memories",
  "accessLevel": "read-write",
  "allowedMemories": ["*"],
  "expiresAt": "2027-03-22T00:00:00Z",
  "recipient": "0x1234..."
}
```

### Verify NFT Access

**Endpoint:** `GET /nft/verify/:tokenId`

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "accessLevel": "read-write",
    "expiresAt": "2027-03-22T00:00:00Z",
    "memoriesAccessible": ["mem_abc", "mem_def"]
  }
}
```

---

## Agent SDK Integration

### JavaScript/TypeScript SDK

```bash
npm install @memoryvault/sdk
```

```typescript
import { MemoryVault } from '@memoryvault/sdk';

const vault = new MemoryVault({
  apiKey: 'your-api-key',
  network: 'base-sepolia'
});

// Store a memory
const memory = await vault.store({
  content: JSON.stringify({
    userQuery: "What's the weather?",
    assistantResponse: "It's sunny today!",
    context: { location: "San Francisco" }
  }),
  tags: ['conversation', 'weather'],
  agentId: 'my-assistant'
});

// Retrieve memories
const memories = await vault.query({
  agentId: 'my-assistant',
  tags: ['conversation'],
  limit: 10
});

// Search semantically
const results = await vault.search("weather preferences", {
  semantic: true
});
```

---

## Webhooks

Subscribe to memory events:

```json
{
  "url": "https://your-app.com/webhooks/memoryvault",
  "events": ["memory.created", "memory.accessed", "nft.minted"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "memory.created",
  "timestamp": "2026-03-22T12:00:00Z",
  "data": {
    "memoryId": "mem_abc123xyz",
    "agentId": "my-ai-agent-001",
    "cid": "QmYwRzW7qqYUPp9s3vLbqcYf1eN5ffpSama9979dDnUeyA",
    "size": 2048
  }
}
```

---

## Rate Limits

| Tier | Requests/Min | Storage | Features |
|------|--------------|---------|----------|
| Free | 60 | 100MB | Basic CRUD |
| Pro | 600 | 10GB | Search, Webhooks |
| Enterprise | Unlimited | Unlimited | Custom TEE, SLA |

---

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `AUTH_EXPIRED` | JWT token expired | Re-authenticate |
| `INSUFFICIENT_FUNDS` | Not enough ETH for gas | Add funds to wallet |
| `ENCRYPTION_FAILED` | TEE encryption error | Retry or contact support |
| `CID_NOT_FOUND` | Content not on Filecoin | Check CID or re-upload |
| `NFT_INVALID` | NFT access expired or invalid | Renew or re-mint NFT |
| `RATE_LIMITED` | Too many requests | Wait or upgrade plan |

---

## SDKs & Tools

- **JavaScript/TypeScript:** `@memoryvault/sdk`
- **Python:** `pip install memoryvault`
- **Rust:** `cargo add memoryvault`
- **CLI:** `npm install -g @memoryvault/cli`

---

## Support

- **Documentation:** https://docs.memoryvault.pro
- **Discord:** https://discord.gg/memoryvault
- **Email:** api@memoryvault.pro
- **Status:** https://status.memoryvault.pro

---

## Changelog

### v1.0.0 (2026-03-22)
- Initial API release
- Core memory CRUD operations
- NFT access credentials
- Filecoin storage integration
- TEE-based encryption

---

<p align="center">
  <strong>Building the memory layer for AI agents 🔐</strong>
</p>
