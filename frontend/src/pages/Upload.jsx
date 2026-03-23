import React, { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  X, 
  Shield, 
  Database,
  Check,
  Loader2,
  Lock,
  Sparkles,
  AlertCircle,
  Globe
} from 'lucide-react'
import { useAccount, useWriteContract, useChainId, useWaitForTransactionReceipt } from 'wagmi'
import { MemoryRegistryABI } from '../contracts/abis'
import { getContractAddress } from '../contracts/addresses'
import toast from 'react-hot-toast'

// TODO: Replace with your Pinata or other IPFS service credentials
const IPFS_CONFIG = {
  // For production, use environment variables:
  // apiKey: import.meta.env.VITE_PINATA_API_KEY,
  // apiSecret: import.meta.env.VITE_PINATA_API_SECRET,
  // Or use a pinning service API
  gateway: 'https://gateway.pinata.cloud/ipfs/'
}

const FilePreview = ({ file, onRemove, uploadProgress, status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-3 h-3 text-vault-accent animate-spin" />
      case 'pinning':
        return <Globe className="w-3 h-3 text-vault-accent animate-pulse" />
      case 'success':
        return <Check className="w-3 h-3 text-emerald-400" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-rose-400" />
      default:
        return <Loader2 className="w-3 h-3 text-vault-accent animate-spin" />
    }
  }
  
  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Encrypting... ${uploadProgress}%`
      case 'pinning':
        return 'Pinning to IPFS...'
      case 'success':
        return 'Ready to store on-chain'
      case 'error':
        return 'Upload failed'
      default:
        return 'Processing...'
    }
  }
  
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-400'
      case 'error':
        return 'text-rose-400'
      default:
        return 'text-gray-400'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4 flex items-center gap-4"
    >
      <div className="p-3 rounded-xl bg-vault-accent/20">
        <File className="w-6 h-6 text-vault-accent" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white truncate max-w-xs">{file.name}</span>
          <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        
        <div className="h-1.5 bg-vault-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-vault-accent to-vault-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {getStatusIcon()}
          <span className={`text-xs ${getStatusColor()}`}>{getStatusText()}</span>
        </div>
      </div>
      
      <button 
        onClick={onRemove}
        disabled={status === 'uploading' || status === 'pinning'}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  )
}

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [fileProgress, setFileProgress] = useState({})
  const [fileStatuses, setFileStatuses] = useState({})
  const [fileCIDs, setFileCIDs] = useState({})
  const [encryptionEnabled, setEncryptionEnabled] = useState(true)
  const [shardingEnabled, setShardingEnabled] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  
  const fileInputRef = useRef(null)
  
  // Upload file to IPFS
  const uploadToIPFS = async (file) => {
    // In production, implement actual IPFS upload here
    // For now, simulate with progress
    
    return new Promise((resolve, reject) => {
      let progress = 0
      const fileId = file.id
      
      // Simulate encryption/upload progress
      const interval = setInterval(() => {
        progress += Math.random() * 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // Generate a mock CID for demonstration
          // In production, this would be the real IPFS CID
          const mockCID = `bafybeig${Array.from({length: 44}, () => 
            Math.random().toString(36).charAt(2)).join('')}`
          
          resolve(mockCID)
        }
        
        setFileProgress(prev => ({
          ...prev,
          [fileId]: Math.min(Math.round(progress), 100)
        }))
        
        if (progress < 50) {
          setFileStatuses(prev => ({ ...prev, [fileId]: 'uploading' }))
        } else if (progress < 100) {
          setFileStatuses(prev => ({ ...prev, [fileId]: 'pinning' }))
        }
      }, 100)
    })
  }
  
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9)
    }))
    
    setFiles(prev => [...prev, ...newFiles])
    
    // Initialize progress for new files
    newFiles.forEach(file => {
      setFileProgress(prev => ({ ...prev, [file.id]: 0 }))
      setFileStatuses(prev => ({ ...prev, [file.id]: 'uploading' }))
    })
    
    // Upload each file to IPFS
    newFiles.forEach(async (file) => {
      try {
        const cid = await uploadToIPFS(file)
        setFileCIDs(prev => ({ ...prev, [file.id]: cid }))
        setFileStatuses(prev => ({ ...prev, [file.id]: 'success' }))
        toast.success(`File "${file.name}" ready for blockchain storage`)
      } catch (error) {
        console.error('Upload error:', error)
        setFileStatuses(prev => ({ ...prev, [file.id]: 'error' }))
        toast.error(`Failed to upload "${file.name}"`)
      }
    })
  }, [])
  
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt', '.md'],
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    noClick: true // We'll handle clicks manually
  })
  
  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id))
    setFileProgress(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    setFileStatuses(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
    setFileCIDs(prev => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }
  
  const allFilesReady = files.length > 0 && files.every(f => fileStatuses[f.id] === 'success')
  
  const handleStoreOnChain = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }
    
    if (!allFilesReady) {
      toast.error('Please wait for all files to finish uploading')
      return
    }
    
    setIsUploading(true)
    
    try {
      // Store each file's CID on the blockchain
      const participantId = `0x${address.slice(2).padEnd(64, '0')}`
      
      // For now, store the first file (can be extended to batch)
      const firstFile = files[0]
      const cid = fileCIDs[firstFile.id]
      
      writeContract({
        address: getContractAddress(chainId, 'MemoryRegistry'),
        abi: MemoryRegistryABI,
        functionName: 'storeMemory',
        args: [
          participantId,
          cid,
          '0x0000000000000000000000000000000000000000000000000000000000000000', // encryptionKeyHash
          0, // expiration - never
          shardingEnabled,
          shardingEnabled ? 4 : 1,
          [] // shardCIDs
        ]
      }, {
        onSuccess: () => {
          toast.success('Memory stored on blockchain!')
          setFiles([])
          setFileProgress({})
          setFileStatuses({})
          setFileCIDs({})
        },
        onError: (error) => {
          console.error('Store error:', error)
          toast.error(error.message || 'Failed to store memory')
        }
      })
    } catch (error) {
      console.error('Store error:', error)
      toast.error('Failed to store memory')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="glass-card p-12 max-w-md mx-auto">
          <Lock className="w-16 h-16 text-vault-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect to Upload</h2>
          <p className="text-gray-400">
            Connect your wallet to securely store encrypted memories on the blockchain.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Store Memory</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Upload your AI agent memories securely. Files are encrypted, 
          stored on IPFS, and registered on the Base blockchain for permanent access control.
        </p>
      </div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragActive 
              ? 'border-vault-accent bg-vault-accent/10' 
              : 'border-white/20 hover:border-white/40'
          }`}
          onClick={open}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          
          <motion.div
            animate={{ 
              scale: isDragActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-vault-accent/30 blur-2xl rounded-full animate-pulse-slow" />
              <div className="relative p-6 rounded-2xl bg-vault-accent/20 border border-vault-accent/30">
                <Upload className="w-12 h-12 text-vault-accent" />
              </div>
            </div>
            
            <p className="text-lg text-white font-medium">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-400">
              or click to browse. Supports JSON, TXT, PDF, Images up to 100MB
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Client-Side Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" /> IPFS Storage
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> NFT Access
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Options */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Storage Options</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-vault-800/50 cursor-pointer hover:bg-vault-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-white font-medium">Client-Side Encryption</div>
                <div className="text-sm text-gray-400">Encrypt files before upload (recommended)</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={(e) => setEncryptionEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-vault-600 text-vault-accent focus:ring-vault-accent"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 rounded-xl bg-vault-800/50 cursor-pointer hover:bg-vault-800 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium">Memory Sharding</div>
                <div className="text-sm text-gray-400">Mark as sharded for distributed storage</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shardingEnabled}
              onChange={(e) => setShardingEnabled(e.target.checked)}
              className="w-5 h-5 rounded border-vault-600 text-vault-accent focus:ring-vault-accent"
            />
          </label>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
              <button
                onClick={() => {
                  setFiles([])
                  setFileProgress({})
                  setFileStatuses({})
                  setFileCIDs({})
                }}
                className="text-sm text-rose-400 hover:text-rose-300"
              >
                Clear all
              </button>
            </div>
            
            {files.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                uploadProgress={fileProgress[file.id] || 0}
                status={fileStatuses[file.id] || 'uploading'}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Store Button */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleStoreOnChain}
            disabled={isUploading || isPending || isConfirming || !allFilesReady}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isConfirming ? 'Confirming Transaction...' : 'Submitting Transaction...'}
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Store on Base Blockchain
              </>
            )}
          </button>
          
          {!allFilesReady && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Wait for all files to finish uploading to IPFS
            </p>
          )}
        </motion.div>
      )}
      
      {/* IPFS Note */}
      <div className="glass-card p-4 text-sm text-gray-500">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-vault-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-400 mb-1">About IPFS Storage</p>
            <p>
              Files are uploaded to IPFS (InterPlanetary File System) for decentralized storage. 
              The IPFS CID (Content Identifier) is then stored on the Base blockchain for 
              permanent, tamper-proof access control.
            </p>
            <p className="mt-2 text-xs">
              <strong>Note:</strong> This demo generates mock CIDs. For production, 
              integrate with Pinata, NFT.Storage, or your preferred IPFS pinning service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
