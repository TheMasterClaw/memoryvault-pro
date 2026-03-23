// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMemoryAccessNFT {
    function hasAccess(address requester, bytes32 targetParticipant, string calldata requiredLevel) external view returns (bool);
}

/**
 * @title MemoryRegistry
 * @notice Stores encrypted memory CIDs with ERC-8004 identity binding
 */
contract MemoryRegistry is Ownable, ReentrancyGuard {
    
    struct MemoryEntry {
        string cid;                    // Filecoin CID
        bytes32 encryptionKeyHash;     // Hash of encryption key (stored in TEE)
        uint256 timestamp;
        uint256 expiration;            // 0 = no expiration
        bool isShard;                  // Is this a shard of larger memory?
        uint256 totalShards;           // If sharded, how many total?
        bytes32[] shardCids;           // CIDs of other shards
    }
    
    // ERC-8004 participant ID => memory entries
    mapping(bytes32 => MemoryEntry[]) public memories;
    
    // CID => owner participant ID (for lookup)
    mapping(string => bytes32) public cidToOwner;
    
    // Access control: participant => delegate => expiration
    mapping(bytes32 => mapping(bytes32 => uint256)) public delegations;
    
    // NFT contract for token-gated access
    IMemoryAccessNFT public accessNFT;
    
    // Enable/disable NFT access checking
    bool public nftAccessEnabled = true;
    
    event MemoryStored(
        bytes32 indexed participantId,
        string cid,
        uint256 timestamp,
        bool isShard
    );
    
    event MemoryRetrieved(
        bytes32 indexed participantId,
        string cid,
        uint256 timestamp
    );
    
    event DelegationGranted(
        bytes32 indexed owner,
        bytes32 indexed delegate,
        uint256 expiration
    );
    
    event DelegationRevoked(
        bytes32 indexed owner,
        bytes32 indexed delegate
    );
    
    event NFTContractUpdated(address indexed newNFTContract);
    event NFTAccessToggled(bool enabled);
    
    constructor(address _accessNFT) Ownable(msg.sender) {
        accessNFT = IMemoryAccessNFT(_accessNFT);
    }
    
    /**
     * @notice Update the NFT contract address
     * @param _accessNFT New NFT contract address
     */
    function setAccessNFT(address _accessNFT) external onlyOwner {
        accessNFT = IMemoryAccessNFT(_accessNFT);
        emit NFTContractUpdated(_accessNFT);
    }
    
    /**
     * @notice Enable or disable NFT access checking
     * @param _enabled Whether to enable NFT access
     */
    function setNFTAccessEnabled(bool _enabled) external onlyOwner {
        nftAccessEnabled = _enabled;
        emit NFTAccessToggled(_enabled);
    }
    
    /**
     * @notice Store a new memory entry
     * @param participantId ERC-8004 participant ID
     * @param cid Filecoin CID of encrypted memory
     * @param encryptionKeyHash Hash of the encryption key (for verification)
     * @param expiration Time when memory expires (0 = never)
     * @param isShard Whether this is a shard
     * @param totalShards Total number of shards (if sharded)
     * @param shardCids CIDs of other shards (if sharded)
     */
    function storeMemory(
        bytes32 participantId,
        string calldata cid,
        bytes32 encryptionKeyHash,
        uint256 expiration,
        bool isShard,
        uint256 totalShards,
        bytes32[] calldata shardCids
    ) external returns (uint256 memoryId) {
        require(bytes(cid).length > 0, "Empty CID");
        require(cidToOwner[cid] == bytes32(0), "CID already exists");
        
        MemoryEntry memory entry = MemoryEntry({
            cid: cid,
            encryptionKeyHash: encryptionKeyHash,
            timestamp: block.timestamp,
            expiration: expiration,
            isShard: isShard,
            totalShards: totalShards,
            shardCids: shardCids
        });
        
        memories[participantId].push(entry);
        cidToOwner[cid] = participantId;
        memoryId = memories[participantId].length - 1;
        
        emit MemoryStored(participantId, cid, block.timestamp, isShard);
    }
    
    /**
     * @notice Retrieve memory (checks access)
     * @param participantId Owner's ERC-8004 ID
     * @param memoryId Index in memories array
     * @param requesterId Requester's ERC-8004 ID (for access check)
     */
    function retrieveMemory(
        bytes32 participantId,
        uint256 memoryId,
        bytes32 requesterId
    ) external view returns (MemoryEntry memory) {
        require(memoryId < memories[participantId].length, "Invalid memory ID");
        
        MemoryEntry storage entry = memories[participantId][memoryId];
        
        // Check not expired
        if (entry.expiration > 0) {
            require(block.timestamp < entry.expiration, "Memory expired");
        }
        
        // Check access: owner, delegated, OR NFT holder
        require(
            requesterId == participantId || 
            delegations[participantId][requesterId] > block.timestamp ||
            (nftAccessEnabled && _hasNFTAccess(requesterId, participantId)),
            "Access denied"
        );
        
        return entry;
    }
    
    /**
     * @notice Grant delegation to another agent
     * @param delegate ERC-8004 ID of delegate
     * @param expiration When delegation expires
     */
    function grantDelegation(
        bytes32 participantId,
        bytes32 delegate,
        uint256 expiration
    ) external {
        require(expiration > block.timestamp, "Expiration must be future");
        delegations[participantId][delegate] = expiration;
        emit DelegationGranted(participantId, delegate, expiration);
    }
    
    /**
     * @notice Revoke delegation
     * @param delegate ERC-8004 ID of delegate to revoke
     */
    function revokeDelegation(bytes32 participantId, bytes32 delegate) external {
        delegations[participantId][delegate] = 0;
        emit DelegationRevoked(participantId, delegate);
    }
    
    /**
     * @notice Get all memories for a participant
     */
    function getMemories(bytes32 participantId) 
        external 
        view 
        returns (MemoryEntry[] memory) 
    {
        return memories[participantId];
    }
    
    /**
     * @notice Get memory count for participant
     */
    function getMemoryCount(bytes32 participantId) 
        external 
        view 
        returns (uint256) 
    {
        return memories[participantId].length;
    }
    
    /**
     * @notice Check if requester has access to participant's memories
     */
    function hasAccess(bytes32 owner, bytes32 requester) 
        external 
        view 
        returns (bool) 
    {
        if (owner == requester) return true;
        if (delegations[owner][requester] > block.timestamp) return true;
        if (nftAccessEnabled && _hasNFTAccess(requester, owner)) return true;
        return false;
    }
    
    /**
     * @notice Check if requester has NFT-based access
     * @param requesterId Requester's ERC-8004 ID
     * @param ownerId Owner's ERC-8004 ID
     * @return bool Whether NFT grants access
     */
    function _hasNFTAccess(bytes32 requesterId, bytes32 ownerId) internal view returns (bool) {
        if (address(accessNFT) == address(0)) return false;
        
        // Convert bytes32 to address for NFT check
        // Note: In production, you'd want a more robust mapping
        address requesterAddr = address(uint160(uint256(requesterId)));
        
        return accessNFT.hasAccess(requesterAddr, ownerId, "read");
    }
}
