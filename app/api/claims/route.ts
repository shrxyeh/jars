import { type NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jarId = searchParams.get("jarId")
  const index = searchParams.get("index")

  if (!jarId || !index) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    // For demo purposes, we'll use the sepolia chain
    // In a real app, you would determine the chain from the jarId or a parameter
    const chain = sepolia
    const contractAddress = getContractAddress(chain.id)

    if (!contractAddress) {
      return NextResponse.json({ error: "Contract not deployed on this chain" }, { status: 400 })
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    })

    const claim = await client.readContract({
      address: contractAddress,
      abi: JarSystemABI,
      functionName: "getJarClaim",
      args: [BigInt(jarId), BigInt(index)],
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
      timestamp: Number(timestamp),
    })
  } catch (error) {
    console.error("Error fetching claim:", error)
    return NextResponse.json({ error: "Failed to fetch claim" }, { status: 500 })
  }
}

