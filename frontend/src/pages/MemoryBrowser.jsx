import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Clock, 
  Shield, 
  FileText, 
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Lock,
  Database,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
// date-fns removed - using native Date methods
import { MemoryRegistryABI } from '../contracts/abis'
import { getContractAddress } from '../contracts/addresses'
import { ethers } from 'ethers'

const typeIcons = {
  structured: Database,
  conversation: FileText,
  embedding: Database,
  knowledge: FileText,
  default: FileText
}

const MemoryCard = ({ memory, viewMode }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const Icon = typeIcons[memory.type] || typeIcons.default
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    try {
      const date = new Date(timestamp * 1000)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Invalid date'
    }
  }
  
  const getMemorySize = (cid) => {
    // Simulate size based on CID length (in reality would come from IPFS)
    const hash = cid.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return `${(hash % 100 + 1).toFixed(1)} MB`
  }
  
  if (viewMode === 'list') {
    return (
      <div className="glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-colors group">
        <div className="p-3 rounded-xl bg-vault-700/50">
          <Icon className="w-5 h-5 text-vault-accent" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">Memory #{memory.id}</span>
            {memory.encrypted && <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
            {memory.isShard && <span className="badge badge-warning text-xs">Shard</span>}
          </div>
          <div className="text-xs text-gray-500 font-mono truncate">
            {memory.cid.slice(0, 20)}...{memory.cid.slice(-8)}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400 flex-shrink-0">
          <span>{getMemorySize(memory.cid)}</span>
          <span>{formatDate(memory.timestamp)}</span>
        </div>
        
        <div className="relative flex-shrink-0">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 glass-panel py-1 z-10"
              >
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:bg-white/10 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      layout
      className="glass-card p-5 hover:bg-white/10 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-vault-700/50">
          <Icon className="w-6 h-6 text-vault-accent" />
        </div>
        <div className="flex items-center gap-2">
          {memory.isShard && <span className="badge badge-warning text-xs">Shard</span>}
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
      
      <h3 className="font-semibold text-white mb-2 truncate">Memory #{memory.id}</h3>
      
      <div className="text-xs text-gray-500 font-mono mb-4 truncate">
        {memory.cid.slice(0, 16)}...{memory.cid.slice(-8)}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span>{getMemorySize(memory.cid)}</span>
        <span>{memory.shards || 1} shard{memory.shards !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        <span>{formatDate(memory.timestamp)}</span>
      </div>
    </motion.div>
  )
}

export default function MemoryBrowser() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [filterType, setFilterType] = useState('all')
  const [memories, setMemories] = useState([])
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Convert address to participant ID (bytes32)
  const participantId = address 
    ? `0x${address.slice(2).padEnd(64, '0')}` 
    : '0x0'
  
  // Fetch memory count from contract
  const { data: memoryCount, isLoading: isCountLoading, error: countError } = useReadContract({
    address: getContractAddress(chainId, 'MemoryRegistry'),
    abi: MemoryRegistryABI,
    functionName: 'getMemoryCount',
    args: [participantId],
    enabled: isConnected && chainId === 84532
  })
  
  // Fetch all memories when count changes
  useEffect(() => {
    const fetchMemories = async () => {
      if (!isConnected || !address || !memoryCount || memoryCount === 0n) {
        setMemories([])
        return
      }
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const registry = new ethers.Contract(
          getContractAddress(chainId, 'MemoryRegistry'),
          MemoryRegistryABI,
          signer
        )
        
        const fetchedMemories = []
        for (let i = 0; i < Number(memoryCount); i++) {
          try {
            const memory = await registry.memories(participantId, i)
            fetchedMemories.push({
              id: i,
              cid: memory.cid,
              timestamp: Number(memory.timestamp),
              expiration: Number(memory.expiration),
              isShard: memory.isShard,
              totalShards: Number(memory.totalShards),
              encrypted: true // All memories are encrypted
            })
          } catch (err) {
            console.error(`Failed to fetch memory ${i}:`, err)
          }
        }
        setMemories(fetchedMemories)
      } catch (err) {
        console.error('Failed to fetch memories:', err)
      }
    }
    
    fetchMemories()
  }, [isConnected, address, memoryCount, chainId, participantId])
  
  // Filter memories based on search
  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.cid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.id.toString().includes(searchQuery)
    return matchesSearch
  })
  
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Memory Browser</h1>
            <p className="text-gray-400">Browse and manage your AI agent memories</p>
          </div>
        </div>
        
        <div className="text-center py-20">
          <div className="glass-card p-12 max-w-md mx-auto">
            <Lock className="w-16 h-16 text-vault-accent mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Connect your wallet to view and manage your stored memories.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Memory Browser</h1>
          <p className="text-gray-400">
            {isCountLoading ? 'Loading memories...' : 
             `${memories.length} memory${memories.length !== 1 ? 'ies' : ''} stored`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-vault-accent text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Database className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-vault-accent text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by CID or memory ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-40"
          >
            <option value="all">All Types</option>
            <option value="structured">Structured</option>
            <option value="conversation">Conversation</option>
            <option value="embedding">Embedding</option>
            <option value="knowledge">Knowledge</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {countError && (
        <div className="glass-card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Memories</h3>
          <p className="text-gray-400">{countError.message || 'Unknown error occurred'}</p>
        </div>
      )}

      {/* Loading State */}
      {isCountLoading && (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-12 h-12 text-vault-accent mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading your memories from the blockchain...</p>
        </div>
      )}

      {/* Results */}
      {!isCountLoading && !countError && (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-2'
        }>
          <AnimatePresence>
            {filteredMemories.map((memory) => (
              <MemoryCard 
                key={memory.id} 
                memory={memory} 
                viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Empty State */}
      {!isCountLoading && !countError && filteredMemories.length === 0 && (
        <div className="text-center py-20">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Memories Found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchQuery 
              ? 'No memories match your search criteria.' 
              : 'You haven\'t stored any memories yet. Upload your first memory to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}
