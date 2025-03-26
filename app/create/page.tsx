import { CreateJarForm } from "@/components/create-jar-form"

export default function CreateJarPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create a New Jar</h1>
      <p className="text-muted-foreground">
        Set up a new jar with your preferred token, access controls, and withdrawal rules.
      </p>
      <CreateJarForm />
    </div>
  )
}

