"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type Doctor = {
  _id: string
  name: string
  specialization?: string
  experience?: number
  consultationFee?: number
  rating?: number
  city?: string
}

type CurrentConsultation = {
  _id: string
  concern?: string
  scheduledAt: string
  status: "pending" | "ongoing"
  doctorId: string | { _id: string; name?: string }
}

function extractDoctorId(doctorRef: CurrentConsultation["doctorId"]): string {
  return typeof doctorRef === "string" ? doctorRef : doctorRef?._id || ""
}

export default function ConsultantsPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [currentConsultations, setCurrentConsultations] = useState<CurrentConsultation[]>([])
  const [concerns, setConcerns] = useState<Record<string, string>>({})
  const [scheduledAt, setScheduledAt] = useState<Record<string, string>>({})
  const [busyDoctorId, setBusyDoctorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!token) return
      setLoading(true)
      setError(null)

      try {
        const [doctorRes, currentRes] = await Promise.all([
          fetch(`${API_BASE}/api/student/consultants`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/student/consultations/current`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const doctorData = await doctorRes.json().catch(() => ({}))
        const currentData = await currentRes.json().catch(() => ({}))

        if (!doctorRes.ok) {
          throw new Error(doctorData?.message || "Could not fetch doctors")
        }

        setDoctors(doctorData.doctors || [])
        if (currentRes.ok) {
          setCurrentConsultations(currentData.consultations || [])
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load consultants")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token])

  const activeByDoctorId = useMemo(() => {
    const map = new Map<string, CurrentConsultation>()
    currentConsultations.forEach((consultation) => {
      const id = extractDoctorId(consultation.doctorId)
      if (id) {
        map.set(id, consultation)
      }
    })
    return map
  }, [currentConsultations])

  const handleStartConsultation = async (doctorId: string) => {
    if (!token) return

    if (!scheduledAt[doctorId]) {
      setError("Please choose date and time before booking the meeting")
      return
    }

    setBusyDoctorId(doctorId)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/api/student/consultations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId,
          concern: concerns[doctorId] || "General consultation",
          scheduledAt: scheduledAt[doctorId],
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.consultation?._id) {
        throw new Error(data?.message || "Unable to start consultation")
      }

      router.push(`/consult?consultationId=${data.consultation._id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start consultation")
    } finally {
      setBusyDoctorId(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card className="border border-orange-100 p-5">
          <h1 className="text-2xl font-semibold">Consultants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a secure live consultation with a verified doctor.
          </p>
        </Card>

        {error ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
        ) : null}

        {loading ? (
          <Card className="border border-orange-100 p-5 text-sm text-muted-foreground">Loading doctors...</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {doctors.length === 0 ? (
              <Card className="border border-orange-100 p-5 text-sm text-muted-foreground">
                No consultants available right now.
              </Card>
            ) : (
              doctors.map((doctor) => {
                const activeConsultation = activeByDoctorId.get(doctor._id)
                const isBusy = busyDoctorId === doctor._id
                const canJoinNow = activeConsultation
                  ? new Date(activeConsultation.scheduledAt).getTime() <= Date.now()
                  : false

                return (
                  <Card key={doctor._id} className="border border-orange-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-neutral-800">Dr. {doctor.name}</h2>
                        <p className="mt-1 text-sm text-neutral-600">{doctor.specialization || "Mental Health Specialist"}</p>
                      </div>
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        {doctor.experience ? `${doctor.experience} yrs` : "Experienced"}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-600">
                      <div className="rounded-md border border-orange-100 bg-orange-50/40 px-2 py-1">
                        Fee: ₹{doctor.consultationFee ?? 0}
                      </div>
                      <div className="rounded-md border border-orange-100 bg-orange-50/40 px-2 py-1">
                        Rating: {doctor.rating?.toFixed(1) || "New"}
                      </div>
                      <div className="rounded-md border border-orange-100 bg-orange-50/40 px-2 py-1">
                        {doctor.city || "Online"}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Input
                        type="datetime-local"
                        value={scheduledAt[doctor._id] || ""}
                        onChange={(event) => {
                          const value = event.target.value
                          setScheduledAt((prev) => ({ ...prev, [doctor._id]: value }))
                        }}
                      />
                      <Input
                        placeholder="Concern (optional): anxiety, stress, sleep..."
                        value={concerns[doctor._id] || ""}
                        onChange={(event) => {
                          const value = event.target.value
                          setConcerns((prev) => ({ ...prev, [doctor._id]: value }))
                        }}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {activeConsultation ? (
                        <>
                          <Button
                            type="button"
                            disabled={!canJoinNow}
                            onClick={() => router.push(`/consult?consultationId=${activeConsultation._id}`)}
                          >
                            {canJoinNow ? "Join Live Call" : "Join at Scheduled Time"}
                          </Button>
                          <Badge variant="secondary">{activeConsultation.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activeConsultation.scheduledAt).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleStartConsultation(doctor._id)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Booking..." : "Book Meeting"}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </main>
  )
}
