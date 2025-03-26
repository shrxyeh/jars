import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { sepolia, baseSepolia, optimismSepolia, gnosisChiado, arbitrumSepolia, celoAlfajores } from "viem/chains"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"

// Map chain IDs to their configurations
const chainConfigs = {
  // Sepolia testnet (Ethereum)
  11155111: { chain: sepolia, name: "Sepolia" },
  // Base Sepolia
  84532: { chain: baseSepolia, name: "Base Sepolia" },
  // Optimism Sepolia
  11155420: { chain: optimismSepolia, name: "Optimism Sepolia" },
  // Gnosis Chiado
  10200: { chain: gnosisChiado, name: "Gnosis Chiado" },
  // Arbitrum Sepolia
  421614: { chain: arbitrumSepolia, name: "Arbitrum Sepolia" },
  // Celo Alfajores
  44787: { chain: celoAlfajores, name: "Celo Alfajores" }
};

// Helper to get chain config from ID
function getChainConfig(chainId: number) {
  return chainConfigs[chainId as keyof typeof chainConfigs];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const jarId = searchParams.get("jarId")
    const index = searchParams.get("index")
    const chainId = searchParams.get("chainId") || "11155111" // Default to Sepolia if not specified

    if (!jarId || !index) {
      return NextResponse.json({ error: "Missing required parameters: jarId and index" }, { status: 400 })
    }

    // Get chain configuration
    const chainConfig = getChainConfig(parseInt(chainId))
    if (!chainConfig) {
      return NextResponse.json({ error: `Unsupported chain ID: ${chainId}` }, { status: 400 })
    }

    const contractAddress = getContractAddress(parseInt(chainId))
    if (!contractAddress) {
      return NextResponse.json({ error: `Contract not deployed on chain: ${chainConfig.name}` }, { status: 400 })
    }

    // Create a client for the specified chain
    const client = createPublicClient({
      chain: chainConfig.chain,
      transport: http()
    })

    // Fetch the claim data from the smart contract
    try {
      const claim = await client.readContract({
        address: contractAddress,
        abi: JarSystemABI,
        functionName: "getJarClaim",
        args: [BigInt(jarId), BigInt(index)]
      })

      if (!claim) {
        return NextResponse.json({ error: "Claim not found" }, { status: 404 })
      }

      // Format the claim data
      const [claimer, amount, reason, timestamp] = claim as [string, bigint, string, bigint]

      return NextResponse.json({
        claimer,
        amount: amount.toString(),
        reason,
        timestamp: Number(timestamp)
      })
    } catch (error: any) {
      console.error("Error reading claim from contract:", error)
      
      // Provide specific error message if available
      const errorMessage = error.message || "Failed to fetch claim from contract"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Unexpected error in claims API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}