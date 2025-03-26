"use client"

import { useState } from "react"
import { useContractWrite, usePrepareContractWrite } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useJarDetails } from "@/hooks/use-jar-details"
import { WhitelistTable } from "@/components/whitelist-table"

interface WhitelistManagerProps {
  jarId: string
  onActionSuccess?: () => void
}

export function WhitelistManager({ jarId, onActionSuccess }: WhitelistManagerProps) {
  const { toast } = useToast()
  const [whitelistAddress, setWhitelistAddress] = useState("")
  const [blacklistAddress, setBlacklistAddress] = useState("")
  const [adminAddress, setAdminAddress] = useState("")
  const [isAddingToWhitelist, setIsAddingToWhitelist] = useState(false)
  const [isAddingToBlacklist, setIsAddingToBlacklist] = useState(false)
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)

  const { jarDetails } = useJarDetails(jarId)
  const contractAddress = getContractAddress(jarDetails?.chainId)

  // Add to Whitelist
  const { config: whitelistConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "addToWhitelist",
    args: [BigInt(jarId), whitelistAddress],
    enabled: Boolean(contractAddress && whitelistAddress),
  })

  const { write: addToWhitelist } = useContractWrite({
    ...whitelistConfig,
    onSuccess(data) {
      toast({
        title: "Transaction Submitted",
        description: "Adding user to whitelist. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "User Added to Whitelist",
          description: `${whitelistAddress} has been added to the whitelist.`,
        })
        setWhitelistAddress("")
        setIsAddingToWhitelist(false)
        if (onActionSuccess) onActionSuccess()
      })
    },
    onError(error) {
      toast({
        title: "Error Adding to Whitelist",
        description: error.message,
        variant: "destructive",
      })
      setIsAddingToWhitelist(false)
    },
  })

  // Add to Blacklist
  const { config: blacklistConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "addToBlacklist",
    args: [BigInt(jarId), blacklistAddress],
    enabled: Boolean(contractAddress && blacklistAddress),
  })

  const { write: addToBlacklist } = useContractWrite({
    ...blacklistConfig,
    onSuccess(data) {
      toast({
        title: "Transaction Submitted",
        description: "Adding user to blacklist. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "User Added to Blacklist",
          description: `${blacklistAddress} has been added to the blacklist.`,
        })
        setBlacklistAddress("")
        setIsAddingToBlacklist(false)
        if (onActionSuccess) onActionSuccess()
      })
    },
    onError(error) {
      toast({
        title: "Error Adding to Blacklist",
        description: error.message,
        variant: "destructive",
      })
      setIsAddingToBlacklist(false)
    },
  })

  // Add Admin
  const { config: adminConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "addAdmin",
    args: [BigInt(jarId), adminAddress],
    enabled: Boolean(contractAddress && adminAddress),
  })

  const { write: addAdmin } = useContractWrite({
    ...adminConfig,
    onSuccess(data) {
      toast({
        title: "Transaction Submitted",
        description: "Adding admin. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Admin Added",
          description: `${adminAddress} has been added as an admin.`,
        })
        setAdminAddress("")
        setIsAddingAdmin(false)
        if (onActionSuccess) onActionSuccess()
      })
    },
    onError(error) {
      toast({
        title: "Error Adding Admin",
        description: error.message,
        variant: "destructive",
      })
      setIsAddingAdmin(false)
    },
  })

  const handleAddToWhitelist = () => {
    if (!whitelistAddress) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    setIsAddingToWhitelist(true)
    if (addToWhitelist) {
      addToWhitelist()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check the address and try again.",
        variant: "destructive",
      })
      setIsAddingToWhitelist(false)
    }
  }

  const handleAddToBlacklist = () => {
    if (!blacklistAddress) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    setIsAddingToBlacklist(true)
    if (addToBlacklist) {
      addToBlacklist()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check the address and try again.",
        variant: "destructive",
      })
      setIsAddingToBlacklist(false)
    }
  }

  const handleAddAdmin = () => {
    if (!adminAddress) {
      toast({
        title: "Error",
        description: "Please enter a valid Ethereum address",
        variant: "destructive",
      })
      return
    }

    setIsAddingAdmin(true)
    if (addAdmin) {
      addAdmin()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check the address and try again.",
        variant: "destructive",
      })
      setIsAddingAdmin(false)
    }
  }

  return (
    <Tabs defaultValue="whitelist">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
        <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
        <TabsTrigger value="admins">Admins</TabsTrigger>
      </TabsList>

      <TabsContent value="whitelist" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Whitelist Management</CardTitle>
            <CardDescription>Add or remove users from the whitelist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ethereum address"
                value={whitelistAddress}
                onChange={(e) => setWhitelistAddress(e.target.value)}
              />
              <Button onClick={handleAddToWhitelist} disabled={isAddingToWhitelist}>
                {isAddingToWhitelist ? "Adding..." : "Add"}
              </Button>
            </div>

            <WhitelistTable jarId={jarId} type="whitelist" onActionSuccess={onActionSuccess} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="blacklist" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Blacklist Management</CardTitle>
            <CardDescription>Add or remove users from the blacklist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ethereum address"
                value={blacklistAddress}
                onChange={(e) => setBlacklistAddress(e.target.value)}
              />
              <Button onClick={handleAddToBlacklist} disabled={isAddingToBlacklist}>
                {isAddingToBlacklist ? "Adding..." : "Add"}
              </Button>
            </div>

            <WhitelistTable jarId={jarId} type="blacklist" onActionSuccess={onActionSuccess} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="admins" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Management</CardTitle>
            <CardDescription>Add or remove admins for this jar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ethereum address"
                value={adminAddress}
                onChange={(e) => setAdminAddress(e.target.value)}
              />
              <Button onClick={handleAddAdmin} disabled={isAddingAdmin}>
                {isAddingAdmin ? "Adding..." : "Add"}
              </Button>
            </div>

            <WhitelistTable jarId={jarId} type="admin" onActionSuccess={onActionSuccess} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}