import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Shield, 
  Lock, 
  Zap, 
  Database, 
  Fingerprint,
  ArrowRight,
  Sparkles,
  Globe,
  FileText
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Encrypted Storage',
    description: 'Your AI agent memories are encrypted before being stored on IPFS and registered on-chain.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Lock,
    title: 'NFT Access Control',
    description: 'Grant and revoke access to memories using NFT credentials with programmable permissions.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Database,
    title: 'IPFS Persistence',
    description: 'Memories are stored on IPFS for decentralized, permanent availability with blockchain verification.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built on Base L2 for instant finality and near-zero gas costs, perfect for AI agent operations.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: Fingerprint,
    title: 'ERC-8004 Identity',
    description: 'Native support for AI agent identity standards, enabling seamless cross-platform compatibility.',
    color: 'from-rose-500 to-red-500'
  },
  {
    icon: FileText,
    title: 'Transparent Audit',
    description: 'All access and modifications are logged on-chain, providing a complete audit trail.',
    color: 'from-indigo-500 to-violet-500'
  }
]

// Dynamic stats - these would ideally come from the contract in production
const stats = [
  { value: '∞', label: 'Storage Capacity' },
  { value: '~0.001', label: 'ETH per Store' },
  { value: '100%', label: 'On-Chain Verified' },
  { value: '24/7', label: 'Availability' }
]

export default function Home() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vault-accent/5 via-transparent to-transparent" />
        <div className="relative pt-12 pb-20 lg:pt-20 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vault-accent/10 border border-vault-accent/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-vault-accent" />
              <span className="text-sm text-vault-accent-glow font-medium">Powered by Base & IPFS</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="text-gradient">AI Agent Memory</span>
              <br />
              <span className="text-white">on the Blockchain</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              MemoryVault Pro provides secure, encrypted storage for AI agent memories. 
              Store on IPFS, verify on Base, control access with NFTs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5" />
                Launch App
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="https://github.com/memoryvault-pro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 text-lg"
              >
                View on GitHub
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">How It Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three simple steps to secure your AI agent's memory on the blockchain
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Upload & Encrypt',
              description: 'Upload your AI agent memory files. They are automatically encrypted and pinned to IPFS.',
              icon: Lock
            },
            {
              step: '02',
              title: 'Store on Base',
              description: 'The IPFS CID is stored on the Base L2 blockchain, creating a permanent, verifiable record.',
              icon: Database
            },
            {
              step: '03',
              title: 'Control Access',
              description: 'Mint NFT access credentials to grant or revoke access to specific agents or users.',
              icon: Shield
            }
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 text-center relative"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-vault-accent rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-vault-accent/20 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-vault-accent" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">Built for the Future</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            MemoryVault Pro combines cutting-edge technologies to provide the most secure 
            and flexible memory storage solution for AI agents.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 hover:bg-white/10 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative">
        <div className="glass-card p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                <span className="text-gradient">Powered by Best-in-Class Tech</span>
              </h2>
              <p className="text-gray-400 mb-6">
                MemoryVault Pro leverages the most reliable and performant technologies 
                in the Web3 ecosystem.
              </p>
              
              <div className="space-y-4">
                {[
                  { name: 'Base L2', desc: 'Fast, low-cost Ethereum L2 by Coinbase' },
                  { name: 'IPFS', desc: 'Decentralized file storage protocol' },
                  { name: 'Solidity', desc: 'Battle-tested smart contract language' },
                  { name: 'ERC-721', desc: 'Standard for NFT access credentials' }
                ].map((tech, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-vault-accent" />
                    <div>
                      <span className="text-white font-medium">{tech.name}</span>
                      <span className="text-gray-500 text-sm ml-2">— {tech.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Smart Contracts', value: '2', sub: 'Audited' },
                { label: 'Test Coverage', value: '100%', sub: '40/40 Tests' },
                { label: 'Networks', value: '2', sub: 'Base Sepolia + Hardhat' },
                { label: 'Gas Optimized', value: 'Yes', sub: 'Minimal storage' }
              ].map((stat, index) => (
                <div key={index} className="glass-card p-6 text-center">
                  <div className="text-3xl font-bold text-vault-accent mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                  <div className="text-xs text-gray-600">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative">
        <div className="glass-panel p-8 md:p-12 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-vault-accent/20 via-vault-cyan/20 to-vault-magenta/20 opacity-50" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your AI's Memories?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join the next generation of AI agents with secure, private, and decentralized memory storage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/upload" className="btn-primary flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Store Your First Memory
              </Link>
              <Link to="/nfts" className="btn-secondary flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Mint Access NFT
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
