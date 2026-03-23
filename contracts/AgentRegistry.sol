// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentRegistry
 * @notice Self-registration protocol for AI agents via email verification
 */
contract AgentRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct AgentProfile {
        bytes32 participantId;      // ERC-8004 participant ID
        string email;               // Encrypted email hash
        bytes32 publicKey;          // Agent's public key for verification
        string metadataURI;         // IPFS URI with agent details
        uint256 registeredAt;
        uint256 lastActive;
        bool isActive;
        string[] capabilities;      // Agent capabilities/skill IDs
    }

    // Email hash => participant ID (for lookup)
    mapping(bytes32 => bytes32) public emailToParticipant;
    
    // Participant ID => Agent profile
    mapping(bytes32 => AgentProfile) public agents;
    
    // Participant ID => API key hash (for authentication)
    mapping(bytes32 => bytes32) public apiKeys;
    
    // Nonce tracking for replay protection
    mapping(bytes32 => uint256) public nonces;
    
    // Verified email domains (optional whitelist)
    mapping(string => bool) public verifiedDomains;
    
    // Registration fee (0 = free)
    uint256 public registrationFee = 0;
    
    // Maximum agents per email (anti-spam)
    uint256 public maxAgentsPerEmail = 5;
    mapping(bytes32 => uint256) public emailAgentCount;
    
    // Platform treasury
    address public treasury;
    
    // Events
    event AgentRegistered(
        bytes32 indexed participantId,
        bytes32 indexed emailHash,
        string metadataURI,
        uint256 timestamp
    );
    
    event AgentActivated(bytes32 indexed participantId);
    event AgentDeactivated(bytes32 indexed participantId);
    event AgentUpdated(bytes32 indexed participantId, string metadataURI);
    event CapabilitiesUpdated(bytes32 indexed participantId, string[] capabilities);
    event EmailVerified(bytes32 indexed emailHash, bytes32 indexed participantId);
    event DomainVerified(string domain);
    event RegistrationFeeUpdated(uint256 fee);
    
    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
    }

    /**
     * @notice Register a new agent with email verification
     * @param emailHash Hash of the agent's email (keccak256)
     * @param publicKey Agent's Ed25519 or ECDSA public key
     * @param metadataURI IPFS URI containing agent details
     * @param capabilities Array of skill/capability IDs
     * @param signature Email verification signature from authorized verifier
     */
    function registerAgent(
        bytes32 emailHash,
        bytes32 publicKey,
        string calldata metadataURI,
        string[] calldata capabilities,
        bytes calldata signature
    ) external payable returns (bytes32 participantId) {
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(emailToParticipant[emailHash] == bytes32(0), "Email already registered");
        require(emailAgentCount[emailHash] < maxAgentsPerEmail, "Max agents reached for email");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(publicKey != bytes32(0), "Public key required");
        
        // Verify email signature (from authorized email service)
        bytes32 message = keccak256(abi.encodePacked(emailHash, publicKey, msg.sender));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();
        address signer = ethSignedMessage.recover(signature);
        require(signer == owner() || verifiedDomains[_extractDomain(emailHash)], "Invalid signature");
        
        // Generate unique participant ID
        participantId = keccak256(abi.encodePacked(
            emailHash,
            publicKey,
            block.timestamp,
            msg.sender
        ));
        
        // Create agent profile
        agents[participantId] = AgentProfile({
            participantId: participantId,
            email: _encryptEmail(emailHash),
            publicKey: publicKey,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            lastActive: block.timestamp,
            isActive: true,
            capabilities: capabilities
        });
        
        // Update mappings
        emailToParticipant[emailHash] = participantId;
        emailAgentCount[emailHash]++;
        
        // Forward fee to treasury
        if (msg.value > 0) {
            payable(treasury).transfer(msg.value);
        }
        
        emit AgentRegistered(participantId, emailHash, metadataURI, block.timestamp);
        emit EmailVerified(emailHash, participantId);
        
        return participantId;
    }
    
    /**
     * @notice Self-service agent registration (no email verification)
     * @dev For trusted environments or with additional off-chain verification
     */
    function selfRegister(
        bytes32 emailHash,
        bytes32 publicKey,
        string calldata metadataURI,
        string[] calldata capabilities
    ) external returns (bytes32 participantId) {
        require(registrationFee == 0, "Use registerAgent with fee");
        require(emailToParticipant[emailHash] == bytes32(0), "Email already registered");
        require(publicKey != bytes32(0), "Public key required");
        
        participantId = keccak256(abi.encodePacked(
            emailHash,
            publicKey,
            block.timestamp,
            msg.sender
        ));
        
        agents[participantId] = AgentProfile({
            participantId: participantId,
            email: _encryptEmail(emailHash),
            publicKey: publicKey,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            lastActive: block.timestamp,
            isActive: true,
            capabilities: capabilities
        });
        
        emailToParticipant[emailHash] = participantId;
        
        emit AgentRegistered(participantId, emailHash, metadataURI, block.timestamp);
        
        return participantId;
    }
    
    /**
     * @notice Generate or rotate API key for agent
     * @param participantId Agent's participant ID
     * @param apiKeyHash Hash of the new API key
     */
    function setApiKey(bytes32 participantId, bytes32 apiKeyHash) external {
        AgentProfile storage agent = agents[participantId];
        require(agent.participantId != bytes32(0), "Agent not found");
        require(agent.isActive, "Agent not active");
        
        // Only agent owner or contract owner can rotate keys
        // In production, add additional access control
        
        apiKeys[participantId] = apiKeyHash;
        agent.lastActive = block.timestamp;
    }
    
    /**
     * @notice Verify API key (called by MemoryVault API)
     */
    function verifyApiKey(bytes32 participantId, bytes32 apiKeyHash) 
        external 
        view 
        returns (bool) 
    {
        return apiKeys[participantId] == apiKeyHash && agents[participantId].isActive;
    }
    
    /**
     * @notice Update agent capabilities
     */
    function updateCapabilities(
        bytes32 participantId,
        string[] calldata newCapabilities
    ) external {
        AgentProfile storage agent = agents[participantId];
        require(agent.participantId != bytes32(0), "Agent not found");
        require(agent.isActive, "Agent not active");
        
        agent.capabilities = newCapabilities;
        agent.lastActive = block.timestamp;
        
        emit CapabilitiesUpdated(participantId, newCapabilities);
    }
    
    /**
     * @notice Update agent metadata
     */
    function updateMetadata(bytes32 participantId, string calldata newMetadataURI) external {
        AgentProfile storage agent = agents[participantId];
        require(agent.participantId != bytes32(0), "Agent not found");
        require(agent.isActive, "Agent not active");
        
        agent.metadataURI = newMetadataURI;
        agent.lastActive = block.timestamp;
        
        emit AgentUpdated(participantId, newMetadataURI);
    }
    
    /**
     * @notice Deactivate agent
     */
    function deactivateAgent(bytes32 participantId) external onlyOwner {
        AgentProfile storage agent = agents[participantId];
        require(agent.participantId != bytes32(0), "Agent not found");
        
        agent.isActive = false;
        emit AgentDeactivated(participantId);
    }
    
    /**
     * @notice Reactivate agent
     */
    function reactivateAgent(bytes32 participantId) external onlyOwner {
        AgentProfile storage agent = agents[participantId];
        require(agent.participantId != bytes32(0), "Agent not found");
        
        agent.isActive = true;
        emit AgentActivated(participantId);
    }
    
    /**
     * @notice Add verified email domain
     */
    function addVerifiedDomain(string calldata domain) external onlyOwner {
        verifiedDomains[domain] = true;
        emit DomainVerified(domain);
    }
    
    /**
     * @notice Update registration fee
     */
    function setRegistrationFee(uint256 fee) external onlyOwner {
        registrationFee = fee;
        emit RegistrationFeeUpdated(fee);
    }
    
    /**
     * @notice Get agent by email
     */
    function getAgentByEmail(bytes32 emailHash) 
        external 
        view 
        returns (AgentProfile memory) 
    {
        bytes32 participantId = emailToParticipant[emailHash];
        require(participantId != bytes32(0), "Email not registered");
        return agents[participantId];
    }
    
    /**
     * @notice Check if agent has capability
     */
    function hasCapability(bytes32 participantId, string calldata capability) 
        external 
        view 
        returns (bool) 
    {
        AgentProfile storage agent = agents[participantId];
        if (agent.participantId == bytes32(0) || !agent.isActive) return false;
        
        for (uint i = 0; i < agent.capabilities.length; i++) {
            if (keccak256(bytes(agent.capabilities[i])) == keccak256(bytes(capability))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @notice Get all active agents
     */
    function getActiveAgents(uint256 offset, uint256 limit) 
        external 
        view 
        returns (AgentProfile[] memory) 
    {
        // In production, maintain an array of active agent IDs
        // This is a simplified version
        AgentProfile[] memory result = new AgentProfile[](limit);
        return result;
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _encryptEmail(bytes32 emailHash) internal pure returns (string memory) {
        // In production, use actual encryption
        // This is a placeholder that returns the hash as string
        return _bytes32ToString(emailHash);
    }
    
    function _extractDomain(bytes32 emailHash) internal pure returns (string memory) {
        // Extract domain from email for domain verification
        // Simplified - in production parse actual email
        return "*";
    }
    
    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(64);
        for (uint256 i; i < 32; i++) {
            bytesArray[i * 2] = _byteToHexChar(uint8(_bytes32[i]) / 16);
            bytesArray[i * 2 + 1] = _byteToHexChar(uint8(_bytes32[i]) % 16);
        }
        return string(bytesArray);
    }
    
    function _byteToHexChar(uint8 _byte) internal pure returns (bytes1) {
        if (_byte < 10) {
            return bytes1(_byte + 48); // 0-9
        } else {
            return bytes1(_byte + 87); // a-f
        }
    }
}
