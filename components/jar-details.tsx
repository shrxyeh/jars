"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useCanWithdraw } from "@/hooks/use-can-withdraw"
import { useIsJarAdmin } from "@/hooks/use-is-jar-admin"
import type { Jar } from "@/types/jar"
import { getTokenSymbol } from "@/lib/tokens"
import { getTimeUntilNextWithdrawal } from "@/hooks/use-time-until-next-withdrawal"
import { useEffect, useState } from "react"

interface JarDetailsProps {
  jar: Jar
}

export function JarDetails({ jar }: JarDetailsProps) {
  const { address } = useAccount()
  const { canWithdraw, isLoading: isLoadingWithdraw } = useCanWithdraw(jar.id, address)
  const { isAdmin, isLoading: isLoadingAdmin } = useIsJarAdmin(jar.id, address)
  const { timeUntil, isLoading: isLoadingTime } = getTimeUntilNextWithdrawal(jar.id, address)
  const [countdown, setCountdown] = useState<string>("")

  const tokenSymbol = getTokenSymbol(jar.tokenAddress, jar.chainId)
  const formattedBalance = formatEther(BigInt(jar.balance))

  useEffect(() => {
    if (!isLoadingTime && timeUntil > 0) {
      const interval = setInterval(() => {
        const seconds = Math.floor(timeUntil % 60)
        const minutes = Math.floor((timeUntil / 60) % 60)
        const hours = Math.floor((timeUntil / (60 * 60)) % 24)
        const days = Math.floor(timeUntil / (60 * 60 * 24))

        setCountdown(
          `${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        )
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [timeUntil, isLoadingTime])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{jar.title}</h1>
              <div className="flex gap-2">
                {jar.accessControlType !== "Open" && <Badge variant="outline">{jar.accessControlType}</Badge>}
                {isAdmin && <Badge>Admin</Badge>}
              </div>
            </div>
            <p className="text-muted-foreground">{jar.description}</p>
          </div>

          <div className="flex flex-col items-end justify-center">
            <div className="text-3xl font-bold">
              {formattedBalance} {tokenSymbol}
            </div>
            <div className="text-sm text-muted-foreground">Current Balance</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Max Withdrawal</div>
            <div className="font-medium">
              {jar.maxWithdrawalAmount ? `${formatEther(BigInt(jar.maxWithdrawalAmount))} ${tokenSymbol}` : "No limit"}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Cooldown Period</div>
            <div className="font-medium">{jar.cooldownPeriod ? `${jar.cooldownPeriod / 60} minutes` : "None"}</div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Withdrawal Status</div>
            <div className="font-medium">
              {isLoadingWithdraw ? (
                "Loading..."
              ) : canWithdraw ? (
                <span className="text-green-500">Available</span>
              ) : (
                <span className="text-yellow-500">{countdown ? `Cooldown: ${countdown}` : "Not Available"}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

