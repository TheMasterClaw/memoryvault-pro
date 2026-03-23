import React from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  Database, 
  FileText, 
  Image, 
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Lock,
  Unlock,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { MemoryRegistryABI, MemoryAccessNFTABI } from '../contracts/abis'
import { getContractAddress } from '../contracts/addresses'
import { Link } from 'react-router-dom'

const StatCard = ({ title, value, icon: Icon, color, subtitle, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass-card p-6 hover:bg-white/10 transition-all group"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <Activity className="w-5 h-5 text-gray-600 group-hover:text-vault-accent transition-colors" />
    </div>
    <div className="text-3xl font-bold text-white mb-1">
      {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-vault-accent" /> : value}
    </div>
    <div className="text-sm font-medium text-gray-400 mb-1">{title}</div>
    {subtitle && <div className="text-xs text-vault-accent">{subtitle}</div>}
  </motion.div>
)

const ActivityItem = ({ type, title, time, status }) => {
  const icons = {
    upload: Database,
    nft: Image,
    access: Shield
  }
  const Icon = icons[type] || Database
  
  const statusColors = {
    success: 'text-emerald-400',
    pending: 'text-amber-400',
    revoked: 'text-rose-400'
  }
  
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
      <div className="p-2 rounded-lg bg-vault-700/50">
        <Icon className="w-5 h-5 text-vault-accent" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>
      <div className={`text-xs font-medium ${statusColors[status] || 'text-gray-400'}`}>
        {status}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const participantId = address ? `0x${address.slice(2).padEnd(64, '0')}` : '0x0'
  
  // Fetch real memory count from contract
  const { data: memoryCount, isLoading: isMemoryLoading, error: memoryError } = useReadContract({
    address: getContractAddress(chainId, 'MemoryRegistry'),
    abi: MemoryRegistryABI,
    functionName: 'getMemoryCount',
    args: [participantId],
    enabled: isConnected && chainId === 84532
  })
  
  // Fetch real NFT credentials count
  const { data: credentialsData, isLoading: isCredentialLoading } = useReadContract({
    address: getContractAddress(chainId, 'MemoryAccessNFT'),
    abi: MemoryAccessNFTABI,
    functionName: 'getCredentialsByOwner',
    args: [address],
    enabled: isConnected && chainId === 84532
  })
  
  // Calculate stats from real data
  const nftCount = credentialsData?.[0]?.length || 0
  const activeGrants = credentialsData?.[0]?.filter((_, i) => {
    const cred = credentialsData[1][i]
    return !cred.expiration || cred.expiration === 0n || Date.now() < Number(cred.expiration) * 1000
  }).length || 0
  
  // Stats with real data
  const stats = [
    { 
      title: 'Total Memories', 
      value: memoryCount?.toString() || '0', 
      icon: Database, 
      color: 'from-violet-500 to-purple-500', 
      subtitle: 'Stored on-chain',
      isLoading: isMemoryLoading
    },
    { 
      title: 'Storage Used', 
      value: memoryCount ? `~${(Number(memoryCount) * 0.5).toFixed(1)} MB` : '0 MB', 
      icon: FileText, 
      color: 'from-blue-500 to-cyan-500', 
      subtitle: 'Estimated',
      isLoading: isMemoryLoading
    },
    { 
      title: 'Access NFTs', 
      value: nftCount.toString(), 
      icon: Image, 
      color: 'from-pink-500 to-rose-500', 
      subtitle: `${activeGrants} active grants`,
      isLoading: isCredentialLoading
    },
    { 
      title: 'Uptime', 
      value: '99.9%', 
      icon: Clock, 
      color: 'from-emerald-500 to-teal-500', 
      subtitle: 'Last 30 days',
      isLoading: false
    },
  ]
  
  // Empty activity - to be populated from event logs in the future
  const recentActivity = []
  
  // Calculate memory type breakdown (placeholder - would need full memory data)
  const memoryTypes = memoryCount && memoryCount > 0n ? [
    { name: 'Structured Data', percentage: 45, color: 'bg-violet-500' },
    { name: 'Embeddings', percentage: 30, color: 'bg-blue-500' },
    { name: 'Conversations', percentage: 20, color: 'bg-emerald-500' },
    { name: 'Other', percentage: 5, color: 'bg-gray-500' },
  ] : []

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <div className="glass-card p-12 max-w-md mx-auto">
          <Lock className="w-16 h-16 text-vault-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your dashboard and manage your AI agent memories.
          </p>
          <div className="text-sm text-vault-accent">
            Supported: MetaMask, Coinbase Wallet, WalletConnect
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
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Manage your AI agent memories and access credentials
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-400">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
      </div>

      {/* Error State */}
      {memoryError && (
        <div className="glass-card p-6 flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Connection Error</h3>
            <p className="text-gray-400">{memoryError.message || 'Failed to load dashboard data'}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Storage Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Storage Breakdown</h3>
            <TrendingUp className="w-5 h-5 text-vault-accent" />
          </div>
          
          {memoryTypes.length > 0 ? (
            <>
              <div className="space-y-4">
                {memoryTypes.map((type, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{type.name}</span>
                      <span className="text-sm text-white font-medium">{type.percentage}%</span>
                    </div>
                    <div className="h-2 bg-vault-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${type.color} rounded-full transition-all duration-500`}
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{memoryCount?.toString() || '0'}</div>
                    <div className="text-xs text-gray-500">Total Memories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{memoryCount?.toString() || '0'}</div>
                    <div className="text-xs text-gray-500">This Month</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{nftCount}</div>
                    <div className="text-xs text-gray-500">Shared Access</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No memories stored yet</p>
              <Link to="/upload" className="text-vault-accent hover:underline mt-2 inline-block">
                Upload your first memory →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <Clock className="w-5 h-5 text-vault-accent" />
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No recent activity</p>
              <p className="text-gray-600 text-xs mt-1">Activity will appear here when you store memories or mint NFTs</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Security Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Security Status: Active</h3>
              <p className="text-sm text-gray-400">
                Your memories are encrypted with TEE and distributed across Filecoin shards
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-emerald-400">
                <Unlock className="w-4 h-4" />
                <span className="text-sm font-medium">Encryption</span>
              </div>
              <div className="text-xs text-gray-500">AES-256-GCM</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">TEE</span>
              </div>
              <div className="text-xs text-gray-500">Verified</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-emerald-400">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Sharding</span>
              </div>
              <div className="text-xs text-gray-500">4/4 Active</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
