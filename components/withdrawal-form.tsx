"use client"

import { useState } from "react"
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi"
import { parseEther, formatEther } from "viem"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { JarSystemABI } from "@/lib/abis"
import { getContractAddress } from "@/lib/contracts"
import { useJarDetails } from "@/hooks/use-jar-details"
import { useCanWithdraw } from "@/hooks/use-can-withdraw"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
})

interface WithdrawalFormProps {
  jarId: string
  maxAmount?: string
  onWithdrawSuccess?: () => void
}

export function WithdrawalForm({ jarId, maxAmount, onWithdrawSuccess }: WithdrawalFormProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { jarDetails, isLoading: isLoadingJar } = useJarDetails(jarId)
  const { canWithdraw, isLoading: isLoadingWithdraw } = useCanWithdraw(jarId, address)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      reason: "",
    },
  })

  const contractAddress = getContractAddress(jarDetails?.chainId)
  const maxWithdrawalAmount = maxAmount || jarDetails?.maxWithdrawalAmount || jarDetails?.balance
  const maxWithdrawalEther = maxWithdrawalAmount ? formatEther(BigInt(maxWithdrawalAmount)) : "0"

  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: JarSystemABI,
    functionName: "withdraw",
    args: [BigInt(jarId), parseEther(form.watch("amount") || "0"), form.watch("reason")],
    enabled: Boolean(address && contractAddress && form.watch("amount") && form.watch("reason") && canWithdraw),
  })

  const { write } = useContractWrite({
    ...config,
    onSuccess(data) {
      toast({
        title: "Withdrawal Initiated",
        description: "Your transaction has been submitted. Please wait for confirmation.",
      })

      data.wait().then(() => {
        toast({
          title: "Withdrawal Successful",
          description: "Your funds have been withdrawn successfully.",
        })
        form.reset()
        setIsSubmitting(false)
        
        // Call success callback if provided
        if (onWithdrawSuccess) {
          onWithdrawSuccess()
        }
      })
    },
    onError(error) {
      toast({
        title: "Error Withdrawing Funds",
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

  if (isLoadingJar || isLoadingWithdraw) {
    return <div className="text-center py-8">Loading withdrawal form...</div>
  }

  if (!canWithdraw) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Withdrawal Not Available</AlertTitle>
        <AlertDescription>
          You are not eligible to withdraw from this jar. This could be due to access controls or cooldown period.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Amount</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input type="number" step="0.000001" min="0" max={maxWithdrawalEther} {...field} />
                      <Slider
                        value={[Number.parseFloat(field.value || "0")]}
                        max={Number.parseFloat(maxWithdrawalEther)}
                        step={0.01}
                        onValueChange={(value) => field.onChange(value[0].toString())}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum withdrawal: {maxWithdrawalEther} {jarDetails?.tokenSymbol || "ETH"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Withdrawal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain why you're withdrawing these funds" {...field} />
                  </FormControl>
                  <FormDescription>Minimum 3 characters required</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Processing Withdrawal..." : "Withdraw Funds"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}