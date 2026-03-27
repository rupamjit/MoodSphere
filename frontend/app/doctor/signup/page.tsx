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

export default function DoctorSignUpPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await signup(
        {
          name: String(formData.get("name") || ""),
          email: String(formData.get("email") || ""),
          phone: String(formData.get("phone") || ""),
          password: String(formData.get("password") || ""),
          specialization: String(formData.get("specialization") || ""),
          licenseNumber: String(formData.get("licenseNumber") || ""),
          experience: Number(formData.get("experience") || 0),
          consultationFee: Number(formData.get("consultationFee") || 0),
          city: String(formData.get("city") || ""),
        },
        "doctor"
      )
      router.push("/doctor/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-background grid min-h-screen grid-rows-[auto_1fr] px-4">
      <div className="mx-auto w-full max-w-7xl border-b py-3">
        <Logo withLink className="w-fit" />
      </div>

      <div className="m-auto w-full max-w-md py-10">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-medium text-foreground">Doctor Sign Up</h1>
          <p className="text-muted-foreground mt-2 text-sm">Create your professional profile on MoodSphere</p>
        </div>

        <Card className="mt-6 border border-border p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor-name">Full Name</Label>
                <Input id="doctor-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-phone">Phone</Label>
                <Input id="doctor-phone" name="phone" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Email</Label>
                <Input type="email" id="doctor-email" name="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-password">Password</Label>
                <Input type="password" id="doctor-password" name="password" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doctor-specialization">Specialization</Label>
                <Input id="doctor-specialization" name="specialization" placeholder="Psychologist" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-license">License Number</Label>
                <Input id="doctor-license" name="licenseNumber" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="doctor-experience">Experience</Label>
                <Input id="doctor-experience" name="experience" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-fee">Consultation Fee</Label>
                <Input id="doctor-fee" name="consultationFee" type="number" min="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-city">City</Label>
                <Input id="doctor-city" name="city" />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="h-11 w-full text-sm font-semibold">
              {submitting ? "Creating Account..." : "Create Doctor Account"}
            </Button>

            {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}
          </form>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already a doctor user?{" "}
          <Link href="/doctor/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
