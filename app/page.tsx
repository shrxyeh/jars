import { JarList } from "@/components/jar-list"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/hero-section"
import Link from "next/link"

export default function Home() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Available Jars</h2>
          <Link href="/create">
            <Button>Create New Jar</Button>
          </Link>
        </div>
        <JarList />
      </section>
    </div>
  )
}

