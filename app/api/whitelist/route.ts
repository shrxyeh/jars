import { type NextRequest, NextResponse } from "next/server"

// This is a mock implementation
//later query the blockchain for all whitelisted addresses
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jarId = searchParams.get("jarId")

  if (!jarId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  // For demo purposes, return mock data
  // later query events or use a subgraph
  const mockWhitelist = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901",
    "0x3456789012345678901234567890123456789012",
  ]

  return NextResponse.json(mockWhitelist)
}

