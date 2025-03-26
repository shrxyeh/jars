"use client"

import { useState, useEffect } from "react"
import { useContractRead } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import type { Jar } from "@/types/jar"
import { getTokenSymbol } from "@/lib/tokens"

export function useJarDetails(jarId: string) {
  const [jarDetails, setJarDetails] = useState<Jar | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // For demo purposes, we'll use a fixed chain ID
  // In a real app, you would determine this from the context or a parameter
  const chainId = 11155111 // Sepolia
  const contractAddress = getContractAddress(chainId)

  const { data, isLoading: isLoadingContract } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "getJarDetails",
    args: [BigInt(jarId)],
    enabled: Boolean(contractAddress && jarId),
  })

  useEffect(() => {
    if (data && !isLoadingContract) {
      const [
        title,
        description,
        creator,
        tokenAddress,
        balance,
        maxWithdrawalAmount,
        cooldownPeriod,
        isActive,
        accessControlType,
      ] = data as [string, string, string, string, bigint, bigint, bigint, boolean, number]

      const accessControlTypeMap = ["Open", "Whitelist", "ERC20Gated", "NFTGated"]

      setJarDetails({
        id: jarId,
        title,
        description,
        creator,
        tokenAddress,
        balance: balance.toString(),
        maxWithdrawalAmount: maxWithdrawalAmount.toString(),
        cooldownPeriod: Number(cooldownPeriod),
        isActive,
        accessControlType: accessControlTypeMap[accessControlType],
        chainId,
        tokenSymbol: getTokenSymbol(tokenAddress, chainId),
        canWithdraw: false, // This would be set by another hook
        isAdmin: false, // This would be set by another hook
      })

      setIsLoading(false)
    }
  }, [data, isLoadingContract, jarId, chainId])

  return { jarDetails, isLoading }
}

