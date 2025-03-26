"use client"

import { useParams } from "next/navigation"
import { useAccount } from "wagmi"
import { JarDetails } from "@/components/jar-details"
import { WithdrawalForm } from "@/components/withdrawal-form"
import { ClaimHistory } from "@/components/claim-history"
import { AdminPanel } from "@/components/admin-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useJarDetails } from "@/hooks/use-jar-details"
import { useIsJarAdmin } from "@/hooks/use-is-jar-admin"

export default function JarPage() {
  const { id } = useParams()
  const jarId = Array.isArray(id) ? id[0] : id
  const { address } = useAccount()
  const { jarDetails, isLoading: isLoadingJar } = useJarDetails(jarId)
  const { isAdmin, isLoading: isLoadingAdmin } = useIsJarAdmin(jarId, address)

  if (isLoadingJar) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!jarDetails) {
    return <div className="text-center py-12">Jar not found or has been deleted.</div>
  }

  return (
    <div className="space-y-8">
      <JarDetails jar={jarDetails} />

      <Tabs defaultValue="withdraw" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">Claim History</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
        </TabsList>
        <TabsContent value="withdraw" className="py-4">
          <WithdrawalForm jarId={jarId} maxAmount={jarDetails.maxWithdrawalAmount} />
        </TabsContent>
        <TabsContent value="history" className="py-4">
          <ClaimHistory jarId={jarId} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="admin" className="py-4">
            <AdminPanel jarId={jarId} jar={jarDetails} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

