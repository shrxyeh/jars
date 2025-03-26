"use client"

import { useState, useEffect } from "react"
import { useContractRead } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import type { Jar } from "@/types/jar"
import { getTokenSymbol } from "@/lib/tokens"

export function useJarDetails(jarId: string, refreshKey: number = 0) {
  const [jarDetails, setJarDetails] = useState<Jar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For demo purposes, we'll use a fixed chain ID
  // In a real app, you would determine this from the context or a parameter
  const chainId = 11155111 // Sepolia
  const contractAddress = getContractAddress(chainId)

  const { data, isLoading: isLoadingContract, isError, error: contractError } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "getJarDetails",
    args: [BigInt(jarId)],
    enabled: Boolean(contractAddress && jarId),
    // This ensures the hook refetches when refreshKey changes
    cacheTime: 0,
    staleTime: 0,
  })

  useEffect(() => {
    if (isError && contractError) {
      setError("Failed to load jar details. Please try again later.");
      setIsLoading(false);
      return;
    }

    if (data && !isLoadingContract) {
      try {
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

        if (!isActive) {
          setError("This jar has been deleted or is no longer active.");
          setJarDetails(null);
          setIsLoading(false);
          return;
        }

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
          canWithdraw: false, // This will be set by another hook
          isAdmin: false, // This will be set by another hook
        })

        setError(null);
      } catch (err) {
        console.error("Error parsing jar details:", err);
        setError("Failed to parse jar details. The jar may not exist or has been deleted.");
      }
      
      setIsLoading(false);
    }
  }, [data, isLoadingContract, jarId, chainId, isError, contractError, refreshKey])

  return { jarDetails, isLoading, error }
}