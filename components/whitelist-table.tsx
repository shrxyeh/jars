"use client"

import { useState, useEffect } from "react"
import { useContractWrite, usePrepareContractWrite } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useJarDetails } from "@/hooks/use-jar-details"
import { Skeleton } from "@/components/ui/skeleton"

interface WhitelistTableProps {
  jarId: string
  type: "whitelist" | "blacklist" | "admin"
}

export function WhitelistTable({ jarId, type }: WhitelistTableProps) {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingAddress, setRemovingAddress] = useState<string | null>(null)

  const { jarDetails } = useJarDetails(jarId)
  const contractAddress = getContractAddress(jarDetails?.chainId)

  useEffect(() => {
    fetchAddresses()
  }, [jarId, type])

  const fetchAddresses = async () => {
    setIsLoading(true)
    try {
      // This would be an API call to fetch the addresses based on type
      // For demo purposes, we'll use mock data
      const result = await fetch(`/api/${type}?jarId=${jarId}`)
      if (!result.ok) throw new Error(`Failed to fetch ${type}`)
      const data = await result.json()
      setAddresses(data)
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      setAddresses([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get the correct function name based on type
  const getFunctionName = () => {
    switch (type) {
      case "whitelist":
        return "removeFromWhitelist"
      case "blacklist":
        return "removeFromBlacklist"
      case "admin":
        return "removeAdmin"
      default:
        return ""
    }
  }

  const { config: removeConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: getFunctionName(),
    args: [BigInt(jarId), removingAddress],
    enabled: Boolean(contractAddress && removingAddress),
  })

  const { write: removeAddress } = useContractWrite({
    ...removeConfig,
    onSuccess(data) {
      toast({
        title: "Transaction Submitted",
        description: `Removing address from ${type}. Please wait for confirmation.`,
      })

      data.wait().then(() => {
        toast({
          title: "Address Removed",
          description: `Address has been removed from the ${type}.`,
        })
        setRemovingAddress(null)
        fetchAddresses()
      })
    },
    onError(error) {
      toast({
        title: `Error Removing from ${type}`,
        description: error.message,
        variant: "destructive",
      })
      setRemovingAddress(null)
    },
  })

  const handleRemove = (address: string) => {
    setRemovingAddress(address)
    if (removeAddress) {
      removeAddress()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please try again.",
        variant: "destructive",
      })
      setRemovingAddress(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
      </div>
    )
  }

  if (addresses.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">No addresses in the {type}.</div>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Address</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {addresses.map((address) => (
          <TableRow key={address}>
            <TableCell className="font-medium">
              {address.substring(0, 6)}...{address.substring(38)}
            </TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(address)}
                disabled={removingAddress === address}
              >
                {removingAddress === address ? "Removing..." : "Remove"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

