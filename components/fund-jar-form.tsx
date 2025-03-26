import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatEther } from "viem"
import { useAccount } from "wagmi"
import { useCanWithdraw } from "@/hooks/use-can-withdraw"
import { useIsJarAdmin } from "@/hooks/use-is-jar-admin"
import type { Jar } from "@/types/jar"
import { getTokenSymbol } from "@/lib/tokens"
import { getTimeUntilNextWithdrawal } from "@/hooks/use-time-until-next-withdrawal"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FundJarForm } from "@/components/fund-jar-form"
import { RefreshCw } from "lucide-react"

interface JarDetailsProps {
  jar: Jar
  onRefresh?: () => void
}

export function JarDetails({ jar, onRefresh }: JarDetailsProps) {
  const { address } = useAccount()
  const { canWithdraw, isLoading: isLoadingWithdraw } = useCanWithdraw(jar.id, address)
  const { isAdmin, isLoading: isLoadingAdmin } = useIsJarAdmin(jar.id, address)
  const { timeUntil, isLoading: isLoadingTime } = getTimeUntilNextWithdrawal(jar.id, address)
  const [countdown, setCountdown] = useState<string>("")
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true)
      onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const handleFundSuccess = () => {
    setFundDialogOpen(false)
    if (onRefresh) {
      setTimeout(() => onRefresh(), 1000)
    }
  }

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
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">
                {formattedBalance} {tokenSymbol}
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleRefresh}
                className={isRefreshing ? "animate-spin" : ""}
                disabled={isRefreshing}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                  Fund This Jar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Fund Jar</DialogTitle>
                  <DialogDescription>
                    Add funds to support this jar's purpose
                  </DialogDescription>
                </DialogHeader>
                <FundJarForm jar={jar} onFundSuccess={handleFundSuccess} />
              </DialogContent>
            </Dialog>
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