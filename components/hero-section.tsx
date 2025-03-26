import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Create and Manage Token Jars</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          A decentralized platform for creating, funding, and claiming from token jars with customizable access controls
          and withdrawal rules.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/create">
            <Button size="lg">Create a Jar</Button>
          </Link>
          <Link href="#available-jars">
            <Button variant="outline" size="lg">
              Explore Jars
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

