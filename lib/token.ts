// Map of token addresses to symbols
const tokenSymbols: Record<string, string> = {
  "0x0000000000000000000000000000000000000000": "ETH",
  // Add other token addresses and symbols here
}

export function getTokenSymbol(tokenAddress: string, chainId?: number): string {
  // For ETH, we might want to use different symbols based on the chain
  if (tokenAddress === "0x0000000000000000000000000000000000000000") {
    if (chainId === 100 || chainId === 10200) return "xDAI" // Gnosis Chain
    if (chainId === 42220 || chainId === 44787) return "CELO" // Celo
    return "ETH"
  }

  return tokenSymbols[tokenAddress] || "Unknown"
}

