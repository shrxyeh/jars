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
import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function JarPage() {
  const { id } = useParams()
  const router = useRouter()
  const jarId = Array.isArray(id) ? id[0] : id
  const { address } = useAccount()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Use the refreshKey to force re-fetching data
  const { jarDetails, isLoading: isLoadingJar, error: jarError } = useJarDetails(jarId, refreshKey)
  const { isAdmin, isLoading: isLoadingAdmin } = useIsJarAdmin(jarId, address, refreshKey)

  const refreshJarData = useCallback(() => {
    setIsRefreshing(true)
    // Increment the key to trigger data refresh in hooks
    setRefreshKey(prev => prev + 1)
    
    // Visual feedback for refresh action
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [])

  // Refresh data when address changes
  useEffect(() => {
    refreshJarData()
  }, [address, refreshJarData])

  if (isLoadingJar) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (jarError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error loading jar</AlertTitle>
        <AlertDescription>
          There was a problem loading the jar details. Please try again later or check if the jar exists.
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push('/')}>Back to Home</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!jarDetails) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Jar not found or has been deleted.</h2>
        <Button variant="outline" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshJarData} 
          disabled={isRefreshing}
          className={isRefreshing ? "animate-spin" : ""}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    
      <JarDetails jar={jarDetails} onRefresh={refreshJarData} />

      <Tabs defaultValue="withdraw" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">Claim History</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
        </TabsList>
        <TabsContent value="withdraw" className="py-4">
          <WithdrawalForm 
            jarId={jarId} 
            maxAmount={jarDetails.maxWithdrawalAmount} 
            onWithdrawSuccess={refreshJarData}
          />
        </TabsContent>
        <TabsContent value="history" className="py-4">
          <ClaimHistory jarId={jarId} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="admin" className="py-4">
            <AdminPanel 
              jarId={jarId} 
              jar={jarDetails} 
              onActionSuccess={refreshJarData}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}