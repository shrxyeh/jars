"use client"

import { useEffect, useState } from "react"
import { formatEther } from "viem"
import { useContractRead } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { useJarDetails } from "@/hooks/use-jar-details"
import { formatDistanceToNow } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Claim {
  claimer: string
  amount: string
  reason: string
  timestamp: number
}

interface ClaimHistoryProps {
  jarId: string
}

export function ClaimHistory({ jarId }: ClaimHistoryProps) {
  const [claims, setClaims] = useState<Claim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { jarDetails } = useJarDetails(jarId)
  const contractAddress = getContractAddress(jarDetails?.chainId)

  const { data: claimsCount } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "getJarClaimsCount",
    args: [BigInt(jarId)],
  })

  useEffect(() => {
    async function fetchClaims() {
      if (!claimsCount || !contractAddress) return

      setIsLoading(true)
      const fetchedClaims: Claim[] = []

      for (let i = 0; i < Number(claimsCount); i++) {
        try {
          const claim = await fetchClaim(i)
          if (claim) {
            fetchedClaims.push(claim)
          }
        } catch (error) {
          console.error(`Error fetching claim ${i}:`, error)
        }
      }

      setClaims(fetchedClaims.reverse()) // Show newest first
      setIsLoading(false)
    }

    fetchClaims()
  }, [claimsCount, contractAddress, jarId])

  const fetchClaim = async (index: number): Promise<Claim | null> => {
    try {
      const result = await fetch(`/api/claims?jarId=${jarId}&index=${index}`)
      if (!result.ok) throw new Error("Failed to fetch claim")
      return await result.json()
    } catch (error) {
      console.error("Error fetching claim:", error)
      return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim History</CardTitle>
          <CardDescription>Recent withdrawals from this jar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim History</CardTitle>
          <CardDescription>Recent withdrawals from this jar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">No claims have been made from this jar yet.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim History</CardTitle>
        <CardDescription>Recent withdrawals from this jar</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {claim.claimer.substring(0, 6)}...{claim.claimer.substring(38)}
                </TableCell>
                <TableCell>
                  {formatEther(BigInt(claim.amount))} {jarDetails?.tokenSymbol || "ETH"}
                </TableCell>
                <TableCell>{claim.reason}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(claim.timestamp * 1000), { addSuffix: true })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

