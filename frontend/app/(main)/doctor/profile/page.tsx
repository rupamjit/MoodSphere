"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type DoctorProfile = {
  name?: string
  email?: string
  phone?: string
  specialization?: string
  experience?: number
  consultationFee?: number
  city?: string
  qualifications?: string
  clinicAddress?: string
}

export default function DoctorProfilePage() {
  const router = useRouter()
  const { user, userType, token } = useAuth()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [draft, setDraft] = useState<DoctorProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace("/doctor/login")
      return
    }
    if (userType !== "doctor") {
      router.replace("/dashboard")
      return
    }

    const fetchProfile = async () => {
      if (!token) return
      const res = await fetch(`${API_BASE}/api/doctor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setProfile(data.doctor || null)
        setDraft(data.doctor || null)
      }
    }

    fetchProfile()
  }, [user, userType, token, router])

  const handleSave = async () => {
    if (!isEditing) return
    if (!token) return
    if (!draft) return
    setError(null)
    setSuccess(null)
    setSaving(true)
    const payload = {
      name: String(draft.name || ""),
      phone: String(draft.phone || ""),
      specialization: String(draft.specialization || ""),
      experience: Number(draft.experience || 0),
      consultationFee: Number(draft.consultationFee || 0),
      city: String(draft.city || ""),
      qualifications: String(draft.qualifications || ""),
      clinicAddress: String(draft.clinicAddress || ""),
    }

    try {
      const res = await fetch(`${API_BASE}/api/doctor/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "Update failed")
      setProfile(data.doctor || profile)
      setDraft(data.doctor || profile)
      setIsEditing(false)
      setSuccess("Profile updated successfully")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed")
    } finally {
      setSaving(false)
    }
  }

  const setDraftField = (key: keyof DoctorProfile, value: string | number) => {
    setDraft((prev) => ({ ...(prev || {}), [key]: value }))
  }

  const handleStartEdit = () => {
    setSuccess(null)
    setError(null)
    setDraft((prev) => prev || profile || {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      specialization: user?.specialization || "",
      experience: 0,
      consultationFee: 0,
      city: "",
      qualifications: "",
      clinicAddress: "",
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setError(null)
    setSuccess(null)
    setDraft(profile)
    setIsEditing(false)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-5xl">
        <Card className="border border-orange-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Doctor Profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">Update your doctor details based on your model fields.</p>
            </div>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={draft?.name || ""}
                  onChange={(e) => setDraftField("name", e.target.value)}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || user?.email || ""} disabled />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={draft?.phone || ""}
                  onChange={(e) => setDraftField("phone", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  value={draft?.specialization || ""}
                  onChange={(e) => setDraftField("specialization", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  value={draft?.experience ?? 0}
                  onChange={(e) => setDraftField("experience", Number(e.target.value || 0))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee</Label>
                <Input
                  id="consultationFee"
                  name="consultationFee"
                  type="number"
                  min="0"
                  value={draft?.consultationFee ?? 0}
                  onChange={(e) => setDraftField("consultationFee", Number(e.target.value || 0))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={draft?.city || ""}
                  onChange={(e) => setDraftField("city", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  name="qualifications"
                  value={draft?.qualifications || ""}
                  onChange={(e) => setDraftField("qualifications", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicAddress">Clinic Address</Label>
                <Input
                  id="clinicAddress"
                  name="clinicAddress"
                  value={draft?.clinicAddress || ""}
                  onChange={(e) => setDraftField("clinicAddress", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button type="button" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={saving}>Cancel</Button>
                </>
              ) : (
                <Button type="button" onClick={handleStartEdit}>Edit Profile</Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </main>
  )
}
