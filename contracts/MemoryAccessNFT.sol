// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MemoryAccessNFT
 * @notice NFT-based access credentials for MemoryVault Pro
 * @dev Each NFT grants access to specific memories or memory categories
 */
contract MemoryAccessNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    struct AccessCredential {
        bytes32 targetParticipant;      // Whose memories this grants access to
        uint256 expiration;             // When access expires (0 = never)
        string accessLevel;             // "read", "write", "admin"
        string metadataURI;             // Custom metadata for this credential
        bool revocable;                 // Can the issuer revoke this?
        uint256 issuedAt;               // When this NFT was minted
    }
    
    // tokenId => AccessCredential
    mapping(uint256 => AccessCredential) public credentials;
    
    // participant => delegate => hasActiveCredential (quick check)
    mapping(bytes32 => mapping(bytes32 => bool)) public hasCredential;
    
    uint256 private _nextTokenId;
    
    // MemoryRegistry contract address
    address public memoryRegistry;
    
    // Events
    event CredentialIssued(
        uint256 indexed tokenId,
        bytes32 indexed targetParticipant,
        bytes32 indexed recipient,
        string accessLevel,
        uint256 expiration
    );
    
    event CredentialRevoked(
        uint256 indexed tokenId,
        bytes32 indexed targetParticipant,
        string reason
    );
    
    event CredentialRenewed(
        uint256 indexed tokenId,
        uint256 newExpiration
    );
    
    event RegistryUpdated(address indexed newRegistry);
    
    modifier onlyRegistry() {
        require(msg.sender == memoryRegistry, "Only MemoryRegistry can call");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol,
        address _memoryRegistry
    ) ERC721(name, symbol) Ownable(msg.sender) {
        memoryRegistry = _memoryRegistry;
    }
    
    /**
     * @notice Issue an access credential NFT
     * @param recipient Address to receive the NFT
     * @param targetParticipant Whose memories this grants access to
     * @param expiration When access expires (0 = never)
     * @param accessLevel "read", "write", or "admin"
     * @param metadataURI Custom metadata for this credential
     * @param revocable Can the issuer revoke this credential?
     * @return tokenId The ID of the minted NFT
     */
    function issueCredential(
        address recipient,
        bytes32 targetParticipant,
        uint256 expiration,
        string calldata accessLevel,
        string calldata metadataURI,
        bool revocable
    ) external nonReentrant returns (uint256 tokenId) {
        require(bytes(accessLevel).length > 0, "Access level required");
        require(
            keccak256(bytes(accessLevel)) == keccak256(bytes("read")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("write")) ||
            keccak256(bytes(accessLevel)) == keccak256(bytes("admin")),
            "Invalid access level"
        );
        
        tokenId = _nextTokenId++;
        
        credentials[tokenId] = AccessCredential({
            targetParticipant: targetParticipant,
            expiration: expiration,
            accessLevel: accessLevel,
            metadataURI: metadataURI,
            revocable: revocable,
            issuedAt: block.timestamp
        });
        
        // Mark that this participant has issued a credential to recipient
        bytes32 recipientId = keccak256(abi.encodePacked(recipient));
        hasCredential[targetParticipant][recipientId] = true;
        
        _safeMint(recipient, tokenId);
        
        emit CredentialIssued(
            tokenId,
            targetParticipant,
            recipientId,
            accessLevel,
            expiration
        );
    }
    
    /**
     * @notice Batch issue multiple credentials
     * @param recipients Array of recipient addresses
     * @param targetParticipant Whose memories to grant access to
     * @param expiration When access expires
     * @param accessLevel Access level for all credentials
     * @param revocable Whether credentials are revocable
     * @return tokenIds Array of minted token IDs
     */
    function batchIssueCredentials(
        address[] calldata recipients,
        bytes32 targetParticipant,
        uint256 expiration,
        string calldata accessLevel,
        bool revocable
    ) external nonReentrant returns (uint256[] memory tokenIds) {
        tokenIds = new uint256[](recipients.length);
        
        for (uint i = 0; i < recipients.length; i++) {
            tokenIds[i] = _issueCredentialInternal(
                recipients[i],
                targetParticipant,
                expiration,
                accessLevel,
                "", // empty metadata for batch
                revocable
            );
        }
    }
    
    /**
     * @notice Revoke a credential (only if revocable)
     * @param tokenId The credential to revoke
     * @param reason Reason for revocation
     */
    function revokeCredential(
        uint256 tokenId,
        string calldata reason
    ) external nonReentrant {
        require(_ownerOf(tokenId) != address(0), "Credential does not exist");
        
        AccessCredential storage cred = credentials[tokenId];
        require(cred.revocable, "Credential is not revocable");
        
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || 
            _isAuthorizedToRevoke(msg.sender, cred.targetParticipant),
            "Not authorized to revoke"
        );
        
        bytes32 recipientId = keccak256(abi.encodePacked(owner));
        hasCredential[cred.targetParticipant][recipientId] = false;
        
        _burn(tokenId);
        
        emit CredentialRevoked(tokenId, cred.targetParticipant, reason);
    }
    
    /**
     * @notice Renew/extend a credential's expiration
     * @param tokenId The credential to renew
     * @param newExpiration New expiration timestamp
     */
    function renewCredential(
        uint256 tokenId,
        uint256 newExpiration
    ) external {
        require(_ownerOf(tokenId) != address(0), "Credential does not exist");
        require(
            _isAuthorizedToRenew(msg.sender, tokenId),
            "Not authorized to renew"
        );
        
        AccessCredential storage cred = credentials[tokenId];
        require(newExpiration > cred.expiration, "New expiration must be later");
        
        cred.expiration = newExpiration;
        
        emit CredentialRenewed(tokenId, newExpiration);
    }
    
    /**
     * @notice Check if an address has valid access to a participant's memories
     * @param requester The address requesting access
     * @param targetParticipant The participant whose memories are being accessed
     * @param requiredLevel Minimum access level required
     * @return bool Whether access is granted
     */
    function hasAccess(
        address requester,
        bytes32 targetParticipant,
        string calldata requiredLevel
    ) external view returns (bool) {
        uint256 balance = balanceOf(requester);
        
        for (uint i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(requester, i);
            AccessCredential storage cred = credentials[tokenId];
            
            if (cred.targetParticipant != targetParticipant) {
                continue;
            }
            
            if (cred.expiration > 0 && block.timestamp > cred.expiration) {
                continue;
            }
            
            if (_accessLevelSufficient(cred.accessLevel, requiredLevel)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @notice Get all credentials owned by an address
     * @param owner The address to check
     * @return tokenIds Array of credential IDs
     * @return creds Array of credential details
     */
    function getCredentialsByOwner(
        address owner
    ) external view returns (
        uint256[] memory tokenIds,
        AccessCredential[] memory creds
    ) {
        uint256 balance = balanceOf(owner);
        tokenIds = new uint256[](balance);
        creds = new AccessCredential[](balance);
        
        for (uint i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            tokenIds[i] = tokenId;
            creds[i] = credentials[tokenId];
        }
    }
    
    /**
     * @notice Update the MemoryRegistry address
     * @param newRegistry New registry address
     */
    function updateRegistry(address newRegistry) external onlyOwner {
        memoryRegistry = newRegistry;
        emit RegistryUpdated(newRegistry);
    }
    
    /**
     * @notice Get token URI (overridden to use custom metadata)
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        AccessCredential storage cred = credentials[tokenId];
        
        if (bytes(cred.metadataURI).length > 0) {
            return cred.metadataURI;
        }
        
        return _generateDefaultMetadata(tokenId);
    }
    
    // Internal functions
    
    function _issueCredentialInternal(
        address recipient,
        bytes32 targetParticipant,
        uint256 expiration,
        string memory accessLevel,
        string memory metadataURI,
        bool revocable
    ) internal returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        
        credentials[tokenId] = AccessCredential({
            targetParticipant: targetParticipant,
            expiration: expiration,
            accessLevel: accessLevel,
            metadataURI: metadataURI,
            revocable: revocable,
            issuedAt: block.timestamp
        });
        
        bytes32 recipientId = keccak256(abi.encodePacked(recipient));
        hasCredential[targetParticipant][recipientId] = true;
        
        _safeMint(recipient, tokenId);
        
        emit CredentialIssued(
            tokenId,
            targetParticipant,
            recipientId,
            accessLevel,
            expiration
        );
    }
    
    function _accessLevelSufficient(
        string memory held,
        string memory required
    ) internal pure returns (bool) {
        bytes32 heldHash = keccak256(bytes(held));
        bytes32 requiredHash = keccak256(bytes(required));
        
        if (heldHash == keccak256(bytes("admin"))) {
            return true;
        }
        
        if (heldHash == keccak256(bytes("write"))) {
            return requiredHash == keccak256(bytes("read")) ||
                   requiredHash == keccak256(bytes("write"));
        }
        
        if (heldHash == keccak256(bytes("read"))) {
            return requiredHash == keccak256(bytes("read"));
        }
        
        return false;
    }
    
    function _isAuthorizedToRevoke(
        address sender,
        bytes32 targetParticipant
    ) internal view returns (bool) {
        return sender == owner();
    }
    
    function _isAuthorizedToRenew(
        address sender,
        uint256 tokenId
    ) internal view returns (bool) {
        return ownerOf(tokenId) == sender || sender == owner();
    }
    
    function _generateDefaultMetadata(
        uint256 tokenId
    ) internal view returns (string memory) {
        AccessCredential storage cred = credentials[tokenId];
        
        string memory expirationStr = cred.expiration > 0 ? 
            _toString(cred.expiration) : '"never"';
        
        return string(abi.encodePacked(
            '{"name":"Memory Access Credential #', 
            _toString(tokenId),
            '","description":"Grants ', cred.accessLevel,
            ' access to memories","attributes":[',
            '{"trait_type":"Access Level","value":"', cred.accessLevel, '"},',
            '{"trait_type":"Target","value":"', _toHex(cred.targetParticipant), '"},',
            '{"trait_type":"Expiration","display_type":"date","value":', 
            expirationStr,
            '}]}'
        ));
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _toHex(bytes32 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            buffer[i * 2] = _toHexChar(uint8(value[i]) / 16);
            buffer[i * 2 + 1] = _toHexChar(uint8(value[i]) % 16);
        }
        return string(buffer);
    }
    
    function _toHexChar(uint8 value) internal pure returns (bytes1) {
        if (value < 10) {
            return bytes1(uint8(48 + value));
        }
        return bytes1(uint8(87 + value));
    }
    
    // Required overrides for ERC721Enumerable
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // Update hasCredential mapping when NFT is transferred
        if (from != address(0) && to != address(0)) {
            AccessCredential storage cred = credentials[tokenId];
            
            bytes32 fromId = keccak256(abi.encodePacked(from));
            bytes32 toId = keccak256(abi.encodePacked(to));
            
            hasCredential[cred.targetParticipant][fromId] = false;
            hasCredential[cred.targetParticipant][toId] = true;
        }
        
        return from;
    }
    
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
