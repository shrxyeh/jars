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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)
  const { jarDetails } = useJarDetails(jarId)
  const contractAddress = getContractAddress(jarDetails?.chainId)

  // Get the number of claims for this jar
  const { data: claimsCount, isLoading: isLoadingCount, isError: isErrorCount } = useContractRead({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "getJarClaimsCount",
    args: [BigInt(jarId)],
    enabled: Boolean(contractAddress && jarId),
  })

  // Fetch claim details from the smart contract directly (no API needed)
  async function fetchClaim(index: number): Promise<Claim | null> {
    if (!contractAddress) return null;
    
    try {
      const { data } = await useContractRead({
        address: contractAddress,
        abi: JarSystemABI,
        functionName: "getJarClaim",
        args: [BigInt(jarId), BigInt(index)],
      });
      
      if (data) {
        const [claimer, amount, reason, timestamp] = data as [string, bigint, string, bigint];
        return {
          claimer,
          amount: amount.toString(),
          reason,
          timestamp: Number(timestamp)
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching claim ${index}:`, err);
      return null;
    }
  }

  // Alternative: Fetch claims using our API route
  async function fetchClaimViaAPI(index: number): Promise<Claim | null> {
    try {
      const result = await fetch(`/api/claims?jarId=${jarId}&index=${index}`);
      if (!result.ok) throw new Error("Failed to fetch claim");
      return await result.json();
    } catch (error) {
      console.error("Error fetching claim:", error);
      return null;
    }
  }

  useEffect(() => {
    async function fetchClaims() {
      if (!claimsCount || !contractAddress) return;

      setIsLoading(true);
      setError(null);
      const fetchedClaims: Claim[] = [];

      try {
        for (let i = 0; i < Number(claimsCount); i++) {
          // Use the API route since it's already implemented
          const claim = await fetchClaimViaAPI(i);
          if (claim) {
            fetchedClaims.push(claim);
          }
        }

        setClaims(fetchedClaims.reverse()); // Show newest first
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError("Failed to load claim history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchClaims();
  }, [claimsCount, contractAddress, jarId]);

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
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claim History</CardTitle>
          <CardDescription>Recent withdrawals from this jar</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
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
    );
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
  );
}