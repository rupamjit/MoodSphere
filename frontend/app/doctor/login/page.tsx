"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { Logo } from "@/components/logo"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DoctorLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)
    try {
      await login(
        {
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        },
        "doctor"
      )
      router.push("/doctor/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-background grid min-h-screen grid-rows-[auto_1fr] px-4">
      <div className="mx-auto w-full max-w-7xl border-b py-3">
        <Logo withLink className="w-fit" />
      </div>

      <div className="m-auto w-full max-w-sm py-10">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-medium text-foreground">Doctor Sign In</h1>
          <p className="text-muted-foreground mt-2 text-sm">Access your consultation and profile workspace</p>
        </div>

        <Card className="mt-6 border border-border p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label htmlFor="doctor-login-email">Email</Label>
              <Input type="email" id="doctor-login-email" name="email" placeholder="doctor@example.com" required />
            </div>

            <div className="space-y-3">
              <Label htmlFor="doctor-login-password">Password</Label>
              <Input type="password" id="doctor-login-password" name="password" required />
            </div>

            <Button type="submit" disabled={submitting} className="h-11 w-full text-sm font-semibold">
              {submitting ? "Signing In..." : "Sign In as Doctor"}
            </Button>

            {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
          </form>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          New doctor account?{" "}
          <Link href="/doctor/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </section>
  )
}
