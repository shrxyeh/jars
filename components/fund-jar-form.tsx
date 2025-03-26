"use client"

import { useState } from "react"
import { useContractWrite, usePrepareContractWrite } from "wagmi"
import { parseEther } from "viem"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { isNativeToken } from "@/lib/tokens"
import type { Jar } from "@/types/jar"

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
})

interface FundJarFormProps {
  jar: Jar
  onFundSuccess?: () => void
}

export function FundJarForm({ jar, onFundSuccess }: FundJarFormProps) {
  const { toast } = useToast()
  const [isFunding, setIsFunding] = useState(false)
  const contractAddress = getContractAddress(jar.chainId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  const watchedAmount = form.watch("amount")
  const isNative = isNativeToken(jar.tokenAddress)

  // Prepare the transaction
  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "fundJar",
    args: [BigInt(jar.id), parseEther(watchedAmount || "0")],
    value: isNative ? parseEther(watchedAmount || "0") : BigInt(0),
    enabled: Boolean(
      contractAddress && 
      watchedAmount && 
      parseFloat(watchedAmount) > 0
    ),
  })

  // Execute the transaction
  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      toast({
        title: "Funding Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Jar Funded Successfully",
          description: `You've successfully added ${watchedAmount} ${jar.tokenSymbol} to the jar.`,
        })
        form.reset()
        setIsFunding(false)
        if (onFundSuccess) onFundSuccess()
      })
    },
    onError(error) {
      toast({
        title: "Error Funding Jar",
        description: error.message,
        variant: "destructive",
      })
      setIsFunding(false)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsFunding(true)
    if (write) {
      write()
    } else {
      toast({
        title: "Error",
        description: "Unable to submit transaction. Please check your inputs and try again.",
        variant: "destructive",
      })
      setIsFunding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund This Jar</CardTitle>
        <CardDescription>Add more {jar.tokenSymbol} to support this jar</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Fund</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.000001" min="0" placeholder="0.0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the amount of {jar.tokenSymbol} you want to add to this jar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isFunding} className="w-full">
              {isFunding ? "Processing..." : `Fund with ${jar.tokenSymbol}`}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}