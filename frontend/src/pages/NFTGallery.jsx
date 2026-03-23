import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image, 
  Plus, 
  Clock, 
  Shield, 
  Eye, 
  Edit3, 
  Crown,
  Check,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Lock
} from 'lucide-react'
import { useAccount, useWriteContract, useReadContract, useChainId } from 'wagmi'
import { MemoryAccessNFTABI } from '../contracts/abis'
import { getContractAddress } from '../contracts/addresses'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const accessLevels = [
  { 
    id: 'read', 
    name: 'Read Access', 
    description: 'View memories only',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'write', 
    name: 'Write Access', 
    description: 'View and store memories',
    icon: Edit3,
    color: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'admin', 
    name: 'Admin Access', 
    description: 'Full control including revocation',
    icon: Crown,
    color: 'from-amber-500 to-orange-500'
  }
]

const NFTCard = ({ nft }) => {
  const [flipped, setFlipped] = useState(false)
  const level = accessLevels.find(l => l.id === nft.accessLevel) || accessLevels[0]
  const Icon = level?.icon || Eye
  
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return null
    try {
      return new Date(Number(timestamp) * 1000).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }
  
  const isExpired = nft.expiration && Number(nft.expiration) > 0 && Date.now() > Number(nft.expiration) * 1000
  
  return (
    <motion.div
      className="relative h-96 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
      whileHover={{ scale: 1.02 }}
    >
      <AnimatePresence mode="wait">
        {!flipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: -180 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 nft-card"
          >
            <div className="relative h-full p-6 flex flex-col">
              {/* Card Image */}
              <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-vault-800 to-vault-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-16 h-16 text-white/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-vault-900/80 to-transparent" /
                
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${level.color} text-white`}>
                  {level.name}
                </div>
                
                {isExpired && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">
                    Expired
                  </div>
                )}
              </div>
              
              {/* Card Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Credential #{nft.id}</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Access credential for AI agent memory storage
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Token ID</span>
                    <span className="text-gray-300 font-mono">#{nft.id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Issued</span>
                    <span className="text-gray-300">{formatDate(nft.issuedAt) || 'Unknown'}</span>
                  </div>
                  
                  {nft.expiration > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Expires</span>
                      <span className={isExpired ? 'text-rose-400' : 'text-amber-400'}>
                        {formatDate(nft.expiration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                Click to view details
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            exit={{ rotateY: 180 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 glass-card p-6 flex flex-col"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-4">Access Details</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-vault-800/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${level.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{level.name}</div>
                      <div className="text-xs text-gray-400">{level.description}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Target Agent</span>
                    <span className="text-gray-300 font-mono text-xs">
                      {nft.targetParticipant?.slice(0, 12)}...{nft.targetParticipant?.slice(-8)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Revocable</span>
                    <span className={nft.revocable ? 'text-emerald-400' : 'text-gray-400'}>
                      {nft.revocable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-4 py-3 bg-vault-accent/20 hover:bg-vault-accent/30 text-vault-accent rounded-xl transition-colors flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Manage Access
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const MintModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [recipient, setRecipient] = useState('')
  const [targetParticipant, setTargetParticipant] = useState('')
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending } = useWriteContract()
  
  // Pre-fill target participant with connected address
  useEffect(() => {
    if (address) {
      setTargetParticipant(`0x${address.slice(2).padEnd(64, '0')}`)
    }
  }, [address])
  
  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!recipient || !ethers.isAddress(recipient)) {
      toast.error('Please enter a valid recipient address')
      return
    }
    
    try {
      writeContract({
        address: getContractAddress(chainId, 'MemoryAccessNFT'),
        abi: MemoryAccessNFTABI,
        functionName: 'issueCredential',
        args: [
          recipient,
          targetParticipant || `0x${address.slice(2).padEnd(64, '0')}`,
          0, // expiration - never expires
          selectedLevel.id,
          '', // metadataURI
          true // revocable
        ]
      }, {
        onSuccess: () => {
          toast.success('Access NFT minted successfully!')
          onSuccess?.()
          onClose()
        },
        onError: (error) => {
          console.error('Mint error:', error)
          toast.error(error.message || 'Failed to mint NFT')
        }
      })
    } catch (error) {
      console.error('Mint error:', error)
      toast.error('Failed to mint NFT')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-panel w-full max-w-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Mint Access NFT</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-400 mb-4">Select the access level for this credential:</p>
            
            {accessLevels.map((level) => {
              const Icon = level.icon
              return (
                <button
                  key={level.id}
                  onClick={() => {
                    setSelectedLevel(level)
                    setStep(2)
                  }}
                  className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                    selectedLevel?.id === level.id
                      ? 'border-vault-accent bg-vault-accent/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${level.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="text-left">
                    <div className="font-medium text-white">{level.name}</div>
                    <div className="text-sm text-gray-400">{level.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4">
            <button 
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              ← Back
            </button>
            
            <div className="p-4 rounded-xl bg-vault-800/50">
              <div className="text-sm text-gray-400 mb-1">Selected Access Level</div>
              <div className="font-medium text-white">{selectedLevel?.name}</div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Recipient Address *</label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Target Participant ID (bytes32)</label>
              <input
                type="text"
                placeholder="0x..."
                value={targetParticipant}
                onChange={(e) => setTargetParticipant(e.target.value)}
                className="input-field font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Leave as default to grant access to your memories</p>
            </div>
            
            <button
              onClick={handleMint}
              disabled={!recipient || isPending}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Mint Access NFT
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function NFTGallery() {
  const [showMintModal, setShowMintModal] = useState(false)
  const [credentials, setCredentials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Fetch credentials from contract
  const { data: credentialsData, refetch } = useReadContract({
    address: getContractAddress(chainId, 'MemoryAccessNFT'),
    abi: MemoryAccessNFTABI,
    functionName: 'getCredentialsByOwner',
    args: [address],
    enabled: isConnected && chainId === 84532
  })
  
  // Process credentials data
  useEffect(() => {
    if (!isConnected) {
      setCredentials([])
      setIsLoading(false)
      return
    }
    
    if (credentialsData) {
      const [tokenIds, creds] = credentialsData
      const processed = tokenIds.map((id, index) => ({
        id: Number(id),
        ...creds[index]
      }))
      setCredentials(processed)
      setIsLoading(false)
    } else if (!isLoading) {
      setCredentials([])
    }
  }, [credentialsData, isConnected, isLoading])
  
  // Calculate stats
  const activeCount = credentials.filter(c => 
    !c.expiration || c.expiration === 0n || Date.now() < Number(c.expiration) * 1000
  ).length
  
  const expiringSoon = credentials.filter(c => {
    if (!c.expiration || c.expiration === 0n) return false
    const expiryDate = Number(c.expiration) * 1000
    const daysUntilExpiry = (expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length
  
  const adminCount = credentials.filter(c => c.accessLevel === 'admin').length
  
  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">NFT Access Gallery</h1>
            <p className="text-gray-400">Manage access credentials and permissions for your memories</p>
          </div>
        </div>
        
        <div className="text-center py-20">
          <div className="glass-card p-12 max-w-md mx-auto">
            <Lock className="w-16 h-16 text-vault-accent mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400">
              Connect your wallet to view and manage your NFT access credentials.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">NFT Access Gallery</h1>
          <p className="text-gray-400">Manage access credentials and permissions for your memories</p>
        </div>
        
        <button
          onClick={() => setShowMintModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Mint Access NFT
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total NFTs', value: credentials.length.toString(), icon: Image },
          { label: 'Active', value: activeCount.toString(), icon: Check },
          { label: 'Expiring Soon', value: expiringSoon.toString(), icon: Clock },
          { label: 'Admin Rights', value: adminCount.toString(), icon: Shield },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="glass-card p-4 text-center">
              <div className="flex justify-center mb-2">
                <Icon className="w-5 h-5 text-vault-accent" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Credentials</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-12 h-12 text-vault-accent mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Loading your NFT credentials...</p>
        </div>
      )}

      {/* NFT Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && credentials.length === 0 && (
        <div className="text-center py-20">
          <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Credentials Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            You haven't minted any access credentials yet. Create your first NFT to grant access to other agents.
          </p>
          <button
            onClick={() => setShowMintModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Mint Your First NFT
          </button>
        </div>
      )}

      <AnimatePresence>
        {showMintModal && (
          <MintModal 
            onClose={() => setShowMintModal(false)} 
            onSuccess={() => refetch()}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
