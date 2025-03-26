// Token configurations
interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

// Map of token addresses to their configurations across different chains
const tokenConfigs: Record<string, TokenConfig> = {
  "0x0000000000000000000000000000000000000000": {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  // Example ERC20 tokens - these would be replaced with actual token addresses
  "0x1111111111111111111111111111111111111111": {
    name: "Test USDC",
    symbol: "USDC",
    decimals: 6,
  },
  "0x2222222222222222222222222222222222222222": {
    name: "Test DAI",
    symbol: "DAI",
    decimals: 18,
  },
};

// Chain-specific native token symbols
const chainNativeTokens: Record<number, string> = {
  1: "ETH", // Ethereum Mainnet
  11155111: "ETH", // Sepolia Testnet
  84532: "ETH", // Base Sepolia
  11155420: "ETH", // Optimism Sepolia
  10200: "xDAI", // Gnosis Chiado
  421614: "ETH", // Arbitrum Sepolia
  44787: "CELO", // Celo Alfajores
};

export function getTokenSymbol(tokenAddress: string, chainId?: number): string {
  // For native token (ETH/xDAI/CELO)
  if (tokenAddress === "0x0000000000000000000000000000000000000000" && chainId) {
    return chainNativeTokens[chainId] || "ETH";
  }

  // For ERC20 tokens
  return tokenConfigs[tokenAddress]?.symbol || "Unknown";
}

export function getTokenName(tokenAddress: string, chainId?: number): string {
  // For native token
  if (tokenAddress === "0x0000000000000000000000000000000000000000" && chainId) {
    const symbol = chainNativeTokens[chainId] || "ETH";
    return symbol === "ETH" ? "Ether" : 
           symbol === "xDAI" ? "xDAI" : 
           symbol === "CELO" ? "Celo" : "Native Token";
  }

  // For ERC20 tokens
  return tokenConfigs[tokenAddress]?.name || "Unknown Token";
}

export function getTokenDecimals(tokenAddress: string): number {
  return tokenConfigs[tokenAddress]?.decimals || 18;
}

export function isNativeToken(tokenAddress: string): boolean {
  return tokenAddress === "0x0000000000000000000000000000000000000000";
}