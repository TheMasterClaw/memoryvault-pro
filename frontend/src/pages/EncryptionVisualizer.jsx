import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  Unlock, 
  Shield, 
  Database, 
  Key, 
  FileText,
  ArrowRight,
  CheckCircle,
  Cpu,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity }
  }
}

const EncryptionVisualizer = () => {
  const [step, setStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState('')
  const [encryptedData, setEncryptedData] = useState('')
  const [cid, setCid] = useState('')
  const [txHash, setTxHash] = useState('')

  // Generate random encryption key
  const generateKey = () => {
    const chars = '0123456789abcdef'
    let key = '0x'
    for (let i = 0; i < 64; i++) {
      key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
  }

  // Generate mock encrypted data
  const generateEncryptedData = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let data = ''
    for (let i = 0; i < 256; i++) {
      data += chars[Math.floor(Math.random() * chars.length)]
    }
    return data
  }

  // Generate mock CID
  const generateCID = () => {
    return `Qm${Array(44).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('')}`
  }

  // Generate mock tx hash
  const generateTxHash = () => {
    return `0x${Array(64).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`
  }

  const startDemo = () => {
    setIsAnimating(true)
    setStep(1)
    setEncryptionKey(generateKey())
    setEncryptedData(generateEncryptedData())
    setCid(generateCID())
    setTxHash(generateTxHash())
    
    // Auto-advance through steps
    setTimeout(() => setStep(2), 2500)
    setTimeout(() => setStep(3), 5000)
    setTimeout(() => setStep(4), 7500)
    setTimeout(() => setStep(5), 10000)
    setTimeout(() => {
      setStep(6)
      setIsAnimating(false)
    }, 12500)
  }

  const resetDemo = () => {
    setStep(0)
    setIsAnimating(false)
    setEncryptionKey('')
    setEncryptedData('')
    setCid('')
    setTxHash('')
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const steps = [
    { 
      title: 'Raw Memory Data', 
      icon: FileText,
      description: 'Original conversation memory from AI agent',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      title: 'Client-Side Encryption', 
      icon: Lock,
      description: 'AES-256-GCM encryption in browser',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      title: 'TEE Key Generation', 
      icon: Cpu,
      description: 'Keys generated in secure enclave',
      color: 'from-amber-500 to-orange-500'
    },
    { 
      title: 'IPFS Storage', 
      icon: Database,
      description: 'Encrypted blob stored on Filecoin',
      color: 'from-emerald-500 to-teal-500'
    },
    { 
      title: 'Blockchain Registry', 
      icon: Globe,
      description: 'CID hash registered on Base',
      color: 'from-indigo-500 to-violet-500'
    },
    { 
      title: 'Secure & Verified', 
      icon: Shield,
      description: 'Memory is tamper-proof and private',
      color: 'from-rose-500 to-red-500'
    }
  ]

  const sampleMemory = {
    timestamp: new Date().toISOString(),
    agent: 'assistant-0x7a3f...8e2d',
    conversation: [
      { role: 'user', content: 'Help me plan a surprise party for my friend' },
      { role: 'assistant', content: 'I\'d be happy to help! What\'s the occasion and when is it?' },
      { role: 'user', content: 'It\'s their 30th birthday, next month' },
      { role: 'assistant', content: 'Great! Let me note these details for future reference.' }
    ],
    context: {
      userPreferences: ['surprise parties', 'minimal decorations'],
      previousEvents: ['birthday_2024', 'anniversary_2023']
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Privacy-First Architecture</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Encryption Visualizer
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how MemoryVault Pro protects your AI agent memories with 
            end-to-end encryption and blockchain verification
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2 rounded-full">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Step Indicators */}
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = i <= step
              const isCurrent = i === step
              
              return (
                <motion.div 
                  key={i}
                  className={`relative z-10 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    isActive ? 'opacity-100' : 'opacity-40'
                  }`}
                  onClick={() => !isAnimating && setStep(i)}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isCurrent 
                      ? `bg-gradient-to-br ${s.color} shadow-lg shadow-purple-500/50` 
                      : isActive 
                        ? 'bg-gray-700' 
                        : 'bg-gray-800'
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                    {isCurrent && (
                      <motion.div 
                        className="absolute inset-0 rounded-2xl border-2 border-white/50"
                        variants={pulseVariants}
                        animate="pulse"
                      />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[100px] ${
                    isCurrent ? 'text-white' : 'text-gray-500'
                  }`}>
                    {s.title}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Main Visualization Area */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Data Visualization */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6 h-full min-h-[400px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div 
                    key="step0"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Ready to Encrypt</h3>
                    <p className="text-gray-400 mb-8">Click start to see the encryption flow</p>
                    <button 
                      onClick={startDemo}
                      disabled={isAnimating}
                      className="btn btn-primary btn-lg"
                    >
                      {isAnimating ? (
                        <><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                      ) : (
                        <><Lock className="w-5 h-5 mr-2" /> Start Encryption Demo</>
                      )}
                    </button>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-lg font-semibold">Raw Memory Data</span>
                    </div>
                    
                    <div className="bg-black/30 rounded-xl p-4 font-mono text-sm overflow-auto max-h-[300px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500">// AI Agent Memory</span>
                        <button 
                          onClick={() => setShowRawData(!showRawData)}
                          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          {showRawData ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showRawData ? 'Hide' : 'Show'} Content
                        </button>
                      </div>
                      {showRawData ? (
                        <pre className="text-green-400 whitespace-pre-wrap">
                          {JSON.stringify(sampleMemory, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-gray-500 italic">
                          [Content hidden - click &quot;Show Content&quot; to view raw memory data]
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Database className="w-4 h-4" />
                      <span>Size: 1.2 KB</span>
                      <span className="mx-2">•</span>
                      <Clock className="w-4 h-4" />
                      <span>Created: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Lock className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-lg font-semibold">AES-256-GCM Encryption</span>
                    </div>

                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-amber-400 font-mono">Encryption Key</span>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 font-mono text-xs break-all text-purple-300">
                        {encryptionKey}
                      </div>
                      <button 
                        onClick={() => copyToClipboard(encryptionKey)}
                        className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy Key'}
                      </button>
                    </div>

                    <div className="bg-black/30 rounded-xl p-4">
                      <div className="text-sm text-gray-400 mb-2">Encrypted Output</div>
                      <div className="font-mono text-xs text-pink-400 break-all line-clamp-4">
                        {encryptedData}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400">256-bit encryption complete</span>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Cpu className="w-5 h-5 text-amber-400" />
                      </div>
                      <span className="text-lg font-semibold">TEE Secure Enclave</span>
                    </div>

                    <div className="relative bg-slate-800/50 rounded-xl p-6 border border-amber-500/30">
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-amber-400">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        SECURE
                      </div>
                      
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                          <Shield className="w-10 h-10 text-white" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Enclave ID</span>
                          <span className="font-mono text-amber-400">0x{Array(8).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}...</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Attestation</span>
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Key Rotation</span>
                          <span className="text-cyan-400">Every 24h</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <p className="text-xs text-amber-300">
                        <strong>TEE (Trusted Execution Environment):</strong> Keys are generated 
                        and managed in hardware-isolated secure enclaves. Even we cannot access your encryption keys.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Database className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-lg font-semibold">IPFS/Filecoin Storage</span>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-xl p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-mono">Content Identifier (CID)</span>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 font-mono text-sm text-emerald-300 break-all">
                        {cid}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-400">3</div>
                        <div className="text-xs text-gray-500">Replicas</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-cyan-400">100+</div>
                        <div className="text-xs text-gray-500">Years</div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">∞</div>
                        <div className="text-xs text-gray-500">Retention</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Stored on Filecoin with permanent persistence guarantee</span>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Globe className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-lg font-semibold">Base Sepolia Registry</span>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-900/50 to-violet-900/50 rounded-xl p-4 border border-indigo-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-400 font-mono">Transaction Hash</span>
                      </div>
                      <div className="bg-black/50 rounded-lg p-3 font-mono text-xs text-indigo-300 break-all">
                        {txHash}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <span className="text-sm text-gray-400">Block Number</span>
                        <span className="font-mono text-indigo-400">#{(8453200 + Math.floor(Math.random() * 1000)).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <span className="text-sm text-gray-400">Gas Used</span>
                        <span className="font-mono text-cyan-400">{(85000 + Math.floor(Math.random() * 20000)).toLocaleString()} wei</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <span className="text-sm text-gray-400">Confirmations</span>
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Finalized
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div 
                    key="step6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30"
                    >
                      <Shield className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">Memory Secured!</h3>
                    <p className="text-gray-400 mb-6">Your memory is now encrypted and stored on-chain</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                      <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                        <Lock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-emerald-400">Encrypted</div>
                      </div>
                      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                        <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-blue-400">On-Chain</div>
                      </div>
                    </div>

                    <button 
                      onClick={resetDemo}
                      className="btn btn-secondary"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Run Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: Info Panel */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Current Step Info */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${steps[step]?.color || steps[0].color} flex items-center justify-center text-sm`}>
                  {step + 1}
                </span>
                {steps[step]?.title || steps[0].title}
              </h3>
              <p className="text-gray-400 mb-4">{steps[step]?.description || steps[0].description}</p>
              
              {/* Step Details */}
              <div className="space-y-3">
                {step === 0 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Client-Side Encryption</div>
                        <div className="text-xs text-gray-500">Data is encrypted before leaving your browser</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Zero-Knowledge Architecture</div>
                        <div className="text-xs text-gray-500">We never see your unencrypted data</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Blockchain Verification</div>
                        <div className="text-xs text-gray-500">Every memory is tamper-proof verified</div>
                      </div>
                    </div>
                  </>
                )}
                
                {step === 1 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Database className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Raw Memory Structure</div>
                        <div className="text-xs text-gray-500">JSON format with timestamp, conversation, and context</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <EyeOff className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Sensitive by Default</div>
                        <div className="text-xs text-gray-500">Content is hidden until explicitly revealed</div>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Lock className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">AES-256-GCM</div>
                        <div className="text-xs text-gray-500">Military-grade encryption standard</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Key className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Unique Key Per Memory</div>
                        <div className="text-xs text-gray-500">Each memory gets its own encryption key</div>
                      </div>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Cpu className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Hardware Isolation</div>
                        <div className="text-xs text-gray-500">Keys processed in secure enclave</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Attestation</div>
                        <div className="text-xs text-gray-500">Cryptographic proof of secure execution</div>
                      </div>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Database className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Content Addressing</div>
                        <div className="text-xs text-gray-500">CID uniquely identifies your encrypted data</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Globe className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Distributed Storage</div>
                        <div className="text-xs text-gray-500">Multiple replicas across Filecoin network</div>
                      </div>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <Globe className="w-5 h-5 text-indigo-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Immutable Registry</div>
                        <div className="text-xs text-gray-500">CID hash permanently recorded on Base</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Tamper-Proof</div>
                        <div className="text-xs text-gray-500">Blockchain guarantees data integrity</div>
                      </div>
                    </div>
                  </>
                )}

                {step === 6 && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-sm text-emerald-400">Security Complete</div>
                        <div className="text-xs text-gray-500">Your memory is protected by multiple layers of encryption and blockchain verification</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Security Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">256-bit</div>
                <div className="text-xs text-gray-500">Encryption Strength</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">0</div>
                <div className="text-xs text-gray-500">Data Breaches</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">100%</div>
                <div className="text-xs text-gray-500">Client-Side</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-3xl font-bold text-amber-400 mb-1">∞</div>
                <div className="text-xs text-gray-500">Retention</div>
              </div>
            </div>

            {/* CTA */}
            <div className="glass-card p-6 text-center">
              <h4 className="font-semibold mb-2">Ready to secure your AI memories?</h4>
              <p className="text-sm text-gray-400 mb-4">Start using MemoryVault Pro today</p>
              <a href="/app" className="btn btn-primary w-full">
                <Lock className="w-4 h-4 mr-2" /> Launch App
              </a>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center text-gray-500 text-sm">
          <p>MemoryVault Pro uses military-grade AES-256-GCM encryption with TEE-based key management</p>
          <p className="mt-1">Your data is encrypted in your browser before being stored on Filecoin and registered on Base</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EncryptionVisualizer
