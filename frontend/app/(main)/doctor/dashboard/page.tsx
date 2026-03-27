"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-context"

export default function DoctorDashboardPage() {
  const router = useRouter()
  const { user, userType } = useAuth()

  useEffect(() => {
    if (!user) {
      router.replace("/doctor/login")
      return
    }
    if (userType !== "doctor") {
      router.replace("/dashboard")
    }
  }, [user, userType, router])

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome, {user?.name}. Manage profile, consultations, and history from the sidebar.</p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {["Total Consultations", "Active Today", "Avg Rating", "Response Time"].map((title) => (
            <Card key={title} className="border border-orange-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{title}</p>
              <p className="mt-2 text-2xl font-bold text-neutral-800">--</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
