"use client"

import { useState } from "react"
import { useAccount, useNetwork } from "wagmi"
import { JarCard } from "@/components/jar-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useJars } from "@/hooks/use-jars"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function JarList() {
  const { address } = useAccount()
  const { chain } = useNetwork()
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "eligible" | "admin">("all")

  const { jars, isLoading } = useJars(chain?.id)

  const filteredJars = jars.filter((jar) => {
    // Search filter
    const matchesSearch =
      jar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jar.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Tab filter
    if (filter === "eligible") {
      return matchesSearch && jar.canWithdraw
    } else if (filter === "admin") {
      return matchesSearch && jar.isAdmin
    }

    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
      </div>
    )
  }

  if (jars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No jars found on this network.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jars..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="eligible">Eligible</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredJars.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No jars match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJars.map((jar) => (
            <JarCard key={jar.id} jar={jar} />
          ))}
        </div>
      )}
    </div>
  )
}

