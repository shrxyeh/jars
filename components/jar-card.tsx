"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useCanWithdraw } from "@/hooks/use-can-withdraw"
import { useIsJarAdmin } from "@/hooks/use-is-jar-admin"
import Link from "next/link"
import type { Jar } from "@/types/jar"
import { getTokenSymbol } from "@/lib/tokens"

interface JarCardProps {
  jar: Jar
}

export function JarCard({ jar }: JarCardProps) {
  const { address } = useAccount()
  const { canWithdraw, isLoading: isLoadingWithdraw } = useCanWithdraw(jar.id, address)
  const { isAdmin, isLoading: isLoadingAdmin } = useIsJarAdmin(jar.id, address)

  const tokenSymbol = getTokenSymbol(jar.tokenAddress, jar.chainId)
  const formattedBalance = formatEther(BigInt(jar.balance))

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{jar.title}</CardTitle>
            <CardDescription className="mt-1">{jar.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {jar.accessControlType !== "Open" && <Badge variant="outline">{jar.accessControlType}</Badge>}
            {isAdmin && <Badge>Admin</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance:</span>
            <span className="font-medium">
              {formattedBalance} {tokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Withdrawal:</span>
            <span className="font-medium">
              {jar.maxWithdrawalAmount ? `${formatEther(BigInt(jar.maxWithdrawalAmount))} ${tokenSymbol}` : "No limit"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cooldown:</span>
            <span className="font-medium">{jar.cooldownPeriod ? `${jar.cooldownPeriod / 60} minutes` : "None"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/jars/${jar.id}`} className="w-full">
          <Button className="w-full" variant={canWithdraw ? "default" : "secondary"}>
            {canWithdraw ? "Withdraw" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

