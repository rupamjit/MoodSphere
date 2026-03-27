"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-context"
import { Card } from "@/components/ui/card"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type Consultation = {
  _id: string
  studentName: string
  concern?: string
  scheduledAt: string
  completedAt?: string
  status: "completed"
}

export default function DoctorHistoryPage() {
  const { token } = useAuth()
  const [consultations, setConsultations] = useState<Consultation[]>([])

  useEffect(() => {
    const run = async () => {
      if (!token) return
      const res = await fetch(`${API_BASE}/api/doctor/consultations/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setConsultations(data.consultations || [])
    }
    run()
  }, [token])

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-5xl">
        <Card className="border border-orange-100 p-5">
          <h1 className="text-2xl font-semibold">Completed Consultation History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Finished consultations are listed here.</p>

          <div className="mt-4 space-y-3">
            {consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed consultations found.</p>
            ) : consultations.map((item) => (
              <div key={item._id} className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-neutral-800">{item.studentName}</p>
                  <span className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-semibold text-emerald-600">completed</span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{item.concern || "General consultation"}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Scheduled: {new Date(item.scheduledAt).toLocaleString()}
                  {item.completedAt ? ` • Completed: ${new Date(item.completedAt).toLocaleString()}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
