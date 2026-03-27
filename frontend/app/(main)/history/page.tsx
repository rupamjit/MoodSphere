"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  MessageCircle,
  Search,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"
const PAGE_SIZE = 5

const C = {
  orange: "#F97316",
  orangeDeep: "#EA580C",
  orangeLight: "#FED7AA",
  orangeTint: "#FFF7ED",
  violet: "#8B5CF6",
  violetLight: "#EDE9FE",
  emerald: "#10B981",
  emeraldLight: "#D1FAE5",
  sky: "#0EA5E9",
  skyLight: "#E0F2FE",
  rose: "#F43F5E",
  roseLight: "#FFE4E6",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  text: "#0F172A",
  textMuted: "#64748B",
  textSoft: "#94A3B8",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFC",
  bg: "#F1F5F9",
}

type SessionHistoryItem = {
  id: string
  startedAt?: string
  endedAt?: string
  status: "active" | "completed"
  finalMood: string
  finalScore: number
  riskLevel: "low" | "medium" | "high"
  durationMinutes: number
  messagesCount: number
  averageTextScore?: number
  averageVoiceScore?: number
  averageFaceScore?: number
  lastStudentMessage?: string
  lastAiResponse?: string
}

type ConsultationHistoryItem = {
  _id: string
  concern?: string
  scheduledAt: string
  completedAt?: string
  status: "pending" | "ongoing" | "completed" | "cancelled"
  doctorId?: {
    name?: string
    specialization?: string
    city?: string
  }
}

const displayDate = (value?: string) => {
  if (!value) return "-"
  const dt = new Date(value)
  return Number.isNaN(dt.getTime()) ? value : dt.toLocaleString()
}

const normalizeToPercent = (value: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  if (parsed >= 0 && parsed <= 100) return Math.round(parsed)
  return Math.max(0, Math.min(100, Math.round((parsed + 1) * 50)))
}

const formatShortDate = (value?: string) => {
  if (!value) return "Unknown"
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const formatTime = (value?: string) => {
  if (!value) return ""
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return ""
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Low Risk", color: C.emerald, bg: C.emeraldLight },
    medium: { label: "Moderate", color: C.amber, bg: C.amberLight },
    high: { label: "High Risk", color: C.rose, bg: C.roseLight },
  }
  const r = map[risk] ?? map.low
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: r.bg, padding: "2px 8px", borderRadius: 999 }}>
      {r.label}
    </span>
  )
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const safe = Math.max(0, Math.min(100, score))
  const dash = (safe / 100) * circ
  return (
    <svg width={44} height={44} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={22} cy={22} r={r} fill="none" stroke={C.border} strokeWidth={4} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const { token, userType } = useAuth()

  const [sessions, setSessions] = useState<SessionHistoryItem[]>([])
  const [consultations, setConsultations] = useState<ConsultationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"checkins" | "conversations" | "sessions">("checkins")
  const [expandedCheckIn, setExpandedCheckIn] = useState<string | null>(null)
  const [expandedConv, setExpandedConv] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterRisk, setFilterRisk] = useState<string>("all")

  const [checkinsPage, setCheckinsPage] = useState(1)
  const [conversationsPage, setConversationsPage] = useState(1)
  const [sessionsPage, setSessionsPage] = useState(1)

  useEffect(() => {
    const run = async () => {
      if (userType === "doctor") {
        router.replace("/doctor/history")
        return
      }

      if (!token) {
        setLoading(false)
        return
      }

      try {
        setError(null)

        const [sessionRes, consultationRes] = await Promise.all([
          fetch(`${API_BASE}/api/student/sessions/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/student/consultations/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const [sessionData, consultationData] = await Promise.all([
          sessionRes.json().catch(() => ({})),
          consultationRes.json().catch(() => ({})),
        ])

        if (!sessionRes.ok) {
          throw new Error(sessionData?.error || sessionData?.message || "Could not load mood counselling history")
        }

        if (!consultationRes.ok) {
          throw new Error(consultationData?.error || consultationData?.message || "Could not load consultation history")
        }

        setSessions(sessionData?.sessions || [])
        setConsultations(consultationData?.consultations || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load history")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token, userType, router])

  const stats = useMemo(() => {
    const completedSessions = sessions.filter((item) => item.status === "completed")
    const completedConsultations = consultations.filter((item) => item.status === "completed")
    const highRiskSessions = sessions.filter((item) => item.riskLevel === "high")
    const avgMoodScore = sessions.length
      ? sessions.reduce((sum, item) => sum + normalizeToPercent(item.finalScore), 0) / sessions.length
      : 0

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalConsultations: consultations.length,
      completedConsultations: completedConsultations.length,
      highRiskSessions: highRiskSessions.length,
      avgMoodScore,
    }
  }, [sessions, consultations])

  const checkIns = useMemo(() => {
    return sessions.map((item) => {
      const score = normalizeToPercent(item.finalScore)
      return {
        id: item.id,
        date: formatShortDate(item.startedAt),
        time: formatTime(item.startedAt),
        mood: item.finalMood || "neutral",
        emotion: score >= 75 ? "😊" : score >= 50 ? "😐" : "😟",
        score,
        risk: item.riskLevel || "low",
        faceScore: normalizeToPercent(item.averageFaceScore || 0),
        voiceScore: normalizeToPercent(item.averageVoiceScore || 0),
        textScore: normalizeToPercent(item.averageTextScore || 0),
        duration: `${Math.max(1, item.durationMinutes || 1)} min`,
        notes: item.lastStudentMessage || item.lastAiResponse || "No notes available for this session.",
      }
    })
  }, [sessions])

  const conversations = useMemo(() => {
    return sessions
      .filter((item) => item.lastStudentMessage || item.lastAiResponse)
      .map((item) => ({
        id: item.id,
        date: displayDate(item.startedAt),
        with: "AI Assistant",
        type: "ai" as const,
        preview: item.lastAiResponse || item.lastStudentMessage || "",
        messages: [
          ...(item.lastStudentMessage ? [{ sender: "user" as const, text: item.lastStudentMessage, time: formatTime(item.startedAt) || "" }] : []),
          ...(item.lastAiResponse ? [{ sender: "ai" as const, text: item.lastAiResponse, time: formatTime(item.startedAt) || "" }] : []),
        ],
      }))
  }, [sessions])

  const consultantSessions = useMemo(() => {
    return consultations.map((item) => ({
      id: item._id,
      consultant: item.doctorId?.name ? `Dr. ${item.doctorId.name}` : "Consultant",
      specialty: item.doctorId?.specialization || "Counselling",
      date: formatShortDate(item.scheduledAt),
      time: formatTime(item.scheduledAt),
      duration: item.completedAt && item.scheduledAt
        ? `${Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.scheduledAt).getTime()) / (1000 * 60)))} min`
        : "Scheduled",
      rating: item.status === "completed" ? 5 : item.status === "ongoing" ? 4 : 3,
      notes: item.concern || "General consultation",
      avatar: (item.doctorId?.name || "CN")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }))
  }, [consultations])

  const filteredCheckIns = useMemo(() => {
    return checkIns.filter((c) => {
      const matchSearch = c.mood.toLowerCase().includes(search.toLowerCase()) || c.date.toLowerCase().includes(search.toLowerCase())
      const matchRisk = filterRisk === "all" || c.risk === filterRisk
      return matchSearch && matchRisk
    })
  }, [checkIns, search, filterRisk])

  useEffect(() => {
    setCheckinsPage(1)
    setConversationsPage(1)
    setSessionsPage(1)
  }, [search, filterRisk, sessions, consultations])

  const totalCheckinsPages = Math.max(1, Math.ceil(filteredCheckIns.length / PAGE_SIZE))
  const totalConversationsPages = Math.max(1, Math.ceil(conversations.length / PAGE_SIZE))
  const totalConsultantPages = Math.max(1, Math.ceil(consultantSessions.length / PAGE_SIZE))

  const paginatedCheckIns = filteredCheckIns.slice((checkinsPage - 1) * PAGE_SIZE, checkinsPage * PAGE_SIZE)
  const paginatedConversations = conversations.slice((conversationsPage - 1) * PAGE_SIZE, conversationsPage * PAGE_SIZE)
  const paginatedConsultantSessions = consultantSessions.slice((sessionsPage - 1) * PAGE_SIZE, sessionsPage * PAGE_SIZE)

  return (
    <main style={{ minHeight: "100%", background: C.bg, padding: "28px 24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 24 }}>
          <Badge variant="outline" style={{ gap: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.violet, borderColor: "#C4B5FD", background: C.violetLight, borderRadius: 999, marginBottom: 10, display: "inline-flex", alignItems: "center" }}>
            <Clock size={11} strokeWidth={2.5} /> History
          </Badge>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: C.text, letterSpacing: "-0.05em", margin: 0, lineHeight: 1.2 }}>
            Your Wellness History
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            All your mood check-ins, AI conversations and consultant sessions in one place.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
          {[
            { label: "Total Check-ins", value: String(stats.totalSessions), icon: Activity, color: C.orange, bg: C.orangeTint, border: C.orangeLight },
            { label: "Avg Mood Score", value: stats.avgMoodScore.toFixed(1), icon: stats.avgMoodScore >= 50 ? TrendingUp : TrendingDown, color: stats.avgMoodScore >= 50 ? C.emerald : C.rose, bg: stats.avgMoodScore >= 50 ? C.emeraldLight : C.roseLight, border: stats.avgMoodScore >= 50 ? "#6EE7B7" : "#FCA5A5" },
            { label: "AI Conversations", value: String(conversations.length), icon: MessageCircle, color: C.violet, bg: C.violetLight, border: "#C4B5FD" },
            { label: "Consultant Sessions", value: String(consultantSessions.length), icon: Stethoscope, color: C.sky, bg: C.skyLight, border: "#7DD3FC" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ background: C.surface, border: `1px solid ${s.border}`, borderRadius: 18, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: "grid", placeItems: "center" }}>
                  <s.icon size={16} style={{ color: s.color }} strokeWidth={2} />
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.text, letterSpacing: "-0.04em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {([
            { key: "checkins", label: "Check-in History", icon: Activity },
            { key: "conversations", label: "Conversations", icon: MessageCircle },
            { key: "sessions", label: "Consultant Sessions", icon: Stethoscope },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 12,
                border: `1px solid ${activeTab === t.key ? C.violet : C.border}`,
                background: activeTab === t.key ? C.violetLight : C.surface,
                color: activeTab === t.key ? C.violet : C.textMuted,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <t.icon size={14} strokeWidth={2} />
              {t.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <Card className="border border-orange-100 p-5 text-sm text-muted-foreground">Loading counselling history...</Card>
        ) : null}

        {error ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
        ) : null}

        {!loading && !error ? (
          <AnimatePresence mode="wait">
            {activeTab === "checkins" && (
              <motion.div key="checkins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
                    <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textSoft }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by mood or date..."
                      style={{ width: "100%", paddingLeft: 34, paddingRight: 12, height: 36, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["all", "low", "medium", "high"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setFilterRisk(r)}
                        style={{ padding: "6px 12px", borderRadius: 9, border: `1px solid ${filterRisk === r ? C.violet : C.border}`, background: filterRisk === r ? C.violetLight : C.surface, color: filterRisk === r ? C.violet : C.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}
                      >
                        {r === "all" ? "All" : r}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {paginatedCheckIns.length === 0 ? (
                    <Card className="border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-muted-foreground">No sessions match your filters.</Card>
                  ) : (
                    paginatedCheckIns.map((ci, i) => (
                      <motion.div key={ci.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpandedCheckIn(expandedCheckIn === ci.id ? null : ci.id)}>
                          <div style={{ width: 46, height: 46, borderRadius: 14, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>{ci.emotion}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: C.text, textTransform: "capitalize" }}>{ci.mood}</span>
                              <RiskBadge risk={ci.risk} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.textSoft }}>
                              <Calendar size={10} strokeWidth={2} /> {ci.date} {ci.time ? `at ${ci.time}` : ""}
                              <span>·</span>
                              <Clock size={10} strokeWidth={2} /> {ci.duration}
                            </div>
                          </div>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <ScoreRing score={ci.score} color={ci.score >= 75 ? C.emerald : ci.score >= 55 ? C.amber : C.rose} />
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 900, color: C.text }}>{ci.score}</span>
                            </div>
                          </div>
                          <div style={{ color: C.textSoft, flexShrink: 0 }}>{expandedCheckIn === ci.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                        </div>

                        <AnimatePresence>
                          {expandedCheckIn === ci.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ borderTop: `1px solid ${C.border}`, overflow: "hidden" }}>
                              <div style={{ padding: "16px 20px", background: C.surfaceAlt }}>
                                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                                  {[
                                    { label: "Face Score", val: ci.faceScore, color: C.orange },
                                    { label: "Voice Score", val: ci.voiceScore, color: C.violet },
                                    { label: "Text Score", val: ci.textScore, color: C.sky },
                                  ].map((s) => (
                                    <div key={s.label} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px" }}>
                                      <div style={{ fontSize: 10, color: C.textSoft, fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                                      <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                                      <div style={{ height: 4, background: C.bg, borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${s.val}%`, background: s.color, borderRadius: 999 }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                                  <span style={{ fontWeight: 700, color: C.text }}>Notes: </span>{ci.notes}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </div>

                {filteredCheckIns.length > PAGE_SIZE ? (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Page {checkinsPage} of {totalCheckinsPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={checkinsPage === 1} onClick={() => setCheckinsPage((p) => Math.max(1, p - 1))}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={checkinsPage === totalCheckinsPages} onClick={() => setCheckinsPage((p) => Math.min(totalCheckinsPages, p + 1))}>Next</Button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {activeTab === "conversations" && (
              <motion.div key="conversations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {paginatedConversations.length === 0 ? (
                  <Card className="border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-muted-foreground">No conversation history found.</Card>
                ) : (
                  paginatedConversations.map((conv, i) => (
                    <motion.div key={conv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpandedConv(expandedConv === conv.id ? null : conv.id)}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: C.violetLight, border: "1px solid #C4B5FD", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Bot size={20} style={{ color: C.violet }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{conv.with}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: C.violetLight, color: C.violet }}>AI Chat</span>
                          </div>
                          <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>{conv.date}</div>
                          <div style={{ fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 480 }}>{conv.preview}</div>
                        </div>
                        <div style={{ color: C.textSoft, flexShrink: 0 }}>{expandedConv === conv.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                      </div>

                      <AnimatePresence>
                        {expandedConv === conv.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ borderTop: `1px solid ${C.border}`, overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", background: C.surfaceAlt, display: "flex", flexDirection: "column", gap: 10 }}>
                              {conv.messages.map((msg, mi) => {
                                const isUser = msg.sender === "user"
                                return (
                                  <div key={`${conv.id}-${mi}`} style={{ display: "flex", gap: 10, justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                                    {!isUser && (
                                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.violetLight, border: "1px solid #C4B5FD", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                        <Bot size={13} style={{ color: C.violet }} />
                                      </div>
                                    )}
                                    <div style={{ maxWidth: "72%", background: isUser ? C.violet : C.surface, color: isUser ? "#fff" : C.text, borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 13, lineHeight: 1.55, border: isUser ? "none" : `1px solid ${C.border}` }}>
                                      {msg.text}
                                      <div style={{ fontSize: 10, marginTop: 5, opacity: 0.6, textAlign: isUser ? "right" : "left" }}>{msg.time}</div>
                                    </div>
                                    {isUser && (
                                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.violet, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                        <User size={13} style={{ color: "#fff" }} />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}

                {conversations.length > PAGE_SIZE ? (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Page {conversationsPage} of {totalConversationsPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={conversationsPage === 1} onClick={() => setConversationsPage((p) => Math.max(1, p - 1))}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={conversationsPage === totalConversationsPages} onClick={() => setConversationsPage((p) => Math.min(totalConversationsPages, p + 1))}>Next</Button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {activeTab === "sessions" && (
              <motion.div key="sessions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {paginatedConsultantSessions.length === 0 ? (
                  <Card className="border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-muted-foreground">No consultant sessions found.</Card>
                ) : (
                  paginatedConsultantSessions.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{ background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${C.orange}, ${C.orangeDeep})`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                        {s.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 3 }}>{s.consultant}</div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{s.specialty}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.textSoft }}>
                          <Calendar size={10} strokeWidth={2} /> {s.date} at {s.time}
                          <span>·</span>
                          <Clock size={10} strokeWidth={2} /> {s.duration}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 700, color: C.text }}>Notes: </span>{s.notes}
                        </div>
                      </div>
                      <Button className="h-8 px-4 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white border-0 shadow-sm" onClick={() => router.push("/consultants")}>Book Again</Button>
                    </motion.div>
                  ))
                )}

                {consultantSessions.length > PAGE_SIZE ? (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Page {sessionsPage} of {totalConsultantPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={sessionsPage === 1} onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={sessionsPage === totalConsultantPages} onClick={() => setSessionsPage((p) => Math.min(totalConsultantPages, p + 1))}>Next</Button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        ) : null}

        {!loading && !error ? (
          <Card className="border border-orange-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">Continue Your Support Journey</h3>
                <p className="text-xs text-muted-foreground">Start a new AI check-in or connect with a consultant.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/mood-tracking")}>Mood Tracking <ChevronRight className="ml-1 size-4" /></Button>
                <Button onClick={() => router.push("/consultants")} className="bg-orange-600 text-white hover:bg-orange-700">Consultants <ChevronRight className="ml-1 size-4" /></Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
