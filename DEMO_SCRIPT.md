# MemoryVault Pro - Demo Script (3-Minute Version)

## Quick Demo Flow (3 Minutes)

### Opening (0:00-0:15)
**[Screen: Landing page with connect button]**

"MemoryVault Pro - decentralized encrypted memory storage for AI agents on Base L2."

### Connect Wallet (0:15-0:30)
**[Action: Click 'Connect MetaMask']**

1. Click "🔌 Connect MetaMask"
2. Approve connection in wallet
3. Show: ✅ Connected status with address

**Key Point:** "One-click connection with automatic Base Sepolia network detection"

### Store a Memory (0:30-1:15)
**[Screen: Store Memory card]**

1. Fill in the form:
   - **Participant ID:** `demo-agent-1`
   - **CID:** `QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o`
   - **Encryption Key Hash:** (leave empty for demo)
   - **Expiration:** 0 (never)

2. Click "📤 Store Memory"

3. **[MetaMask popup]** Approve transaction

4. Show: Success message with transaction hash

**Key Point:** "All memory CIDs are stored on-chain with permanent audit trail on Base"

### Retrieve Memory (1:15-1:45)
**[Screen: Retrieve Memory card]**

1. Enter:
   - **Participant ID:** `demo-agent-1`
   - **Memory ID:** 0

2. Click "📥 Retrieve Memory"

3. Show: Retrieved CID with timestamp

**Key Point:** "Instant retrieval with cryptographic verification of authenticity"

### Mint Access NFT (1:45-2:30)
**[Screen: Mint Access NFT card]**

1. Fill in:
   - **Recipient Address:** [Your second wallet or a friend's]
   - **Target Participant ID:** `demo-agent-1`
   - **Access Level:** Read
   - **Expiration:** 0
   - **Revocable:** ✅ Checked

2. Click "🎨 Mint NFT Credential"

3. **[MetaMask popup]** Approve transaction

4. Show: Success with token ID

**Key Point:** "NFT-based access control - the first truly decentralized permission system for AI memories"

### View Memories & Credentials (2:30-2:50)
**[Screen: My Memories & Credentials sections]**

1. Show the newly stored memory in "My Memories"
2. Show the newly minted NFT in "My Access Credentials"
3. Click refresh buttons to show live data

**Key Point:** "Real-time data with instant blockchain synchronization"

### Wrong Network Handling (2:50-3:00)
**[Action: Switch to wrong network in MetaMask]**

1. Switch to Ethereum Mainnet in wallet
2. Show: ⚠️ Wrong network warning
3. Click "Switch to Base Sepolia" button
4. Show: Auto-switched back

**Key Point:** "Automatic network detection and switching for seamless UX"

---

## Technical Highlights to Mention

### Smart Contracts
- **MemoryRegistry:** `0x7C86CE2F4B394C76c0C5c88EaE99b39AC68Abc73`
- **MemoryAccessNFT:** `0xf387c90612d2086C1870cAef589E660300523aeD`
- **Network:** Base Sepolia (Chain ID: 84532)

### Gas Costs on Base
- Store Memory: ~0.0001 ETH
- Mint NFT: ~0.0002 ETH
- Retrieve: Free (view function)

### Security Features
- ✅ OpenZeppelin Ownable & ReentrancyGuard
- ✅ Input validation on all functions
- ✅ Access control with delegation
- ✅ Expiration support

---

## Troubleshooting Demo Issues

### "Contract validation failed"
- Make sure you're on Base Sepolia network
- Check wallet has test ETH

### "Transaction failed"
- Check gas settings
- Ensure inputs are valid

### "No accounts found"
- Unlock MetaMask
- Refresh page and reconnect

---

## Post-Demo Talking Points

1. **Scale:** Built for millions of AI agents
2. **Privacy:** Encryption key hashes stored, keys stay off-chain
3. **Composability:** Any contract can verify access via NFT
4. **Future:** Multi-chain support, TEE integration, Filecoin sharding

---

**Live Demo URL:** https://memoryvault-pro.vercel.app

**GitHub:** https://github.com/memoryvault-pro/memoryvault-pro

**Built for:** ETHGlobal / Base Hackathons
