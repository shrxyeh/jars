// Map of chain IDs to contract addresses
const contractAddresses: Record<number, string> = {
  // Sepolia testnet (Ethereum)
  11155111: "0x1234567890123456789012345678901234567890", // Replace with actual address after deployment
  
  // Base Sepolia testnet 
  84532: "0x2345678901234567890123456789012345678901", // Replace with actual address after deployment
  
  // Optimism Sepolia testnet
  11155420: "0x3456789012345678901234567890123456789012", // Replace with actual address after deployment
  
  // Gnosis Chiado testnet
  10200: "0x4567890123456789012345678901234567890123", // Replace with actual address after deployment
  
  // Arbitrum Sepolia testnet
  421614: "0x5678901234567890123456789012345678901234", // Replace with actual address after deployment
  
  // Celo Alfajores testnet
  44787: "0x6789012345678901234567890123456789012345", // Replace with actual address after deployment
};

export function getContractAddress(chainId?: number): string | undefined {
  if (!chainId) return undefined;
  return contractAddresses[chainId];
}

// After deploying to each network, update the addresses above with the actual deployed contract addresses