"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type Consultation = {
  _id: string
  studentName: string
  concern?: string
  scheduledAt: string
  status: "pending" | "ongoing" | "completed" | "cancelled"
}

export default function DoctorConsultantsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!token) return
      const res = await fetch(`${API_BASE}/api/doctor/consultations/current`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setConsultations(data.consultations || [])
    }
    run()
  }, [token])

  const markAsCompleted = async (consultationId: string) => {
    if (!token) return
    setBusyId(consultationId)

    try {
      const res = await fetch(`${API_BASE}/api/doctor/consultations/${consultationId}/complete`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setConsultations((prev) => prev.filter((item) => item._id !== consultationId))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-5xl">
        <Card className="border border-orange-100 p-5">
          <h1 className="text-2xl font-semibold">Current Consultations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pending and ongoing consultations.</p>

          <div className="mt-4 space-y-3">
            {consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No current consultations found.</p>
            ) : consultations.map((item) => {
              const canJoinNow = new Date(item.scheduledAt).getTime() <= Date.now()

              return (
              <div key={item._id} className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-neutral-800">{item.studentName}</p>
                  <span className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-xs font-semibold text-orange-600">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{item.concern || "General consultation"}</p>
                <p className="mt-1 text-xs text-neutral-500">{new Date(item.scheduledAt).toLocaleString()}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    disabled={!canJoinNow}
                    onClick={() => router.push(`/doctor/consult?consultationId=${item._id}`)}
                  >
                    {canJoinNow ? "Join Live" : "Join at Scheduled Time"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => markAsCompleted(item._id)}
                    disabled={busyId === item._id}
                  >
                    {busyId === item._id ? "Updating..." : "Mark Completed"}
                  </Button>
                </div>
              </div>
            )})}
          </div>
        </Card>
      </div>
    </main>
  )
}
