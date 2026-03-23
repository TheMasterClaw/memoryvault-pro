/**
 * MemoryVault Pro SDK
 * JavaScript/TypeScript client for MemoryVault Pro API
 * 
 * @example
 * const vault = new MemoryVault({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.memoryvault.pro/v1'
 * });
 * 
 * const memory = await vault.store({
 *   content: 'My memory content',
 *   tags: ['conversation']
 * });
 */

class MemoryVault {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001/v1';
    this.apiKey = config.apiKey || null;
    this.token = config.token || null;
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set API key
   * @param {string} apiKey - API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Get headers for API requests
   */
  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async _request(method, endpoint, body = null, params = null) {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const options = {
      method,
      headers: this._getHeaders()
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // ============ AUTH ============

  /**
   * Authenticate with wallet signature
   * @param {string} address - Ethereum address
   * @param {string} signature - Signed message
   * @param {string} message - Original message
   */
  async authenticate(address, signature, message) {
    const result = await this._request('POST', '/auth', {
      address,
      signature,
      message
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
      this.setApiKey(result.data.apiKey);
    }

    return result.data;
  }

  /**
   * Authenticate with NFT credential
   * @param {string} tokenId - NFT token ID
   * @param {string} contractAddress - NFT contract address
   * @param {string} requesterAddress - Requester address
   */
  async authenticateWithNFT(tokenId, contractAddress, requesterAddress) {
    const result = await this._request('POST', '/auth/nft', {
      tokenId,
      contractAddress,
      requesterAddress
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result.data;
  }

  // ============ MEMORIES ============

  /**
   * Store a new memory
   * @param {Object} options - Memory options
   * @param {string} options.content - Memory content
   * @param {string} [options.encryptionType='tee-aes256'] - Encryption type
   * @param {Object} [options.metadata={}] - Memory metadata
   * @param {Object} [options.accessControl={}] - Access control settings
   */
  async store(options) {
    const result = await this._request('POST', '/memories', {
      content: options.content,
      encryptionType: options.encryptionType || 'tee-aes256',
      metadata: options.metadata || {},
      accessControl: options.accessControl || {}
    });

    return result.data;
  }

  /**
   * Retrieve a memory by ID
   * @param {string} memoryId - Memory ID
   * @param {Object} [options={}] - Options
   * @param {boolean} [options.decrypt=false] - Whether to decrypt content
   * @param {string} [options.format='json'] - Response format
   */
  async retrieve(memoryId, options = {}) {
    const params = {};
    if (options.decrypt) params.decrypt = 'true';
    if (options.format) params.format = options.format;

    const result = await this._request('GET', `/memories/${memoryId}`, null, params);
    return result.data;
  }

  /**
   * List memories with filters
   * @param {Object} [filters={}] - Query filters
   * @param {string} [filters.agentId] - Filter by agent ID
   * @param {string[]} [filters.tags] - Filter by tags
   * @param {string} [filters.from] - Start date (ISO)
   * @param {string} [filters.to] - End date (ISO)
   * @param {number} [filters.limit=20] - Max results
   * @param {number} [filters.offset=0] - Pagination offset
   * @param {string} [filters.sortBy='createdAt'] - Sort field
   * @param {string} [filters.sortOrder='desc'] - Sort order
   */
  async query(filters = {}) {
    const params = {
      limit: filters.limit || 20,
      offset: filters.offset || 0,
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc'
    };

    if (filters.agentId) params.agentId = filters.agentId;
    if (filters.tags) params.tags = filters.tags.join(',');
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const result = await this._request('GET', '/memories', null, params);
    return result.data;
  }

  /**
   * Update memory metadata
   * @param {string} memoryId - Memory ID
   * @param {Object} updates - Updates to apply
   * @param {Object} [updates.metadata] - Metadata updates
   * @param {Object} [updates.accessControl] - Access control updates
   */
  async update(memoryId, updates) {
    const result = await this._request('PATCH', `/memories/${memoryId}`, updates);
    return result.data;
  }

  /**
   * Delete a memory
   * @param {string} memoryId - Memory ID to delete
   */
  async delete(memoryId) {
    const result = await this._request('DELETE', `/memories/${memoryId}`);
    return result.data;
  }

  /**
   * Search memories
   * @param {string} query - Search query
   * @param {Object} [options={}] - Search options
   * @param {Object} [options.filters] - Additional filters
   * @param {boolean} [options.semantic=false] - Use semantic search
   * @param {number} [options.limit=10] - Max results
   */
  async search(query, options = {}) {
    const result = await this._request('POST', '/memories/search', {
      query,
      filters: options.filters || {},
      semantic: options.semantic || false,
      limit: options.limit || 10
    });

    return result.data;
  }

  // ============ NFT ============

  /**
   * Mint an access NFT
   * @param {Object} options - Mint options
   * @param {string} options.recipient - NFT recipient address
   * @param {string} [options.name] - NFT name
   * @param {string} [options.description] - NFT description
   * @param {string} [options.accessLevel='read'] - Access level
   * @param {string[]} [options.allowedMemories=['*']] - Allowed memory IDs
   * @param {string} [options.expiresAt] - Expiration date (ISO)
   */
  async mintAccessNFT(options) {
    const result = await this._request('POST', '/nft/mint', {
      recipient: options.recipient,
      name: options.name,
      description: options.description,
      accessLevel: options.accessLevel || 'read',
      allowedMemories: options.allowedMemories || ['*'],
      expiresAt: options.expiresAt
    });

    return result.data;
  }

  /**
   * Verify NFT access
   * @param {string} tokenId - NFT token ID
   * @param {string} [address] - Address to verify
   */
  async verifyNFT(tokenId, address) {
    const params = address ? { address } : {};
    const result = await this._request('GET', `/nft/verify/${tokenId}`, null, params);
    return result.data;
  }

  // ============ ANALYTICS ============

  /**
   * Get access logs
   * @param {Object} [filters={}] - Log filters
   * @param {string} [filters.memoryId] - Filter by memory ID
   * @param {string} [filters.action] - Filter by action type
   * @param {number} [filters.limit=50] - Max logs
   */
  async getAccessLogs(filters = {}) {
    const params = {
      limit: filters.limit || 50
    };

    if (filters.memoryId) params.memoryId = filters.memoryId;
    if (filters.action) params.action = filters.action;

    const result = await this._request('GET', '/analytics/logs', null, params);
    return result.data;
  }

  /**
   * Get usage statistics
   */
  async getStats() {
    const result = await this._request('GET', '/analytics/stats');
    return result.data;
  }

  // ============ UTILITIES ============

  /**
   * Check API health
   */
  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }

  /**
   * Get API info
   */
  async info() {
    const response = await fetch(`${this.baseUrl}/`);
    return response.json();
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MemoryVault };
}

if (typeof window !== 'undefined') {
  window.MemoryVault = MemoryVault;
}
