import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Share2, 
  Bot, 
  Brain,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Shield,
  Database,
  Activity,
  Clock,
  Zap
} from 'lucide-react'

// Mock agent data
const AGENTS = [
  { id: 'agent-1', name: 'Research Assistant', icon: '🔬', color: '#3b82f6', role: 'research' },
  { id: 'agent-2', name: 'Code Reviewer', icon: '💻', color: '#10b981', role: 'code' },
  { id: 'agent-3', name: 'Project Manager', icon: '📊', color: '#f59e0b', role: 'management' },
  { id: 'agent-4', name: 'Documentation Bot', icon: '📚', color: '#8b5cf6', role: 'docs' }
]

// Mock shared memory scenarios
const SCENARIOS = [
  {
    id: 'code-review',
    title: 'Cross-Agent Code Review',
    description: 'Code Reviewer analyzes PR, shares context with Documentation Bot',
    agents: ['agent-2', 'agent-4'],
    memory: {
      type: 'code_review',
      pr_number: '#42',
      changes: 'Added authentication middleware',
      recommendations: ['Add rate limiting', 'Improve error messages'],
      approved: true
    }
  },
  {
    id: 'research-handoff',
    title: 'Research to PM Handoff',
    description: 'Research findings automatically shared with Project Manager',
    agents: ['agent-1', 'agent-3'],
    memory: {
      type: 'research_summary',
      topic: 'Competitor Analysis',
      key_findings: ['Feature gap in authentication', 'Opportunity in mobile SDK'],
      priority: 'high'
    }
  },
  {
    id: 'team-sync',
    title: 'Team Memory Sync',
    description: 'All agents sync on project status and decisions',
    agents: ['agent-1', 'agent-2', 'agent-3', 'agent-4'],
    memory: {
      type: 'project_status',
      sprint: 'Sprint 23',
      completed: ['Auth module', 'API docs'],
      blocked: ['Mobile testing'],
      decisions: ['Delay v2.0 by 1 week']
    }
  }
]

const AgentCard = ({ agent, isActive, isSelected, onClick, showAccess }) => {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-offset-2 ring-offset-slate-900' 
          : 'hover:bg-white/5'
      }`}
      style={{ 
        backgroundColor: isSelected ? `${agent.color}20` : 'rgba(255,255,255,0.03)',
        borderColor: isSelected ? agent.color : 'rgba(255,255,255,0.1)',
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${agent.color}30` }}
        >
          {agent.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-white">{agent.name}</div>
          <div className="text-xs text-gray-400 capitalize">{agent.role}</div>
        </div>
        
        {showAccess && (
          <div className={`flex items-center gap-1 text-xs ${isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isActive ? 'Access' : 'No Access'}
          </div>
        )}
      </div>
      
      {isSelected && (
        <motion.div
          layoutId="selection-indicator"
          className="absolute inset-0 rounded-xl ring-2"
          style={{ ringColor: agent.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  )
}

const MemoryFlow = ({ scenario, activeStep, agents }) => {
  const [sourceAgent, targetAgent] = scenario.agents.map(id => agents.find(a => a.id === id))
  
  return (
    <div className="relative h-48 my-8">
      {/* Source Agent */}
      <motion.div 
        className="absolute left-0 top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${sourceAgent?.color}30` }}
          >
            {sourceAgent?.icon}
          </div>
          <span className="text-sm font-medium">{sourceAgent?.name}</span>
        </div>
      </motion.div>

      {/* Flow Animation */}
      <div className="absolute left-20 right-20 top-1/2 -translate-y-1/2 h-1 bg-gray-700 rounded-full">
        <motion.div 
          className="h-full rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${sourceAgent?.color}, ${targetAgent?.color})`,
            boxShadow: `0 0 20px ${sourceAgent?.color}50`
          }}
          initial={{ width: '0%' }}
          animate={{ width: activeStep >= 2 ? '100%' : activeStep === 1 ? '50%' : '0%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        
        {/* Data packets */}
        {activeStep >= 1 && activeStep < 3 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{ backgroundColor: sourceAgent?.color }}
            initial={{ left: '0%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: sourceAgent?.color }} />
          </motion.div>
        )}
      </div>

      {/* Verification Steps */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        {activeStep >= 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">NFT Verified</span>
          </motion.div>
        )}
        {activeStep >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50"
          >
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">Decrypted</span>
          </motion.div>
        )}
      </div>

      {/* Target Agent */}
      <motion.div 
        className="absolute right-0 top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ backgroundColor: `${targetAgent?.color}30` }}
          >
            {targetAgent?.icon}
          </div>
          <span className="text-sm font-medium">{targetAgent?.name}</span>
        </div>
      </motion.div>
    </div>
  )
}

const MemoryCard = ({ memory, isRevealed }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-vault-accent" />
        <span className="text-sm font-medium text-gray-400">Shared Memory</span>
      </div>
      
      {isRevealed ? (
        <div className="bg-black/30 rounded-lg p-3 font-mono text-xs overflow-auto max-h-[200px]">
          <pre className="text-green-400">{JSON.stringify(memory, null, 2)}</pre>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 bg-black/20 rounded-lg">
          <div className="text-center">
            <Lock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Memory encrypted</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function AgentCoordination() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0])
  const [demoStep, setDemoStep] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [accessGrants, setAccessGrants] = useState({})
  const [showMemory, setShowMemory] = useState(false)

  const startDemo = () => {
    setIsRunning(true)
    setDemoStep(1)
    setShowMemory(false)
    
    // Step 1: Check access (1s)
    setTimeout(() => {
      setDemoStep(2)
      // Grant access
      const grants = {}
      selectedScenario.agents.forEach((agentId, idx) => {
        grants[agentId] = idx === 0 ? 'owner' : 'granted'
      })
      setAccessGrants(grants)
    }, 1500)
    
    // Step 2: Transfer memory (1s)
    setTimeout(() => {
      setDemoStep(3)
    }, 3000)
    
    // Step 3: Decrypt (1s)
    setTimeout(() => {
      setDemoStep(4)
      setShowMemory(true)
    }, 4500)
    
    // End
    setTimeout(() => {
      setIsRunning(false)
      setDemoStep(0)
    }, 7000)
  }

  const resetDemo = () => {
    setDemoStep(0)
    setIsRunning(false)
    setAccessGrants({})
    setShowMemory(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">Multi-Agent Coordination</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Agent Coordination Demo
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            See how AI agents securely share memories using NFT-based access credentials
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel: Scenarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-vault-accent" />
              Demo Scenarios
            </h3>
            
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario)
                  resetDemo()
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedScenario.id === scenario.id
                    ? 'bg-white/10 border-vault-accent/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                disabled={isRunning}
              >
                <div className="flex items-center gap-2 mb-2">
                  {scenario.agents.map(agentId => {
                    const agent = AGENTS.find(a => a.id === agentId)
                    return (
                      <span key={agentId} className="text-lg">{agent?.icon}</span>
                    )
                  })}
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>
                <h4 className="font-medium mb-1">{scenario.title}</h4>
                <p className="text-sm text-gray-400">{scenario.description}</p>
              </button>
            ))}
          </div>

          {/* Center Panel: Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Grid */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-vault-accent" />
                Active Agents
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {AGENTS.map((agent) => {
                  const isActive = selectedScenario.agents.includes(agent.id)
                  const hasAccess = accessGrants[agent.id]
                  
                  return (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isActive={!!hasAccess}
                      isSelected={isActive}
                      showAccess={demoStep > 0}
                    />
                  )
                })}
              </div>
            </div>

            {/* Flow Visualization */}
            <AnimatePresence mode="wait">
              {demoStep > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-vault-accent" />
                    Memory Transfer
                  </h3>
                  
                  <MemoryFlow 
                    scenario={selectedScenario}
                    activeStep={demoStep}
                    agents={AGENTS}
                  />
                  
                  {showMemory && (
                    <MemoryCard 
                      memory={selectedScenario.memory}
                      isRevealed={true}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Log */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-vault-accent" />
                Coordination Log
              </h3>
              
              <div className="space-y-2 font-mono text-sm">
                <div className={`flex items-center gap-2 ${demoStep >= 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{demoStep > 0 ? '✓' : '○'}</span>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>Initiating memory share...</span>
                </div>
                
                <div className={`flex items-center gap-2 ${demoStep >= 1 ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{demoStep >= 1 ? '✓' : '○'}</span>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>Verifying NFT access credentials...</span>
                </div>
                
                <div className={`flex items-center gap-2 ${demoStep >= 2 ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{demoStep >= 2 ? '✓' : '○'}</span>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>Transferring encrypted memory via IPFS...</span>
                </div>
                
                <div className={`flex items-center gap-2 ${demoStep >= 3 ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>{demoStep >= 3 ? '✓' : '○'}</span>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>Decrypting in secure enclave...</span>
                </div>
                
                <div className={`flex items-center gap-2 ${demoStep >= 4 ? 'text-emerald-400' : 'text-gray-600'}`}>
                  <span>{demoStep >= 4 ? '✓' : '○'}</span>
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>Memory successfully shared! ✅</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={startDemo}
                disabled={isRunning}
                className="btn btn-primary flex-1"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Running Demo...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Coordination Demo
                  </>
                )}
              </button>
              
              <button
                onClick={resetDemo}
                disabled={isRunning}
                className="btn btn-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">How Agent Coordination Works</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Lock,
                title: '1. Owner Encrypts',
                desc: 'Source agent encrypts memory client-side before sharing'
              },
              {
                icon: Share2,
                title: '2. Grant Access',
                desc: 'Owner mints NFT credential granting access to target agent'
              },
              {
                icon: CheckCircle,
                title: '3. Verify On-Chain',
                desc: 'Smart contract verifies NFT ownership and access rights'
              },
              {
                icon: Brain,
                title: '4. Decrypt & Learn',
                desc: 'Target agent receives and decrypts memory in TEE'
              }
            ].map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={idx} className="glass-card p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-vault-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-vault-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-1">4</div>
            <div className="text-sm text-gray-500">Agents Connected</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-1">&lt;2s</div>
            <div className="text-sm text-gray-500">Sync Time</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-1">100%</div>
            <div className="text-sm text-gray-500">Encrypted</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold text-amber-400 mb-1">∞</div>
            <div className="text-sm text-gray-500">Possible Combinations</div>
          </div>
        </div>
      </div>
    </div>
  )
}
