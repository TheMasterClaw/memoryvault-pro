import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  Database,
  Activity,
  Clock,
  Users,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Globe
} from 'lucide-react'

// Mock analytics data
const generateAnalyticsData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    activity: Math.floor(Math.random() * 50) + 10
  }))
  
  const dailyStorage = days.map((day, i) => ({
    day,
    stored: Math.floor(Math.random() * 5) + 1,
    retrieved: Math.floor(Math.random() * 8) + 2,
    growth: Math.random() > 0.5 ? Math.floor(Math.random() * 20) : -Math.floor(Math.random() * 10)
  }))
  
  const memoryTypes = [
    { type: 'Conversations', count: 45, color: '#3b82f6' },
    { type: 'Documents', count: 23, color: '#10b981' },
    { type: 'Code Snippets', count: 18, color: '#f59e0b' },
    { type: 'Preferences', count: 12, color: '#8b5cf6' },
    { type: 'Other', count: 8, color: '#6b7280' }
  ]
  
  const topAgents = [
    { name: 'Research Assistant', access: 156, growth: 23 },
    { name: 'Code Reviewer', access: 98, growth: 15 },
    { name: 'Project Manager', access: 67, growth: -5 },
    { name: 'Documentation Bot', access: 45, growth: 12 }
  ]
  
  return {
    totalMemories: 106,
    memoriesThisWeek: 12,
    weeklyGrowth: 18.5,
    totalAccess: 366,
    avgResponseTime: '245ms',
    storageUsed: '2.4 GB',
    storageLimit: '10 GB',
    encryptionRate: 100,
    uptime: 99.9,
    hourlyActivity,
    dailyStorage,
    memoryTypes,
    topAgents,
    monthlyStats: {
      newMemories: 48,
      totalAccess: 1247,
      newCredentials: 8,
      activeAgents: 6
    }
  }
}

const StatCard = ({ title, value, subtext, trend, trendValue, icon: Icon, color }) => (
  <motion.div 
    className="glass-card p-5"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{trendValue}%</span>
        </div>
      )}
    </div>
    
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-400">{title}</div>
    
    {subtext && <div className="text-xs text-gray-500 mt-2">{subtext}</div>}
  </motion.div>
)

const BarChart = ({ data, color = '#3b82f6' }) => {
  const maxValue = Math.max(...data.map(d => d.stored + d.retrieved))
  
  return (
    <div className="h-48 flex items-end justify-between gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col gap-1">
            <motion.div
              className="w-full rounded-t"
              style={{ backgroundColor: color }}
              initial={{ height: 0 }}
              animate={{ height: `${(item.stored / maxValue) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
            <motion.div
              className="w-full rounded-t"
              style={{ backgroundColor: color, opacity: 0.5 }}
              initial={{ height: 0 }}
              animate={{ height: `${(item.retrieved / maxValue) * 100}%` }}
              transition={{ delay: i * 0.1 + 0.05, duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-gray-500">{item.day}</span>
        </div>
      ))}
    </div>
  )
}

const PieChartComponent = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.count, 0)
  let currentAngle = 0
  
  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {data.map((item, i) => {
          const angle = (item.count / total) * 360
          const startAngle = currentAngle
          currentAngle += angle
          
          const startRad = (startAngle * Math.PI) / 180
          const endRad = ((startAngle + angle) * Math.PI) / 180
          
          const x1 = 80 + 70 * Math.cos(startRad)
          const y1 = 80 + 70 * Math.sin(startRad)
          const x2 = 80 + 70 * Math.cos(endRad)
          const y2 = 80 + 70 * Math.sin(endRad)
          
          const largeArc = angle > 180 ? 1 : 0
          
          return (
            <motion.path
              key={i}
              d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          )
        })}
        <circle cx="80" cy="80" r="40" fill="rgba(15, 23, 42, 0.9)" />
        <text x="80" y="75" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{total}</text>
        <text x="80" y="92" textAnchor="middle" fill="#9ca3af" fontSize="10">Total</text>
      </svg>
      
      <div className="flex-1 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm">{item.type}</span>
            </div>
            <span className="text-sm text-gray-400">{Math.round((item.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ActivityHeatmap = ({ data }) => {
  return (
    <div className="grid grid-cols-12 gap-1">
      {data.slice(0, 24).map((item, i) => (
        <motion.div
          key={i}
          className="aspect-square rounded"
          style={{
            backgroundColor: item.activity > 40 ? '#10b981' : 
                            item.activity > 25 ? '#34d399' :
                            item.activity > 15 ? '#6ee7b7' :
                            item.activity > 5 ? '#a7f3d0' : '#374151'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.02 }}
          title={`${item.hour}:00 - Activity: ${item.activity}`}
        />
      ))}
    </div>
  )
}

const AgentRow = ({ agent, index }) => (
  <motion.div 
    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-vault-accent/20 flex items-center justify-center text-sm font-bold">
        {index + 1}
      </div>
      <div>
        <div className="font-medium">{agent.name}</div>
        <div className="text-xs text-gray-500">{agent.access} accesses</div>
      </div>
    </div>
    
    <div className={`flex items-center gap-1 text-sm ${agent.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {agent.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      <span>{Math.abs(agent.growth)}%</span>
    </div>
  </motion.div>
)

export default function Analytics() {
  const [data, setData] = useState(null)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    setData(generateAnalyticsData())
  }, [timeRange])

  if (!data) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm mb-3">
              <BarChart3 className="w-4 h-4 text-vault-accent" />
              Analytics Dashboard
            </div>
            <h1 className="text-4xl font-bold">Memory Analytics</h1>
            <p className="text-gray-400 mt-1">Insights into your memory usage and agent activity</p>
          </div>
          
          <div className="flex gap-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-vault-accent text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {range === '24h' ? 'Last 24h' : `Last ${range}`}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Memories"
            value={data.totalMemories}
            subtext={`+${data.memoriesThisWeek} this week`}
            trend="up"
            trendValue={data.weeklyGrowth}
            icon={Database}
            color="#3b82f6"
          />
          
          <StatCard
            title="Total Access"
            value={data.totalAccess}
            subtext="Across all agents"
            trend="up"
            trendValue={23}
            icon={Activity}
            color="#10b981"
          />
          
          <StatCard
            title="Storage Used"
            value={data.storageUsed}
            subtext={`of ${data.storageLimit}`}
            icon={Database}
            color="#f59e0b"
          />
          
          <StatCard
            title="Avg Response"
            value={data.avgResponseTime}
            subtext="Lightning fast"
            trend="up"
            trendValue={12}
            icon={Zap}
            color="#8b5cf6"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <motion.div 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-vault-accent" />
                Weekly Activity
              </h3>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-gray-400">Stored</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500 opacity-50"></div>
                  <span className="text-gray-400">Retrieved</span>
                </div>
              </div>
            </div>
            
            <BarChart data={data.dailyStorage} />
          </motion.div>

          {/* Memory Types */}
          <motion.div 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-vault-accent" />
              Memory Types
            </h3>
            
            <PieChartComponent data={data.memoryTypes} />
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Activity Heatmap */}
          <motion.div 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-vault-accent" />
              Hourly Activity
            </h3>
            
            <ActivityHeatmap data={data.hourlyActivity} />
            
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM></span>
              <span>12AM</span>
            </div>
          </motion.div>

          {/* Top Agents */}
          <motion.div 
            className="glass-card p-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-vault-accent" />
              Top Active Agents
            </h3>
            
            <div className="space-y-2">
              {data.topAgents.map((agent, i) => (
                <AgentRow key={agent.name} agent={agent} index={i} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Monthly Summary */}
        <motion.div 
          className="glass-card p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vault-accent" />
            Monthly Summary
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-white/5">
              <div className="text-3xl font-bold text-cyan-400 mb-1">{data.monthlyStats.newMemories}</div>
              <div className="text-sm text-gray-400">New Memories</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-white/5">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{data.monthlyStats.totalAccess}</div>
              <div className="text-sm text-gray-400">Total Access</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-white/5">
              <div className="text-3xl font-bold text-purple-400 mb-1">{data.monthlyStats.newCredentials}</div>
              <div className="text-sm text-gray-400">New Credentials</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-white/5">
              <div className="text-3xl font-bold text-amber-400 mb-1">{data.monthlyStats.activeAgents}</div>
              <div className="text-sm text-gray-400">Active Agents</div>
            </div>
          </div>
        </motion.div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="glass-card p-4 text-center">
            <Shield className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{data.encryptionRate}%</div>
            <div className="text-xs text-gray-500">Encrypted</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Globe className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <div className="text-lg font-bold">{data.uptime}%</div>
            <div className="text-xs text-gray-500">Uptime</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Zap className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className="text-lg font-bold">24ms</div>
            <div className="text-xs text-gray-500">P50 Latency</div>
          </div>
          
          <div className="glass-card p-4 text-center">
            <Database className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold">3</div>
            <div className="text-xs text-gray-500">Replicas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
