"use client"

import { useState } from "react"
import { useContractWrite, usePrepareContractWrite } from "wagmi"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Jar } from "@/types/jar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { parseEther } from "viem"
import { WhitelistManager } from "@/components/whitelist-manager"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AdminPanelProps {
  jarId: string
  jar: Jar
}

const updateJarSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  maxWithdrawalAmount: z.string(),
  cooldownPeriod: z.string(),
})

const emergencyWithdrawSchema = z.object({
  recipient: z.string().min(42, "Please enter a valid Ethereum address"),
})

export function AdminPanel({ jarId, jar }: AdminPanelProps) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const contractAddress = getContractAddress(jar.chainId)

  const updateForm = useForm<z.infer<typeof updateJarSchema>>({
    resolver: zodResolver(updateJarSchema),
    defaultValues: {
      title: jar.title,
      description: jar.description,
      maxWithdrawalAmount: jar.maxWithdrawalAmount ? parseEther(jar.maxWithdrawalAmount).toString() : "",
      cooldownPeriod: (jar.cooldownPeriod / 60).toString(), // Convert seconds to minutes
    },
  })

  const emergencyForm = useForm<z.infer<typeof emergencyWithdrawSchema>>({
    resolver: zodResolver(emergencyWithdrawSchema),
    defaultValues: {
      recipient: "",
    },
  })

  // Update Jar Parameters
  const { config: updateConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "updateJarParameters",
    args: [
      BigInt(jarId),
      updateForm.watch("title"),
      updateForm.watch("description"),
      parseEther(updateForm.watch("maxWithdrawalAmount") || "0"),
      BigInt(Number.parseInt(updateForm.watch("cooldownPeriod") || "0") * 60), // Convert minutes to seconds
    ],
    enabled: Boolean(contractAddress && updateForm.watch("title") && updateForm.watch("description")),
  })

  const { write: updateJar } = useContractWrite({
    ...updateConfig,
    onSuccess(data) {
      toast({
        title: "Update Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Jar Updated Successfully",
          description: "The jar parameters have been updated.",
        })
        setIsUpdating(false)
      })
    },
    onError(error) {
      toast({
        title: "Error Updating Jar",
        description: error.message,
        variant: "destructive",
      })
      setIsUpdating(false)
    },
  })

  // Emergency Withdraw
  const { config: emergencyConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "emergencyWithdraw",
    args: [BigInt(jarId), emergencyForm.watch("recipient")],
    enabled: Boolean(contractAddress && emergencyForm.watch("recipient")),
  })

  const { write: emergencyWithdraw } = useContractWrite({
    ...emergencyConfig,
    onSuccess(data) {
      toast({
        title: "Emergency Withdrawal Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Emergency Withdrawal Successful",
          description: "All funds have been withdrawn from the jar.",
        })
        setIsEmergencyWithdrawing(false)
      })
    },
    onError(error) {
      toast({
        title: "Error Withdrawing Funds",
        description: error.message,
        variant: "destructive",
      })
      setIsEmergencyWithdrawing(false)
    },
  })

  // Delete Jar
  const { config: deleteConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "deleteJar",
    args: [BigInt(jarId)],
    enabled: Boolean(contractAddress),
  })

  const { write: deleteJar } = useContractWrite({
    ...deleteConfig,
    onSuccess(data) {
      toast({
        title: "Deletion Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Jar Deleted Successfully",
          description: "The jar has been deleted.",
        })
        setIsDeleting(false)
      })
    },
    onError(error) {
      toast({
        title: "Error Deleting Jar",
        description: error.message,
        variant: "destructive",
      })
      setIsDeleting(false)
    },
  })

  function onUpdateSubmit(values: z.infer<typeof updateJarSchema>) {
    setIsUpdating(true)
    if (updateJar) {
      updateJar()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check your inputs and try again.",
        variant: "destructive",
      })
      setIsUpdating(false)
    }
  }

  function onEmergencyWithdrawSubmit(values: z.infer<typeof emergencyWithdrawSchema>) {
    setIsEmergencyWithdrawing(true)
    if (emergencyWithdraw) {
      emergencyWithdraw()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check your inputs and try again.",
        variant: "destructive",
      })
      setIsEmergencyWithdrawing(false)
    }
  }

  function handleDeleteJar() {
    setIsDeleting(true)
    if (deleteJar) {
      deleteJar()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <Tabs defaultValue="settings">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="whitelist">Access Control</TabsTrigger>
        <TabsTrigger value="danger">Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Jar Settings</CardTitle>
            <CardDescription>Update the jar's parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...updateForm}>
              <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                <FormField
                  control={updateForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jar Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="maxWithdrawalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Withdrawal Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.000001" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty for no limit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={updateForm.control}
                  name="cooldownPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cooldown Period (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Time users must wait between withdrawals (0 for no cooldown)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Jar"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="whitelist" className="space-y-4 py-4">
        <WhitelistManager jarId={jarId} />
      </TabsContent>

      <TabsContent value="danger" className="space-y-4 py-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Emergency Withdrawal</CardTitle>
            <CardDescription>Withdraw all funds from the jar to a specified address</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emergencyForm}>
              <form onSubmit={emergencyForm.handleSubmit(onEmergencyWithdrawSubmit)} className="space-y-4">
                <FormField
                  control={emergencyForm.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormDescription>Address to receive all funds from the jar</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" variant="destructive" disabled={isEmergencyWithdrawing}>
                  {isEmergencyWithdrawing ? "Processing..." : "Emergency Withdraw"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Jar</CardTitle>
            <CardDescription>Permanently deactivate this jar. This action cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Jar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The jar will be permanently deactivated and users will no longer be
                    able to withdraw funds.
                    <br />
                    <br />
                    Make sure to withdraw all funds before deleting the jar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteJar} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete Jar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

