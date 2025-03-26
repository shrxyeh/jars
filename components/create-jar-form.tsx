"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useNetwork, useContractWrite, usePrepareContractWrite } from "wagmi"
import { parseEther } from "viem"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  tokenAddress: z.string().default("0x0000000000000000000000000000000000000000"),
  initialFunding: z.string().min(1, "Initial funding is required"),
  maxWithdrawalAmount: z.string().optional(),
  cooldownPeriod: z.string().default("0"),
  accessControlType: z.enum(["0", "1", "2", "3"]),
  gatingTokenAddress: z.string().optional(),
  gatingTokenAmount: z.string().optional(),
  payCreationFee: z.boolean().default(true),
})

export function CreateJarForm() {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tokenAddress: "0x0000000000000000000000000000000000000000",
      initialFunding: "",
      maxWithdrawalAmount: "",
      cooldownPeriod: "0",
      accessControlType: "0",
      gatingTokenAddress: "",
      gatingTokenAmount: "",
      payCreationFee: true,
    },
  })

  const contractAddress = getContractAddress(chain?.id)

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "createJar",
    args: [
      form.watch("title"),
      form.watch("description"),
      form.watch("tokenAddress"),
      parseEther(form.watch("initialFunding") || "0"),
      parseEther(form.watch("maxWithdrawalAmount") || "0"),
      BigInt(Number.parseInt(form.watch("cooldownPeriod") || "0") * 60), // Convert minutes to seconds
      Number.parseInt(form.watch("accessControlType")),
      form.watch("gatingTokenAddress") || "0x0000000000000000000000000000000000000000",
      parseEther(form.watch("gatingTokenAmount") || "0"),
      form.watch("payCreationFee"),
    ],
    value:
      form.watch("tokenAddress") === "0x0000000000000000000000000000000000000000"
        ? parseEther(form.watch("initialFunding") || "0")
        : BigInt(0),
    enabled: Boolean(
      address && contractAddress && form.watch("title") && form.watch("description") && form.watch("initialFunding"),
    ),
  })

  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      toast({
        title: "Jar Creation Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Jar Created Successfully",
          description: "Your jar has been created and is now available.",
        })
        router.push("/")
      })
    },
    onError(error) {
      toast({
        title: "Error Creating Jar",
        description: error.message,
        variant: "destructive",
      })
      setIsSubmitting(false)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    if (write) {
      write()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check your inputs and try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const accessControlType = form.watch("accessControlType")
  const showGatingFields = accessControlType === "2" || accessControlType === "3"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jar Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Team Treasury" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Funds for team expenses and operations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Funding</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0x0000000000000000000000000000000000000000">ETH</SelectItem>
                        {/* Add other token options here */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialFunding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Funding Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Amount of tokens to initially deposit in the jar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payCreationFee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pay Creation Fee</FormLabel>
                      <FormDescription>Donate 1% of initial funding to the Jar System team</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Withdrawal Rules</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Access Controls</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="accessControlType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Control Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access control" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Open (Anyone can withdraw)</SelectItem>
                        <SelectItem value="1">Whitelist</SelectItem>
                        <SelectItem value="2">ERC20 Token Gated</SelectItem>
                        <SelectItem value="3">NFT Gated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showGatingFields && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="gatingTokenAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{accessControlType === "2" ? "ERC20 Token Address" : "NFT Address"}</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {accessControlType === "2" && (
                    <FormField
                      control={form.control}
                      name="gatingTokenAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Token Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.000001" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Minimum amount of tokens required to withdraw</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating Jar..." : "Create Jar"}
        </Button>
      </form>
    </Form>
  )
}

