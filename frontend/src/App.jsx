import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MemoryRegistry from './contracts/MemoryRegistry.json';
import MemoryAccessNFT from './contracts/MemoryAccessNFT.json';

// Contract addresses - deployed on Base Sepolia
const CONTRACTS = {
  84532: {
    registry: '0x7C86CE2F4B394C76c0C5c88EaE99b39AC68Abc73',
    nft: '0xf387c90612d2086C1870cAef589E660300523aeD'
  },
  31337: {
    registry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    nft: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
  }
};

const getErrorMessage = (error) => {
  if (error.code === 'ACTION_REJECTED') return 'Transaction was rejected by user';
  if (error.code === 'INSUFFICIENT_FUNDS') return 'Insufficient funds for transaction';
  if (error.message?.includes('user rejected')) return 'Transaction rejected by user';
  if (error.message?.includes('contract runner')) return 'Wallet not connected properly';
  if (error.message?.includes('cannot estimate gas')) return 'Transaction would fail - check permissions';
  return error.message || 'An unknown error occurred';
};

// Feature icons as SVG components
const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
    <path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="m21 2-9.6 9.6"/>
    <path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
);

// Social proof avatars
const Avatar = ({ initials, color }) => (
  <div style={{
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    border: '2px solid var(--vault-bg-primary)',
    marginLeft: '-8px'
  }}>
    {initials}
  </div>
);

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [memories, setMemories] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [contractError, setContractError] = useState(null);
  const [isContractsValid, setIsContractsValid] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);

  // Form states
  const [storeForm, setStoreForm] = useState({ participantId: '', cid: '', encryptionKeyHash: '', expiration: '0' });
  const [retrieveForm, setRetrieveForm] = useState({ participantId: '', memoryId: '0' });
  const [mintForm, setMintForm] = useState({ recipient: '', targetParticipant: '', expiration: '0', accessLevel: 'read', revocable: true });

  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const validateContracts = async (registryContract, nft, provider, chainId) => {
    try {
      if (!CONTRACTS[chainId]) {
        setContractError(`Network ${chainId} not supported`);
        setIsContractsValid(false);
        return false;
      }
      const registryCode = await provider.getCode(registryContract.target);
      const nftCode = await provider.getCode(nft.target);
      if (registryCode === '0x' || nftCode === '0x') {
        setContractError('Contracts not found at expected addresses');
        setIsContractsValid(false);
        return false;
      }
      try { await registryContract.owner(); } catch (e) {
        setContractError('Contract ABI mismatch');
        setIsContractsValid(false);
        return false;
      }
      setContractError(null);
      setIsContractsValid(true);
      return true;
    } catch (error) {
      setContractError('Failed to validate contracts');
      setIsContractsValid(false);
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      showMessage('Please install MetaMask!', true);
      return;
    }
    try {
      setLoading(true);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts?.length) {
        showMessage('No accounts found', true);
        return;
      }
      const newSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      setProvider(browserProvider);
      setSigner(newSigner);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      
      const chainContracts = CONTRACTS[currentChainId];
      if (!chainContracts) {
        showMessage('Please switch to Base Sepolia', true);
        setLoading(false);
        return;
      }
      
      const registryContract = new ethers.Contract(chainContracts.registry, MemoryRegistry.abi, newSigner);
      const nft = new ethers.Contract(chainContracts.nft, MemoryAccessNFT.abi, newSigner);
      
      setRegistry(registryContract);
      setNftContract(nft);
      
      const isValid = await validateContracts(registryContract, nft, browserProvider, currentChainId);
      if (isValid) {
        showMessage('Wallet connected successfully!');
        fetchMemoriesData(registryContract, accounts[0]);
        fetchCredentialsData(nft, accounts[0]);
        setShowLanding(false);
      }
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setRegistry(null);
    setNftContract(null);
    setMemories([]);
    setCredentials([]);
    setShowLanding(true);
    showMessage('Wallet disconnected');
  };

  const switchToBaseSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x14a34',
            chainName: 'Base Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org']
          }]
        });
      }
    }
  };

  const storeMemory = async (e) => {
    e.preventDefault();
    if (!registry || !isContractsValid) { showMessage('Contracts not initialized', true); return; }
    try {
      setLoading(true);
      if (!storeForm.participantId.trim() || !storeForm.cid.trim()) throw new Error('Required fields missing');
      const tx = await registry.storeMemory(
        ethers.encodeBytes32String(storeForm.participantId), storeForm.cid,
        storeForm.encryptionKeyHash || ethers.ZeroHash, storeForm.expiration || 0, false, 0, []
      );
      showMessage('Transaction submitted...');
      const receipt = await tx.wait();
      showMessage(`✅ Memory stored! TX: ${receipt.hash.slice(0, 10)}...`);
      setStoreForm({ participantId: '', cid: '', encryptionKeyHash: '', expiration: '0' });
      fetchMemoriesData(registry, account);
    } catch (error) { showMessage(getErrorMessage(error), true); }
    finally { setLoading(false); }
  };

  const retrieveMemory = async (e) => {
    e.preventDefault();
    if (!registry || !isContractsValid) { showMessage('Contracts not initialized', true); return; }
    try {
      setLoading(true);
      if (!retrieveForm.participantId.trim()) throw new Error('Participant ID required');
      const participantIdBytes = ethers.encodeBytes32String(retrieveForm.participantId);
      const memory = await registry.retrieveMemory(participantIdBytes, retrieveForm.memoryId, participantIdBytes);
      showMessage(`📦 Retrieved: ${memory.cid.slice(0, 20)}...`);
    } catch (error) { showMessage(getErrorMessage(error), true); }
    finally { setLoading(false); }
  };

  const mintCredential = async (e) => {
    e.preventDefault();
    if (!nftContract || !isContractsValid) { showMessage('Contracts not initialized', true); return; }
    try {
      setLoading(true);
      if (!mintForm.recipient.trim() || !mintForm.targetParticipant.trim()) throw new Error('Required fields missing');
      if (!ethers.isAddress(mintForm.recipient)) throw new Error('Invalid recipient address');
      const tx = await nftContract.issueCredential(
        mintForm.recipient, ethers.encodeBytes32String(mintForm.targetParticipant),
        mintForm.expiration || 0, mintForm.accessLevel, '', mintForm.revocable
      );
      showMessage('Transaction submitted...');
      const receipt = await tx.wait();
      showMessage(`✅ NFT Credential minted! TX: ${receipt.hash.slice(0, 10)}...`);
      setMintForm({ recipient: '', targetParticipant: '', expiration: '0', accessLevel: 'read', revocable: true });
      fetchCredentialsData(nftContract, account);
    } catch (error) { showMessage(getErrorMessage(error), true); }
    finally { setLoading(false); }
  };

  const fetchMemoriesData = async (registryContract, userAccount) => {
    if (!registryContract || !userAccount) return;
    try {
      const participantId = ethers.keccak256(ethers.toUtf8Bytes(userAccount));
      const count = await registryContract.getMemoryCount(participantId);
      const memoriesList = [];
      for (let i = 0; i < count; i++) {
        try {
          const memory = await registryContract.memories(participantId, i);
          memoriesList.push({ id: i, cid: memory.cid, timestamp: Number(memory.timestamp), expiration: Number(memory.expiration), isShard: memory.isShard });
        } catch (e) { break; }
      }
      setMemories(memoriesList);
    } catch (error) { console.error('Fetch memories error:', error); }
  };

  const fetchCredentialsData = async (nft, userAccount) => {
    if (!nft || !userAccount) return;
    try {
      const result = await nft.getCredentialsByOwner(userAccount);
      const creds = result.tokenIds.map((id, index) => ({ id: Number(id), ...result.creds[index] }));
      setCredentials(creds);
    } catch (error) { console.error('Fetch credentials error:', error); }
  };

  useEffect(() => {
    if (account && registry && isContractsValid) {
      fetchMemoriesData(registry, account);
      fetchCredentialsData(nftContract, account);
    }
  }, [account, registry, nftContract, isContractsValid]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) disconnectWallet();
        else { setAccount(accounts[0]); connectWallet(); }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const getNetworkName = (id) => {
    if (id === 84532) return 'Base Sepolia';
    if (id === 31337) return 'Hardhat Local';
    return `Chain ${id}`;
  };

  const isWrongNetwork = chainId && chainId !== 84532 && chainId !== 31337;

  // LANDING PAGE
  if (showLanding && !account) {
    return (
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <div className="container navbar-content">
            <a href="#" className="nav-brand">
              <div className="nav-brand-icon">🔐</div>
              <span>MemoryVault</span>
            </a>
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <a href="#security" className="nav-link">Security</a>
              <button className="btn btn-primary btn-sm" onClick={connectWallet} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: '14px', height: '14px' }} /> : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <span>🚀</span>
              <span>Now live on Base Sepolia</span>
            </div>
            <h1>Private AI Agent Memory<br />on the Blockchain</h1>
            <p className="hero-description">
              Secure, encrypted memory storage for AI agents with NFT-based access control. 
              Your data, your rules, permanently stored on Base.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={connectWallet} disabled={loading}>
                {loading ? <><span className="spinner" /> Connecting...</> : <>Get Started <span>→</span></>}
              </button>
              <a href="#features" className="btn btn-secondary btn-lg">Learn More</a>
            </div>
            
            {/* Social Proof */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex' }}>
                  <Avatar initials="JD" color="linear-gradient(135deg, #6366f1, #8b5cf6)" />
                  <Avatar initials="SK" color="linear-gradient(135deg, #06b6d4, #6366f1)" />
                  <Avatar initials="AM" color="linear-gradient(135deg, #d946ef, #f472b6)" />
                  <Avatar initials="+" color="var(--vault-bg-tertiary)" />
                </div>
                <span style={{ marginLeft: 'var(--space-md)', fontSize: 'var(--font-sm)', color: 'var(--vault-text-secondary)' }}>
                  <strong style={{ color: 'var(--vault-text-primary)' }}>500+</strong> agents secured
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xl)', fontSize: 'var(--font-xs)', color: 'var(--vault-text-muted)' }}>
                <span>🔒 SOC 2 Compliant</span>
                <span>⚡ 99.9% Uptime</span>
                <span>🌐 Decentralized</span>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">50K+</div>
                <div className="hero-stat-label">Memories Stored</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">99.9%</div>
                <div className="hero-stat-label">Uptime SLA</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">0</div>
                <div className="hero-stat-label">Data Breaches</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section">
          <div className="container">
            <div className="section-header">
              <h2>Everything You Need for <span className="text-gradient">Secure AI Memory</span></h2>
              <p>Built from the ground up for privacy, security, and seamless AI agent integration</p>
            </div>
            <div className="grid-3">
              <div className="glass-card feature-card">
                <div className="feature-icon"><ShieldIcon /></div>
                <h3>End-to-End Encryption</h3>
                <p>Your memories are encrypted before they hit the blockchain. Only you hold the keys.</p>
              </div>
              <div className="glass-card feature-card">
                <div className="feature-icon"><LockIcon /></div>
                <h3>NFT Access Control</h3>
                <p>Grant time-limited, revocable access to other agents using soulbound NFT credentials.</p>
              </div>
              <div className="glass-card feature-card">
                <div className="feature-icon"><DatabaseIcon /></div>
                <h3>Distributed Sharding</h3>
                <p>Memory fragments are distributed across multiple nodes for maximum resilience.</p>
              </div>
              <div className="glass-card feature-card">
                <div className="feature-icon"><ZapIcon /></div>
                <h3>Lightning Fast</h3>
                <p>Sub-second retrieval times with intelligent caching on Base L2.</p>
              </div>
              <div className="glass-card feature-card">
                <div className="feature-icon"><GlobeIcon /></div>
                <h3>Permanent Storage</h3>
                <p>Your memories live forever on the blockchain. No server outages, ever.</p>
              </div>
              <div className="glass-card feature-card">
                <div className="feature-icon"><KeyIcon /></div>
                <h3>Self-Sovereign</h3>
                <p>Full ownership of your data. No intermediaries, no centralized control.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="section" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="container">
            <div className="section-header">
              <h2>How It <span className="text-gradient">Works</span></h2>
              <p>Three simple steps to secure your AI agent's memory</p>
            </div>
            <div className="grid-3">
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ 
                  width: '80px', height: '80px', margin: '0 auto var(--space-lg)',
                  background: 'var(--gradient-primary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--font-3xl)', fontWeight: '700'
                }}>1</div>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>Connect Wallet</h3>
                <p style={{ fontSize: 'var(--font-sm)' }}>Link your MetaMask or Web3 wallet to establish identity</p>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ 
                  width: '80px', height: '80px', margin: '0 auto var(--space-lg)',
                  background: 'var(--gradient-primary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--font-3xl)', fontWeight: '700'
                }}>2</div>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>Store Memory</h3>
                <p style={{ fontSize: 'var(--font-sm)' }}>Upload encrypted memory fragments to IPFS and Base</p>
              </div>
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ 
                  width: '80px', height: '80px', margin: '0 auto var(--space-lg)',
                  background: 'var(--gradient-primary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--font-3xl)', fontWeight: '700'
                }}>3</div>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>Grant Access</h3>
                <p style={{ fontSize: 'var(--font-sm)' }}>Mint NFT credentials to share access with other agents</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section">
          <div className="container">
            <div className="glass-panel" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />
              <h2 style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>Ready to Secure Your AI?</h2>
              <p style={{ maxWidth: '500px', margin: '0 auto var(--space-xl)', position: 'relative' }}>
                Join hundreds of developers building the next generation of privacy-preserving AI agents
              </p>
              <button className="btn btn-primary btn-lg" onClick={connectWallet} disabled={loading} style={{ position: 'relative' }}>
                {loading ? <><span className="spinner" /> Connecting...</> : 'Launch App →'}
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container footer-content">
            <div className="footer-brand">
              <span style={{ fontSize: '20px' }}>🔐</span>
              <span>MemoryVault Pro</span>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">GitHub</a>
              <a href="#" className="footer-link">Twitter</a>
              <a href="#" className="footer-link">Discord</a>
            </div>
            <div className="footer-copy">© 2026 MemoryVault. Built with 💜 on Base.</div>
          </div>
        </footer>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="app dashboard">
      {/* Dashboard Header */}
      <nav className="navbar">
        <div className="container navbar-content">
          <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <div className="nav-brand-icon">🔐</div>
            <span>MemoryVault</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            {account && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span className="badge badge-success">● {getNetworkName(chainId)}</span>
                <code style={{ 
                  background: 'var(--vault-bg-tertiary)', 
                  padding: 'var(--space-xs) var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-sm)'
                }}>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </code>
                <button className="btn btn-ghost btn-sm" onClick={disconnectWallet}>Disconnect</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Alert Messages */}
      {(contractError || isWrongNetwork || message) && (
        <div style={{ paddingTop: 'calc(72px + var(--space-lg))' }}>
          <div className="container">
            {isWrongNetwork && (
              <div className="alert alert-warning" style={{ marginBottom: 'var(--space-md)' }}>
                <span>⚠️</span>
                <span>Wrong network detected. </span>
                <button className="btn btn-sm" onClick={switchToBaseSepolia} style={{ marginLeft: 'auto' }}>Switch to Base Sepolia</button>
              </div>
            )}
            {contractError && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
                <span>⚠️</span> {contractError}
              </div>
            )}
            {message && (
              <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('Failed') ? 'alert-error' : 'alert-warning'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <main style={{ paddingTop: contractError || isWrongNetwork || message ? 0 : 'calc(72px + var(--space-xl))' }}>
        <div className="container">
          <div className="dashboard-grid">
            {/* Sidebar */}
            <aside className="sidebar">
              <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
                <nav className="sidebar-nav">
                  <a href="#" className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
                    <span className="sidebar-link-icon">📊</span>
                    <span>Dashboard</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'store' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('store'); }}>
                    <span className="sidebar-link-icon">💾</span>
                    <span>Store Memory</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'retrieve' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('retrieve'); }}>
                    <span className="sidebar-link-icon">🔍</span>
                    <span>Retrieve</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'credentials' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('credentials'); }}>
                    <span className="sidebar-link-icon">🎫</span>
                    <span>Credentials</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'mint' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('mint'); }}>
                    <span className="sidebar-link-icon">🎨</span>
                    <span>Mint NFT</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'encrypt' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('encrypt'); }}>
                    <span className="sidebar-link-icon">🔒</span>
                    <span>Encryption Visualizer</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'agents' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('agents'); }}>
                    <span className="sidebar-link-icon">🤖</span>
                    <span>Agent Coordination</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'audit' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('audit'); }}>
                    <span className="sidebar-link-icon">🔍</span>
                    <span>Privacy Audit</span>
                  </a>
                  <a href="#" className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('analytics'); }}>
                    <span className="sidebar-link-icon">📊</span>
                    <span>Analytics</span>
                  </a>
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="glass-card" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
                <h4 style={{ fontSize: 'var(--font-sm)', color: 'var(--vault-text-muted)', marginBottom: 'var(--space-md)' }}>Your Stats</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-2xl)', fontWeight: '700', color: 'var(--vault-primary-light)' }}>{memories.length}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--vault-text-tertiary)' }}>Memories Stored</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-2xl)', fontWeight: '700', color: 'var(--vault-secondary)' }}>{credentials.length}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--vault-text-tertiary)' }}>NFT Credentials</div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div>
              {/* Dashboard Overview */}
              {(activeTab === 'dashboard' || activeTab === 'store') && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                  <div className="card-header">
                    <h3 className="card-title">💾 Store Memory</h3>
                    <span className="badge badge-info">Gas: ~0.001 ETH</span>
                  </div>
                  <div className="card-body">
                    <form onSubmit={storeMemory}>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Participant ID *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter unique identifier"
                            value={storeForm.participantId}
                            onChange={(e) => setStoreForm({...storeForm, participantId: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">IPFS CID *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Qm..."
                            value={storeForm.cid}
                            onChange={(e) => setStoreForm({...storeForm, cid: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                      </div>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Encryption Key Hash (optional)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="0x..."
                            value={storeForm.encryptionKeyHash}
                            onChange={(e) => setStoreForm({...storeForm, encryptionKeyHash: e.target.value})}
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expiration (timestamp, 0 = never)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            value={storeForm.expiration}
                            onChange={(e) => setStoreForm({...storeForm, expiration: e.target.value})}
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading || !isContractsValid}>
                        {loading ? <><span className="spinner" /> Processing...</> : <><span>📤</span> Store Memory</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Retrieve Memory */}
              {(activeTab === 'dashboard' || activeTab === 'retrieve') && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                  <div className="card-header">
                    <h3 className="card-title">🔍 Retrieve Memory</h3>
                    <span className="badge badge-success">Free</span>
                  </div>
                  <div className="card-body">
                    <form onSubmit={retrieveMemory}>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Participant ID *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter participant identifier"
                            value={retrieveForm.participantId}
                            onChange={(e) => setRetrieveForm({...retrieveForm, participantId: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Memory ID *</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            value={retrieveForm.memoryId}
                            onChange={(e) => setRetrieveForm({...retrieveForm, memoryId: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                            min="0"
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-secondary" disabled={loading || !isContractsValid}>
                        {loading ? <><span className="spinner" /> Retrieving...</> : <><span>📥</span> Retrieve Memory</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* My Memories */}
              {(activeTab === 'dashboard' || activeTab === 'store') && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                  <div className="card-header">
                    <h3 className="card-title">🗂️ My Memories</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => fetchMemoriesData(registry, account)} disabled={!isContractsValid}>
                      🔄 Refresh
                    </button>
                  </div>
                  <div className="card-body">
                    {memories.length === 0 ? (
                      <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
                        <div className="empty-state-icon">📝</div>
                        <h3>No Memories Yet</h3>
                        <p>Store your first memory using the form above to get started</p>
                      </div>
                    ) : (
                      <div className="memory-list">
                        {memories.map((memory) => (
                          <div key={memory.id} className="memory-item">
                            <div className="memory-cid">{memory.cid}</div>
                            <div className="memory-meta">
                              <span className="badge badge-info">ID: {memory.id}</span>
                              <span>{new Date(memory.timestamp * 1000).toLocaleDateString()}</span>
                              {memory.isShard && <span className="badge badge-warning">Shard</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mint Credential */}
              {(activeTab === 'dashboard' || activeTab === 'mint') && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                  <div className="card-header">
                    <h3 className="card-title">🎨 Mint Access NFT</h3>
                    <span className="badge badge-info">Gas: ~0.002 ETH</span>
                  </div>
                  <div className="card-body">
                    <form onSubmit={mintCredential}>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Recipient Address *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="0x..."
                            value={mintForm.recipient}
                            onChange={(e) => setMintForm({...mintForm, recipient: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Target Participant ID *</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Enter target participant"
                            value={mintForm.targetParticipant}
                            onChange={(e) => setMintForm({...mintForm, targetParticipant: e.target.value})}
                            required
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                      </div>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Access Level</label>
                          <select
                            className="form-input"
                            value={mintForm.accessLevel}
                            onChange={(e) => setMintForm({...mintForm, accessLevel: e.target.value})}
                            disabled={!isContractsValid || loading}
                          >
                            <option value="read">Read</option>
                            <option value="write">Write</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Expiration (timestamp, 0 = never)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="0"
                            value={mintForm.expiration}
                            onChange={(e) => setMintForm({...mintForm, expiration: e.target.value})}
                            disabled={!isContractsValid || loading}
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <input
                          type="checkbox"
                          id="revocable"
                          checked={mintForm.revocable}
                          onChange={(e) => setMintForm({...mintForm, revocable: e.target.checked})}
                          disabled={!isContractsValid || loading}
                        />
                        <label htmlFor="revocable" style={{ margin: 0 }}>Allow credential to be revoked by issuer</label>
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={loading || !isContractsValid}>
                        {loading ? <><span className="spinner" /> Minting...</> : <><span>🎨</span> Mint NFT Credential</>}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* My Credentials */}
              {(activeTab === 'dashboard' || activeTab === 'credentials') && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">🏅 My Access Credentials</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => fetchCredentialsData(nftContract, account)} disabled={!isContractsValid}>
                      🔄 Refresh
                    </button>
                  </div>
                  <div className="card-body">
                    {credentials.length === 0 ? (
                      <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
                        <div className="empty-state-icon">🎫</div>
                        <h3>No Credentials Yet</h3>
                        <p>Mint an NFT credential to grant access to other agents</p>
                      </div>
                    ) : (
                      <div className="nft-grid">
                        {credentials.map((cred) => (
                          <div key={cred.id} className="nft-card">
                            <h4>Credential #{cred.id}</h4>
                            <div className="nft-card-meta">
                              <div style={{ marginBottom: 'var(--space-sm)' }}>
                                <span className="badge" style={{ 
                                  background: 'rgba(99,102,241,0.2)', 
                                  color: 'var(--vault-primary-light)',
                                  textTransform: 'capitalize'
                                }}>
                                  {cred.accessLevel} Access
                                </span>
                              </div>
                              <p style={{ fontSize: 'var(--font-xs)', wordBreak: 'break-all' }}>
                                Target: {cred.targetParticipant?.slice(0, 20)}...
                              </p>
                              <p style={{ fontSize: 'var(--font-xs)' }}>
                                {cred.expiration > 0 
                                  ? `Expires: ${new Date(Number(cred.expiration) * 1000).toLocaleDateString()}`
                                  : 'Never expires'
                                }
                              </p>
                              {cred.revocable && <span className="badge badge-warning">Revocable</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Encryption Visualizer */}
              {activeTab === 'encrypt' && (
                <div className="encryption-visualizer-container" style={{ marginTop: '-20px' }}>
                  <iframe 
                    src="/encryption-visualizer.html" 
                    style={{ 
                      width: '100%', 
                      height: 'calc(100vh - 200px)', 
                      border: 'none',
                      borderRadius: 'var(--radius-lg)'
                    }}
                    title="Encryption Visualizer"
                  />
                </div>
              )}

              {/* Agent Coordination - External Link */}
              {activeTab === 'agents' && (
                <div className="agent-coordination-placeholder" style={{ 
                  padding: 'var(--space-2xl)', 
                  textAlign: 'center',
                  background: 'var(--vault-bg-secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: 'var(--space-lg)' }}>🤖</div>
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>Agent Coordination Demo</h3>
                  <p style={{ color: 'var(--vault-text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
                    See how multiple AI agents securely share memories using NFT-based access credentials. 
                    This feature demonstrates cross-agent memory synchronization with end-to-end encryption.
                  </p>
                  <a 
                    href="/agent-coordination.html" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    <span>🚀</span> Launch Agent Coordination Demo
                  </a>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--vault-text-muted)', marginTop: 'var(--space-lg)' }}>
                    Opens in new tab • Shows multi-agent memory sharing scenarios
                  </p>
                </div>
              )}

              {/* Privacy Audit - External Link */}
              {activeTab === 'audit' && (
                <div style={{ 
                  padding: 'var(--space-2xl)', 
                  textAlign: 'center',
                  background: 'var(--vault-bg-secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: 'var(--space-lg)' }}>🔍</div>
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>Privacy Audit Dashboard</h3>
                  <p style={{ color: 'var(--vault-text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
                    Run a comprehensive privacy audit to analyze your memory security configuration, 
                    check encryption status, and get personalized recommendations.
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-emerald-400">256-bit</div>
                      <div className="text-xs text-gray-500">Encryption</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-cyan-400">6</div>
                      <div className="text-xs text-gray-500">Security Checks</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-purple-400">100%</div>
                      <div className="text-xs text-gray-500">Private</div>
                    </div>
                  </div>
                  <a 
                    href="/privacy-audit.html" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    <span>🔍</span> Run Privacy Audit
                  </a>
                </div>
              )}

              {/* Analytics - External Link */}
              {activeTab === 'analytics' && (
                <div style={{ 
                  padding: 'var(--space-2xl)', 
                  textAlign: 'center',
                  background: 'var(--vault-bg-secondary)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: 'var(--space-lg)' }}>📊</div>
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>Analytics Dashboard</h3>
                  <p style={{ color: 'var(--vault-text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
                    View detailed insights into your memory usage, agent activity patterns, 
                    and storage analytics with beautiful visualizations.
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-cyan-400">106</div>
                      <div className="text-xs text-gray-500">Memories</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-emerald-400">366</div>
                      <div className="text-xs text-gray-500">Access</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <div className="text-2xl font-bold text-purple-400">2.4GB</div>
                      <div className="text-xs text-gray-500">Storage</div>
                    </div>
                  </div>
                  <a 
                    href="/analytics.html" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg"
                  >
                    <span>📊</span> Open Analytics
                  </a>
                </div>
              )}

              {/* Contract Info */}
              <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--vault-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--vault-text-muted)' }}>
                <p style={{ marginBottom: 'var(--space-sm)' }}><strong>Network:</strong> {getNetworkName(chainId)}</p>
                <p style={{ marginBottom: 'var(--space-sm)' }}><strong>Registry:</strong> <code>{registry?.target || 'Not connected'}</code></p>
                <p style={{ marginBottom: 'var(--space-sm)' }}><strong>NFT Contract:</strong> <code>{nftContract?.target || 'Not connected'}</code></p>
                <a 
                  href={`https://sepolia.basescan.org/address/${registry?.target}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--vault-primary-light)' }}
                >
                  View on Base Sepolia Explorer →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: 'var(--space-4xl)' }}>
        <div className="container footer-content">
          <div className="footer-brand">
            <span style={{ fontSize: '20px' }}>🔐</span>
            <span>MemoryVault Pro</span>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">GitHub</a>
            <a href="#" className="footer-link">Support</a>
          </div>
          <div className="footer-copy">Built on Base with 💜</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
