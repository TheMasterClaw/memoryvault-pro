import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Unlock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Clock,
  Key,
  FileText,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Info
} from 'lucide-react'

// Privacy check categories
const PRIVACY_CHECKS = [
  {
    id: 'encryption',
    title: 'End-to-End Encryption',
    description: 'All memories are encrypted client-side before storage',
    weight: 25,
    check: (data) => data.memoriesStored > 0 && data.encryptionEnabled
  },
  {
    id: 'key-rotation',
    title: 'Key Rotation',
    description: 'Encryption keys rotated regularly for enhanced security',
    weight: 15,
    check: (data) => data.lastKeyRotation < 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  {
    id: 'access-control',
    title: 'Access Control',
    description: 'NFT-based credentials control who can access memories',
    weight: 20,
    check: (data) => data.activeCredentials > 0
  },
  {
    id: 'expiration',
    title: 'Memory Expiration',
    description: 'Time-bound memories reduce long-term exposure risk',
    weight: 15,
    check: (data) => data.hasExpiringMemories
  },
  {
    id: 'tee-enabled',
    title: 'TEE Protection',
    description: 'Trusted Execution Environment for key management',
    weight: 15,
    check: (data) => data.teeEnabled
  },
  {
    id: 'backup-recovery',
    title: 'Backup & Recovery',
    description: 'Secure recovery mechanisms in place',
    weight: 10,
    check: (data) => data.hasRecoverySetup
  }
]

// Mock user data generator
const generateUserData = () => ({
  memoriesStored: 12,
  encryptionEnabled: true,
  lastKeyRotation: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
  activeCredentials: 3,
  hasExpiringMemories: true,
  teeEnabled: true,
  hasRecoverySetup: true,
  accessLogs: [
    { timestamp: Date.now() - 1000 * 60 * 5, action: 'Memory accessed', agent: 'Code Reviewer', allowed: true },
    { timestamp: Date.now() - 1000 * 60 * 30, action: 'Memory stored', agent: 'You', allowed: true },
    { timestamp: Date.now() - 1000 * 60 * 60, action: 'Access denied', agent: 'Unknown', allowed: false },
    { timestamp: Date.now() - 1000 * 60 * 60 * 2, action: 'Credential issued', agent: 'You', allowed: true },
    { timestamp: Date.now() - 1000 * 60 * 60 * 24, action: 'Memory accessed', agent: 'Research Assistant', allowed: true }
  ],
  memoryBreakdown: {
    encrypted: 12,
    unencrypted: 0,
    withExpiration: 8,
    permanent: 4
  },
  credentialBreakdown: {
    active: 3,
    expired: 1,
    revoked: 0
  }
})

const ScoreRing = ({ score, size = 200 }) => {
  const circumference = 2 * Math.PI * ((size - 20) / 2)
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  let color = '#ef4444'
  if (score >= 80) color = '#10b981'
  else if (score >= 60) color = '#f59e0b'
  else if (score >= 40) color = '#f97316'
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 20) / 2}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size - 20) / 2}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 10px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div 
          className="text-5xl font-bold"
          style={{ color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {score}
        </motion.div>
        <div className="text-sm text-gray-400">Privacy Score</div>
      </div>
    </div>
  )
}

const CheckItem = ({ check, passed, onToggle }) => {
  const Icon = passed ? CheckCircle : AlertTriangle
  const color = passed ? 'text-emerald-400' : 'text-amber-400'
  const bgColor = passed ? 'bg-emerald-500/10' : 'bg-amber-500/10'
  const borderColor = passed ? 'border-emerald-500/30' : 'border-amber-500/30'
  
  return (
    <motion.div
      layout
      className={`p-4 rounded-xl border ${bgColor} ${borderColor} transition-all`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{check.title}</h4>
            <span className={`text-sm ${color}`}>{check.weight}%</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{check.description}</p>
          
          {!passed && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onToggle}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                Fix Issue
              </button>
            </div>
          )}
        </div>
      </div&gt;
    </motion.div>
  )
}

const StatCard = ({ icon: Icon, label, value, subtext, color = 'text-vault-accent' }) => (
  <motion.div 
    className="glass-card p-4"
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <div className="mt-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  </motion.div>
)

const AccessLogItem = ({ log }) => {
  const isAllowed = log.allowed
  const timeAgo = Math.floor((Date.now() - log.timestamp) / 1000 / 60)
  const timeText = timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
      <div className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      <div className="flex-1">
        <div className="text-sm">{log.action}</div>
        <div className="text-xs text-gray-500">{log.agent}</div>
      </div>
      <div className="text-xs text-gray-500">{timeText}</div>
    </div>
  )
}

const RecommendationCard = ({ title, description, priority, action }) => {
  const priorityColors = {
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }
  
  return (
    <div className={`p-4 rounded-xl border ${priorityColors[priority]}`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium">{title}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-medium ${priorityColors[priority]}`}>
          {priority}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{description}</p>
      <button className="text-sm font-medium hover:underline">{action}</button>
    </div>
  )
}

export default function PrivacyAudit() {
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [checks, setChecks] = useState([])
  const [lastAudit, setLastAudit] = useState(null)

  useEffect(() => {
    runAudit()
  }, [])

  const runAudit = () => {
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const data = generateUserData()
      setUserData(data)
      
      // Calculate checks
      const calculatedChecks = PRIVACY_CHECKS.map(check => ({
        ...check,
        passed: check.check(data)
      }))
      setChecks(calculatedChecks)
      
      // Calculate score
      const totalScore = calculatedChecks.reduce((acc, check) => 
        acc + (check.passed ? check.weight : 0), 0
      )
      setScore(totalScore)
      
      setLastAudit(new Date())
      setIsLoading(false)
    }, 1500)
  }

  const getScoreLabel = (s) => {
    if (s >= 90) return { text: 'Excellent', color: 'text-emerald-400', icon: Award }
    if (s >= 80) return { text: 'Very Good', color: 'text-emerald-400', icon: CheckCircle }
    if (s >= 60) return { text: 'Good', color: 'text-amber-400', icon: CheckCircle }
    if (s >= 40) return { text: 'Fair', color: 'text-orange-400', icon: AlertTriangle }
    return { text: 'Needs Improvement', color: 'text-rose-400', icon: XCircle }
  }

  const scoreInfo = getScoreLabel(score)
  const ScoreIcon = scoreInfo.icon

  const passedChecks = checks.filter(c => c.passed).length
  const totalChecks = checks.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-vault-accent" />
          <h2 className="text-2xl font-bold mb-2">Running Privacy Audit...</h2>
          <p className="text-gray-400">Analyzing your memory security configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Privacy Audit Dashboard</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Privacy Audit
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comprehensive analysis of your memory security and privacy configuration
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Score Panel */}
          <div className="space-y-6">
            <div className="glass-card p-8 flex flex-col items-center">
              <ScoreRing score={score} size={220} />
              
              <div className={`mt-6 flex items-center gap-2 ${scoreInfo.color}`}>
                <ScoreIcon className="w-5 h-5" />
                <span className="text-lg font-semibold">{scoreInfo.text}</span>
              </div>
              
              <p className="text-sm text-gray-400 mt-2 text-center">
                {passedChecks} of {totalChecks} checks passed
              </p>
              
              {lastAudit && (
                <p className="text-xs text-gray-500 mt-4">
                  Last audit: {lastAudit.toLocaleString()}
                </p>
              )}
              
              <button 
                onClick={runAudit}
                className="btn btn-secondary w-full mt-6"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run New Audit
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard 
                icon={Database}
                label="Memories"
                value={userData?.memoriesStored}
                subtext="All encrypted"
                color="text-cyan-400"
              />
              <StatCard 
                icon={Key}
                label="Credentials"
                value={userData?.activeCredentials}
                subtext="Active"
                color="text-purple-400"
              />
              <StatCard 
                icon={Lock}
                label="Encrypted"
                value={`${userData?.memoryBreakdown.encrypted}/${userData?.memoriesStored}`}
                subtext="100% secure"
                color="text-emerald-400"
              />
              <StatCard 
                icon={Clock}
                label="Expiring"
                value={userData?.memoryBreakdown.withExpiration}
                subtext="Time-bound"
                color="text-amber-400"
              />
            </div>
          </div>

          {/* Checks Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-vault-accent" />
                  Security Checks
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {passedChecks} Passed
                  <span className="mx-2">•</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  {totalChecks - passedChecks} Needs Attention
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {checks.map((check) => (
                    <CheckItem
                      key={check.id}
                      check={check}
                      passed={check.passed}
                      onToggle={() => {}}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Access Log */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-vault-accent" />
                Recent Access Activity
              </h3>

              <div className="space-y-2">
                {userData?.accessLogs.map((log, idx) => (
                  <AccessLogItem key={idx} log={log} />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-vault-accent" />
                Recommendations
              </h3>

              <div className="space-y-3">
                <RecommendationCard
                  title="Enable Key Rotation"
                  description="Your encryption keys haven't been rotated in 15 days. Regular rotation enhances security."
                  priority="medium"
                  action="Rotate Keys →"
                />
                
                <RecommendationCard
                  title="Review Expired Credentials"
                  description="You have 1 expired NFT credential that can be revoked to maintain clean access control."
                  priority="low"
                  action="Review Credentials →"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 glass-card p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-vault-accent mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">About Privacy Scoring</h4>
              <p className="text-sm text-gray-400">
                Your privacy score is calculated based on six key security dimensions: encryption strength, 
                key rotation frequency, access control implementation, memory expiration policies, 
                TEE utilization, and backup/recovery setup. Scores are updated in real-time as you 
                modify your memory configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
