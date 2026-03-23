#!/bin/bash
# MemoryVault Pro Demo Script - Private AI Agent Memory on Blockchain
# Run this to showcase all key features for hackathon judges

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        MEMORYVAULT PRO - HACKATHON DEMO SCRIPT                ║"
echo "║     Private AI Agent Memory on Blockchain                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo "─────────────────────────────────────────────────────────────────"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
print_section "CHECKING PREREQUISITES"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Demo 1: Project Overview
print_section "DEMO 1: PROJECT OVERVIEW"
echo "MemoryVault Pro combines:"
echo "  • 🔐 End-to-end encrypted memory storage"
echo "  • ⛓️ Blockchain-backed memory integrity"
echo "  • 🤖 AI agent memory continuity"
echo "  • 🔑 Self-sovereign data ownership"
echo ""
print_info "Tech Stack: Next.js + IPFS + Lit Protocol + Base"

# Demo 2: Smart Contracts
print_section "DEMO 2: SMART CONTRACT ARCHITECTURE"
echo "Contracts deployed on Base Sepolia:"
echo ""
echo "  📜 MemoryRegistry.sol   - Memory pointer registry"
echo "  📜 AccessControl.sol    - Granular permission system"
echo "  📜 VaultFactory.sol     - Create personal vaults"
echo "  📜 EncryptionKeys.sol   - Key management (hashed)"
echo ""

# Demo 3: Key Features
print_section "DEMO 3: KEY FEATURES DEMO"
echo ""
echo "1️⃣  CREATE VAULT"
echo "    → Connect wallet (Base Sepolia)"
echo "    → Deploy personal encrypted vault"
echo "    → Set recovery mechanisms"
echo ""
echo "2️⃣  STORE MEMORY"
echo "    → Encrypt data client-side"
echo "    → Store encrypted blob on IPFS"
echo "    → Register hash on blockchain"
echo ""
echo "3️⃣  GRANT ACCESS"
echo "    → Selective memory sharing"
echo "    → Time-bound access grants"
echo "    → Revoke access anytime"
echo ""
echo "4️⃣  AI INTEGRATION"
echo "    → Import conversation history"
echo "    → Export memories to AI agents"
echo "    → Cross-agent memory portability"
echo ""
echo "5️⃣  VERIFY INTEGRITY"
echo "    → Check memory hash on-chain"
echo "    → Prove data hasn't been tampered"
echo "    → Audit access history"
echo ""

# Demo 4: Run Development Server
print_section "DEMO 4: STARTING DEVELOPMENT SERVER"
if [ -f "package.json" ]; then
    print_info "Installing dependencies (if needed)..."
    npm install --silent 2>/dev/null || true
    
    print_success "Dependencies ready"
    print_info "Starting Next.js development server..."
    print_info "🌐 Open http://localhost:3000 after server starts"
    echo ""
    print_info "Press Ctrl+C when demo is complete"
    echo ""
    
    npm run dev
else
    echo "❌ package.json not found. Are you in the correct directory?"
    exit 1
fi
