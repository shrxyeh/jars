"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { WagmiConfig, createConfig } from "wagmi"
import { base, optimism, gnosis, sepolia, arbitrum, celo } from "wagmi/chains"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"

const chains = [base, optimism, gnosis, sepolia, arbitrum, celo]

const config = createConfig(
  getDefaultConfig({
    appName: "Web3 Jar System",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains,
  }),
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  )
}

