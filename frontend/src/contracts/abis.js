export const MemoryRegistryABI = [
  {
    "inputs": [{ "internalType": "address", "name": "_accessNFT", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "owner", "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "delegate", "type": "bytes32" },
      { "indexed": false, "internalType": "uint256", "name": "expiration", "type": "uint256" }
    ],
    "name": "DelegationGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "owner", "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "delegate", "type": "bytes32" }
    ],
    "name": "DelegationRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "participantId", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "cid", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "bool", "name": "isShard", "type": "bool" }
    ],
    "name": "MemoryStored",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "accessNFT",
    "outputs": [{ "internalType": "contract IMemoryAccessNFT", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "participantId", "type": "bytes32" }],
    "name": "getMemories",
    "outputs": [{
      "components": [
        { "internalType": "string", "name": "cid", "type": "string" },
        { "internalType": "bytes32", "name": "encryptionKeyHash", "type": "bytes32" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "expiration", "type": "uint256" },
        { "internalType": "bool", "name": "isShard", "type": "bool" },
        { "internalType": "uint256", "name": "totalShards", "type": "uint256" },
        { "internalType": "bytes32[]", "name": "shardCids", "type": "bytes32[]" }
      ],
      "internalType": "struct MemoryRegistry.MemoryEntry[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "participantId", "type": "bytes32" }],
    "name": "getMemoryCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "owner", "type": "bytes32" },
      { "internalType": "bytes32", "name": "requester", "type": "bytes32" }
    ],
    "name": "hasAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "participantId", "type": "bytes32" },
      { "internalType": "uint256", "name": "memoryId", "type": "uint256" },
      { "internalType": "bytes32", "name": "requesterId", "type": "bytes32" }
    ],
    "name": "retrieveMemory",
    "outputs": [{
      "components": [
        { "internalType": "string", "name": "cid", "type": "string" },
        { "internalType": "bytes32", "name": "encryptionKeyHash", "type": "bytes32" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
        { "internalType": "uint256", "name": "expiration", "type": "uint256" },
        { "internalType": "bool", "name": "isShard", "type": "bool" },
        { "internalType": "uint256", "name": "totalShards", "type": "uint256" },
        { "internalType": "bytes32[]", "name": "shardCids", "type": "bytes32[]" }
      ],
      "internalType": "struct MemoryRegistry.MemoryEntry",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "participantId", "type": "bytes32" },
      { "internalType": "string", "name": "cid", "type": "string" },
      { "internalType": "bytes32", "name": "encryptionKeyHash", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiration", "type": "uint256" },
      { "internalType": "bool", "name": "isShard", "type": "bool" },
      { "internalType": "uint256", "name": "totalShards", "type": "uint256" },
      { "internalType": "bytes32[]", "name": "shardCids", "type": "bytes32[]" }
    ],
    "name": "storeMemory",
    "outputs": [{ "internalType": "uint256", "name": "memoryId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export const MemoryAccessNFTABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" },
      { "internalType": "address", "name": "_memoryRegistry", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": true, "internalType": "bytes32", "name": "targetParticipant", "type": "bytes32" },
      { "indexed": true, "internalType": "bytes32", "name": "recipient", "type": "bytes32" },
      { "indexed": false, "internalType": "string", "name": "accessLevel", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "expiration", "type": "uint256" }
    ],
    "name": "CredentialIssued",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "bytes32", "name": "targetParticipant", "type": "bytes32" },
      { "internalType": "uint256", "name": "expiration", "type": "uint256" },
      { "internalType": "string", "name": "accessLevel", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "bool", "name": "revocable", "type": "bool" }
    ],
    "name": "issueCredential",
    "outputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getCredentialsByOwner",
    "outputs": [
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" },
      {
        "components": [
          { "internalType": "bytes32", "name": "targetParticipant", "type": "bytes32" },
          { "internalType": "uint256", "name": "expiration", "type": "uint256" },
          { "internalType": "string", "name": "accessLevel", "type": "string" },
          { "internalType": "string", "name": "metadataURI", "type": "string" },
          { "internalType": "bool", "name": "revocable", "type": "bool" },
          { "internalType": "uint256", "name": "issuedAt", "type": "uint256" }
        ],
        "internalType": "struct MemoryAccessNFT.AccessCredential[]",
        "name": "creds",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "requester", "type": "address" },
      { "internalType": "bytes32", "name": "targetParticipant", "type": "bytes32" },
      { "internalType": "string", "name": "requiredLevel", "type": "string" }
    ],
    "name": "hasAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]
