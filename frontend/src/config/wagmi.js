import { createConfig, configureChains } from 'wagmi'
import { baseSepolia, hardhat } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const { chains, publicClient } = configureChains(
  [baseSepolia, hardhat],
  [publicProvider()]
)

export const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: 'memoryvault-pro-hackathon',
        metadata: {
          name: 'MemoryVault Pro',
          description: 'AI Agent Memory on Blockchain',
          url: 'https://memoryvault-pro.vercel.app',
          icons: ['https://memoryvault-pro.vercel.app/icon.png']
        }
      }
    })
  ],
  publicClient
})

export { chains }
