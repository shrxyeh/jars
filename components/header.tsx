"use client"

import { ConnectKitButton } from "connectkit"
import Link from "next/link"
import { NetworkSelector } from "@/components/network-selector"
import { ModeToggle } from "@/components/mode-toggle"
import { BarcodeIcon as Jar } from "lucide-react"

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Jar className="h-6 w-6" />
          <span className="font-bold">Jar System</span>
        </Link>
        <div className="flex items-center space-x-4">
          <NetworkSelector />
          <ModeToggle />
          <ConnectKitButton />
        </div>
      </div>
    </header>
  )
}

