"use client"

import { useState, useEffect } from "react"
import { useContractRead } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"

export function useCanWithdraw(jarId: string, address?: string, refreshKey: number = 0) {
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // For demo purposes, we'll use a fixed chain ID
  const chainId = 11155111 // Sepolia
  const contractAddress = getContractAddress(chainId)

  const { data, isLoading: isLoadingContract, isError } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "canUserWithdraw",
    args: [BigInt(jarId), address || "0x0000000000000000000000000000000000000000"],
    enabled: Boolean(contractAddress && jarId && address),
    // This ensures the hook refetches when refreshKey changes
    cacheTime: 0,
    staleTime: 0,
  })

  useEffect(() => {
    if (isError) {
      setError("Failed to check withdrawal eligibility. Please try again later.");
      setIsLoading(false);
      return;
    }

    if (data !== undefined && !isLoadingContract) {
      setCanWithdraw(Boolean(data))
      setError(null);
      setIsLoading(false)
    }
  }, [data, isLoadingContract, isError, refreshKey])

  return { canWithdraw, isLoading, error }
}