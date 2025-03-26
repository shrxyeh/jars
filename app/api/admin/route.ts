import { type NextRequest, NextResponse } from "next/server"

// This is a mock implementation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const jarId = searchParams.get("jarId")

  if (!jarId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  // For demo purposes, return mock data
  const mockAdmins = ["0x6789012345678901234567890123456789012345", "0x7890123456789012345678901234567890123456"]

  return NextResponse.json(mockAdmins)
}

