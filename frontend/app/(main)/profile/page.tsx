"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Building2,
  CalendarClock,
  GraduationCap,
  Mail,
  Phone,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-context"

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type Contact = {
  name?: string
  phone?: string
  email?: string
}

type ProfileView = {
  basicInfo: {
    name: string
    email: string
    phone: string
    age: string
    gender: string
    profileImage: string
  }
  academicInfo: {
    university: string
    rollNumber: string
    className: string
    section: string
  }
  mentalHealth: {
    currentMood: string
    moodScore: number
    riskLevel: "low" | "medium" | "high"
  }
  stats: {
    totalSessions: number
    lastActive: string
  }
  contacts: {
    parent: Contact
    mentor: Contact
  }
  moodHistory: Array<{ label: string; score: number }>
}

type ProfileForm = {
  name: string
  email: string
  phone: string
  age: string
  gender: string
  profileImage: string
  university: string
  rollNumber: string
  className: string
  section: string
  parentName: string
  parentPhone: string
  parentEmail: string
  mentorName: string
  mentorPhone: string
  mentorEmail: string
}

function toDisplayDate(value: string) {
  if (!value) return "Not available"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function normalizeHistory(
  raw: Array<{ finalScore?: number; score?: number; date?: string }> | undefined
) {
  const entries = (raw || []).slice(-7)
  if (!entries.length) {
    return [
      { label: "Mon", score: 0 },
      { label: "Tue", score: 0 },
      { label: "Wed", score: 0 },
      { label: "Thu", score: 0 },
      { label: "Fri", score: 0 },
      { label: "Sat", score: 0 },
      { label: "Sun", score: 0 },
    ]
  }

  return entries.map((entry, idx) => {
    const date = entry.date ? new Date(entry.date) : null
    const label = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { weekday: "short" })
      : `D${idx + 1}`
    const rawScore =
      typeof entry.finalScore === "number"
        ? entry.finalScore
        : typeof entry.score === "number"
        ? entry.score
        : 0
    const baseScore = rawScore > 0 && rawScore <= 1 ? rawScore * 100 : rawScore

    return {
      label,
      score: Math.max(0, Math.min(100, Math.round(baseScore))),
    }
  })
}

function createFallbackProfile(user: { name?: string; email?: string; phone?: string } | null): ProfileView {
  return {
    basicInfo: {
      name: user?.name || "Student",
      email: user?.email || "Not available",
      phone: user?.phone || "Not available",
      age: "Not added",
      gender: "Not added",
      profileImage: "",
    },
    academicInfo: {
      university: "Not added",
      rollNumber: "Not added",
      className: "Not added",
      section: "Not added",
    },
    mentalHealth: {
      currentMood: "neutral",
      moodScore: 0,
      riskLevel: "low",
    },
    stats: {
      totalSessions: 0,
      lastActive: "Not available",
    },
    contacts: {
      parent: {},
      mentor: {},
    },
    moodHistory: normalizeHistory(undefined),
  }
}

function toForm(profile: ProfileView): ProfileForm {
  return {
    name: profile.basicInfo.name,
    email: profile.basicInfo.email,
    phone: profile.basicInfo.phone,
    age: profile.basicInfo.age,
    gender: profile.basicInfo.gender,
    profileImage: profile.basicInfo.profileImage,
    university: profile.academicInfo.university,
    rollNumber: profile.academicInfo.rollNumber,
    className: profile.academicInfo.className,
    section: profile.academicInfo.section,
    parentName: profile.contacts.parent.name || "",
    parentPhone: profile.contacts.parent.phone || "",
    parentEmail: profile.contacts.parent.email || "",
    mentorName: profile.contacts.mentor.name || "",
    mentorPhone: profile.contacts.mentor.phone || "",
    mentorEmail: profile.contacts.mentor.email || "",
  }
}

function normalizeProfileResponse(
  raw: unknown,
  fallbackUser: { name?: string; email?: string; phone?: string } | null
): ProfileView {
  const fallback = createFallbackProfile(fallbackUser)
  if (!raw) return fallback

  const source = raw as {
    basicInfo?: {
      name?: string
      email?: string
      phone?: string
      age?: number | string | null
      gender?: string
      profileImage?: string
    }
    academicInfo?: {
      university?: string
      rollNumber?: string
      className?: string
      section?: string
    }
    mentalHealth?: {
      currentMood?: string
      moodScore?: number
      riskLevel?: "low" | "medium" | "high"
    }
    stats?: {
      totalSessions?: number
      lastActive?: string
    }
    contacts?: {
      parent?: Contact
      mentor?: Contact
    }
    moodHistory?: Array<{ finalScore?: number; score?: number; date?: string }>
  }

  const rawMoodScore = Number(source.mentalHealth?.moodScore ?? fallback.mentalHealth.moodScore)
  const normalizedMoodScore = rawMoodScore > 0 && rawMoodScore <= 1 ? rawMoodScore * 100 : rawMoodScore

  return {
    basicInfo: {
      name: source.basicInfo?.name || fallback.basicInfo.name,
      email: source.basicInfo?.email || fallback.basicInfo.email,
      phone: source.basicInfo?.phone || fallback.basicInfo.phone,
      age: source.basicInfo?.age != null ? String(source.basicInfo.age) : fallback.basicInfo.age,
      gender: source.basicInfo?.gender || fallback.basicInfo.gender,
      profileImage: source.basicInfo?.profileImage || "",
    },
    academicInfo: {
      university: source.academicInfo?.university || fallback.academicInfo.university,
      rollNumber: source.academicInfo?.rollNumber || fallback.academicInfo.rollNumber,
      className: source.academicInfo?.className || fallback.academicInfo.className,
      section: source.academicInfo?.section || fallback.academicInfo.section,
    },
    mentalHealth: {
      currentMood: source.mentalHealth?.currentMood || fallback.mentalHealth.currentMood,
      moodScore: Math.max(0, Math.min(100, Math.round(normalizedMoodScore))),
      riskLevel: source.mentalHealth?.riskLevel || fallback.mentalHealth.riskLevel,
    },
    stats: {
      totalSessions: Number(source.stats?.totalSessions ?? fallback.stats.totalSessions),
      lastActive: toDisplayDate(source.stats?.lastActive || ""),
    },
    contacts: {
      parent: {
        name: source.contacts?.parent?.name || "",
        phone: source.contacts?.parent?.phone || "",
        email: source.contacts?.parent?.email || "",
      },
      mentor: {
        name: source.contacts?.mentor?.name || "",
        phone: source.contacts?.mentor?.phone || "",
        email: source.contacts?.mentor?.email || "",
      },
    },
    moodHistory: normalizeHistory(source.moodHistory),
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchProfile = useCallback(async () => {
    if (!token) return

    setProfileLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_BASE}/api/student/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.msg || data?.message || "Failed to load profile")
      }

      const normalized = normalizeProfileResponse(data, user)
      setProfile(normalized)
      setForm(toForm(normalized))
    } catch (err) {
      const fallback = createFallbackProfile(user)
      setProfile(fallback)
      setForm(toForm(fallback))
      setError(err instanceof Error ? err.message : "Unable to load profile right now")
    } finally {
      setProfileLoading(false)
    }
  }, [token, user])

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!loading && user && token) {
      void fetchProfile()
    }
  }, [loading, user, token, fetchProfile])

  if (loading || !user || profileLoading || !profile || !form) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </main>
    )
  }

  const initials = profile.basicInfo.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"

  const avgMood = Math.round(
    profile.moodHistory.reduce((sum, point) => sum + point.score, 0) / profile.moodHistory.length
  )
  const moodDelta = profile.moodHistory[profile.moodHistory.length - 1].score - profile.moodHistory[0].score
  const peak = profile.moodHistory.reduce(
    (best, point) => (point.score > best.score ? point : best),
    profile.moodHistory[0]
  )
  const moodScoreLabel = `${profile.mentalHealth.moodScore} / 100`

  const onChange = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const saveProfile = async () => {
    if (!token) return

    setSaving(true)
    setError("")

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        age: form.age.trim() ? Number(form.age) : null,
        gender: form.gender,
        ProfileImage: form.profileImage,
        university: form.university,
        rollNumber: form.rollNumber,
        className: form.className,
        section: form.section,
        parentContact: {
          name: form.parentName,
          phone: form.parentPhone,
          email: form.parentEmail,
        },
        mentorContact: {
          name: form.mentorName,
          phone: form.mentorPhone,
          email: form.mentorEmail,
        },
      }

      const response = await fetch(`${API_BASE}/api/student/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to update profile")
      }

      await fetchProfile()
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile right now")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-white to-orange-50/25 px-4 py-7 md:px-6 md:py-9">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[310px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="border-orange-100/70 bg-white/95 shadow-sm">
            <CardContent className="px-5 py-6">
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 text-2xl font-semibold text-white shadow-sm">
                {initials}
              </div>
              <h2 className="text-center font-heading text-xl font-semibold text-foreground">{profile.basicInfo.name}</h2>
              <p className="mt-1 text-center text-xs text-muted-foreground">{profile.basicInfo.email}</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Student profile</Badge>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge>
              </div>

              <div className="mt-5 rounded-xl border border-border/70 bg-background/80 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quick snapshot</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-foreground"><Activity className="size-3.5 text-orange-500" />Mood score: {moodScoreLabel}</p>
                  <p className="flex items-center gap-2 text-foreground"><ShieldAlert className="size-3.5 text-orange-500" />Risk: {profile.mentalHealth.riskLevel}</p>
                  <p className="flex items-center gap-2 text-foreground"><CalendarClock className="size-3.5 text-orange-500" />Last active: {profile.stats.lastActive}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(toForm(profile))
                      setIsEditing(false)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button className="mt-4 w-full" onClick={() => setIsEditing(true)}>
                  Edit profile
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-100/70 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Mood history</CardTitle>
              <CardDescription>Last 7 checkpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-orange-100/70 bg-linear-to-b from-orange-50/40 to-white p-3.5">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">7-day average</span>
                  <span className="font-semibold text-foreground">{avgMood}/100</span>
                </div>

                <div className="relative rounded-xl border border-orange-100/80 bg-white/85 px-2 pb-2 pt-6">
                  <div className="pointer-events-none absolute inset-x-2 top-6 grid grid-rows-3 gap-7">
                    <div className="border-t border-dashed border-orange-100" />
                    <div className="border-t border-dashed border-orange-100" />
                    <div className="border-t border-dashed border-orange-100" />
                  </div>

                  <div className="relative z-10 grid grid-cols-7 items-end gap-2">
                    {profile.moodHistory.map((point) => (
                      <div key={point.label} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-neutral-500">{point.score}</span>
                        <div className="flex h-28 w-7 items-end rounded-full border border-orange-100 bg-orange-50/70 p-0.5">
                          <div
                            className="w-full rounded-full bg-linear-to-t from-orange-500 to-amber-300"
                            style={{ height: `${Math.max(12, point.score)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{point.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Peak: {peak.label} ({peak.score})</span>
                  <span className={moodDelta >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
                    {moodDelta >= 0 ? "+" : ""}{moodDelta} this week
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}

          <Card className="border-orange-100/70 bg-white/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="size-4 text-orange-500" />
                Basic info
              </CardTitle>
              <CardDescription>Name and personal details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <InfoCell label="Name" value={form.name} editable={isEditing} onChange={(v) => onChange("name", v)} icon={<UserRound className="size-3.5 text-orange-500" />} />
              <InfoCell label="Email" value={form.email} editable={isEditing} onChange={(v) => onChange("email", v)} icon={<Mail className="size-3.5 text-orange-500" />} />
              <InfoCell label="Phone" value={form.phone} editable={isEditing} onChange={(v) => onChange("phone", v)} icon={<Phone className="size-3.5 text-orange-500" />} />
              <InfoCell label="Age" value={form.age} editable={isEditing} onChange={(v) => onChange("age", v)} />
              <InfoCell label="Gender" value={form.gender} editable={isEditing} onChange={(v) => onChange("gender", v)} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-orange-100/70 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="size-4 text-orange-500" />
                  Academic info
                </CardTitle>
                <CardDescription>Campus identity and class mapping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="University" value={form.university} editable={isEditing} onChange={(v) => onChange("university", v)} />
                <InfoRow label="Roll number" value={form.rollNumber} editable={isEditing} onChange={(v) => onChange("rollNumber", v)} />
                <InfoRow label="Class" value={form.className} editable={isEditing} onChange={(v) => onChange("className", v)} />
                <InfoRow label="Section" value={form.section} editable={isEditing} onChange={(v) => onChange("section", v)} />
              </CardContent>
            </Card>

            <Card className="border-orange-100/70 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-4 text-orange-500" />
                  Mental health
                </CardTitle>
                <CardDescription>Latest emotional indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Current mood" value={profile.mentalHealth.currentMood} />
                <InfoRow label="Mood score" value={moodScoreLabel} />
                <InfoRow label="Risk level" value={profile.mentalHealth.riskLevel} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-orange-100/70 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="size-4 text-orange-500" />
                  Session stats
                </CardTitle>
                <CardDescription>Platform activity summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Total sessions" value={String(profile.stats.totalSessions)} />
                <InfoRow label="Last active" value={profile.stats.lastActive} />
              </CardContent>
            </Card>

            <Card className="border-orange-100/70 bg-white/95 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="size-4 text-orange-500" />
                  Support contacts
                </CardTitle>
                <CardDescription>Emergency and mentorship contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Parent name" value={form.parentName} editable={isEditing} onChange={(v) => onChange("parentName", v)} />
                <InfoRow label="Parent phone" value={form.parentPhone} editable={isEditing} onChange={(v) => onChange("parentPhone", v)} />
                <InfoRow label="Parent email" value={form.parentEmail} editable={isEditing} onChange={(v) => onChange("parentEmail", v)} />
                <InfoRow label="Mentor name" value={form.mentorName} editable={isEditing} onChange={(v) => onChange("mentorName", v)} />
                <InfoRow label="Mentor phone" value={form.mentorPhone} editable={isEditing} onChange={(v) => onChange("mentorPhone", v)} />
                <InfoRow label="Mentor email" value={form.mentorEmail} editable={isEditing} onChange={(v) => onChange("mentorEmail", v)} />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCell({
  label,
  value,
  icon,
  editable = false,
  onChange,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  editable?: boolean
  onChange?: (value: string) => void
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/80 p-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {editable ? (
        <Input value={value} onChange={(e) => onChange?.(e.target.value)} className="h-8" />
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-foreground wrap-break-word">
          {icon}
          {value || "Not added"}
        </p>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  editable = false,
  onChange,
}: {
  label: string
  value: string
  editable?: boolean
  onChange?: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {editable ? (
        <Input value={value} onChange={(e) => onChange?.(e.target.value)} className="h-8 max-w-48" />
      ) : (
        <span className="font-medium text-foreground">{value || "Not added"}</span>
      )}
    </div>
  )
}
