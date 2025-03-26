"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import type { Jar } from "@/types/jar"

export function useJars(chainId?: number) {
  const [jars, setJars] = useState<Jar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { address } = useAccount()

  useEffect(() => {
    async function fetchJars() {
      setIsLoading(true)
      try {
        // In a real app, this would be an API call to fetch jars from the blockchain
        // For demo purposes, we'll use mock data
        const mockJars: Jar[] = [
          {
            id: "1",
            title: "Team Treasury",
            description: "Funds for team expenses and operations",
            creator: "0x1234567890123456789012345678901234567890",
            tokenAddress: "0x0000000000000000000000000000000000000000",
            balance: "1000000000000000000", // 1 ETH
            maxWithdrawalAmount: "100000000000000000", // 0.1 ETH
            cooldownPeriod: 3600, // 1 hour
            isActive: true,
            accessControlType: "Whitelist",
            chainId: chainId || 11155111,
            tokenSymbol: "ETH",
            canWithdraw: true,
            isAdmin: address === "0x1234567890123456789012345678901234567890",
          },
          {
            id: "2",
            title: "Community Grants",
            description: "Funding for community projects and initiatives",
            creator: "0x2345678901234567890123456789012345678901",
            tokenAddress: "0x0000000000000000000000000000000000000000",
            balance: "5000000000000000000", // 5 ETH
            maxWithdrawalAmount: "1000000000000000000", // 1 ETH
            cooldownPeriod: 86400, // 24 hours
            isActive: true,
            accessControlType: "Open",
            chainId: chainId || 11155111,
            tokenSymbol: "ETH",
            canWithdraw: true,
            isAdmin: false,
          },
          {
            id: "3",
            title: "Developer Fund",
            description: "Resources for developers building on our platform",
            creator: "0x3456789012345678901234567890123456789012",
            tokenAddress: "0x0000000000000000000000000000000000000000",
            balance: "3000000000000000000", // 3 ETH
            maxWithdrawalAmount: "500000000000000000", // 0.5 ETH
            cooldownPeriod: 43200, // 12 hours
            isActive: true,
            accessControlType: "ERC20Gated",
            chainId: chainId || 11155111,
            tokenSymbol: "ETH",
            canWithdraw: false,
            isAdmin: false,
          },
        ]

        // Filter by chain if provided
        const filteredJars = chainId ? mockJars.filter((jar) => jar.chainId === chainId) : mockJars

        setJars(filteredJars)
      } catch (error) {
        console.error("Error fetching jars:", error)
        setJars([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchJars()
  }, [chainId, address])

  return { jars, isLoading }
}

