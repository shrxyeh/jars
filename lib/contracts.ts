// Map of chain IDs to contract addresses
const contractAddresses: Record<number, string> = {
  // Sepolia testnet
  11155111: "0x1234567890123456789012345678901234567890",
  // Base testnet
  84531: "0x2345678901234567890123456789012345678901",
  // Optimism testnet
  420: "0x3456789012345678901234567890123456789012",
  // Gnosis testnet
  10200: "0x4567890123456789012345678901234567890123",
  // Arbitrum testnet
  421613: "0x5678901234567890123456789012345678901234",
  // Celo testnet
  44787: "0x6789012345678901234567890123456789012345",
}

export function getContractAddress(chainId?: number): string | undefined {
  if (!chainId) return undefined
  return contractAddresses[chainId]
}

