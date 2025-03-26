"use client"

import { useState, useEffect } from "react"
import { useContractRead } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"

export function getTimeUntilNextWithdrawal(jarId: string, address?: string) {
  const [timeUntil, setTimeUntil] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // For demo purposes, we'll use a fixed chain ID
  const chainId = 11155111 // Sepolia
  const contractAddress = getContractAddress(chainId)

  const { data, isLoading: isLoadingContract } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "getTimeUntilNextWithdrawal",
    args: [BigInt(jarId), address || "0x0000000000000000000000000000000000000000"],
    enabled: Boolean(contractAddress && jarId && address),
  })

  useEffect(() => {
    if (data !== undefined && !isLoadingContract) {
      setTimeUntil(Number(data))
      setIsLoading(false)
    }
  }, [data, isLoadingContract])

  return { timeUntil, isLoading }
}

