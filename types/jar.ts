export type AccessControlType = "Open" | "Whitelist" | "ERC20Gated" | "NFTGated"

export interface Jar {
  id: string
  title: string
  description: string
  creator: string
  tokenAddress: string
  balance: string
  maxWithdrawalAmount: string
  cooldownPeriod: number
  isActive: boolean
  accessControlType: AccessControlType
  chainId: number
  tokenSymbol: string
  canWithdraw: boolean
  isAdmin: boolean
}

