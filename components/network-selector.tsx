"use client"

import { useNetwork, useSwitchNetwork } from "wagmi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

export function NetworkSelector() {
  const { chain } = useNetwork()
  const { chains, switchNetwork } = useSwitchNetwork()
  const [selectedChain, setSelectedChain] = useState<string | undefined>(chain?.id.toString())

  useEffect(() => {
    if (chain) {
      setSelectedChain(chain.id.toString())
    }
  }, [chain])

  const handleNetworkChange = (value: string) => {
    const chainId = Number.parseInt(value)
    if (switchNetwork) {
      switchNetwork(chainId)
    }
  }

  return (
    <Select value={selectedChain} onValueChange={handleNetworkChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Network" />
      </SelectTrigger>
      <SelectContent>
        {chains.map((chain) => (
          <SelectItem key={chain.id} value={chain.id.toString()}>
            {chain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

