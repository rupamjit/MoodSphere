"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarDays,
  Flame,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/components/auth/auth-context"

type Tone = "orange" | "emerald" | "violet" | "sky"
type CalTone = "empty" | "low" | "mid" | "high" | "today"

type DashboardTrendPoint = {
  date: string
  score: number
  hasData: boolean
}

type DashboardOverview = {
  profile: {
    name: string
    currentMood: string
    moodScore: number
    riskLevel: "low" | "medium" | "high"
  }
  stats: {
    moodScore: number
    weeklyDelta: number
    currentRisk: "low" | "medium" | "high"
    completedSessionsThisMonth: number
    consistency: number
    currentStreak: number
  }
  trend: {
    period: "7d" | "30d"
    points: DashboardTrendPoint[]
  }
  streak: {
    currentStreak: number
    calendar: {
      year: number
      month: number
      monthLabel: string
      days: Array<{
        day: number
        score: number
        level: CalTone
        hasData: boolean
      }>
    }
  }
  patternRecognition: {
    nodes: PatternNode[]
    insight: string
  }
  recentSessions: Array<{
    mood: string
    score: number
    risk: "low" | "medium" | "high"
    time: string
  }>
  aiTips: string[]
}

type PatternNode = {
  label: string
  pct: number
  color: string
  emoji: string
}

const fallbackRecentSessions = [
  { time: "Today • 9:10 AM", mood: "Focused", score: 78, risk: "low" },
  { time: "Yesterday • 8:42 PM", mood: "Calm", score: 72, risk: "low" },
  { time: "Mar 24 • 2:15 PM", mood: "Reflective", score: 66, risk: "medium" },
]

const fallbackAiTips = [
  "You are most stable in the morning. Keep check-ins before class.",
  "Short breaks after heavy study blocks improve your scores.",
]

const fallbackCalCells: CalTone[] = [
  "high", "mid", "low", "mid", "high", "mid", "high",
  "high", "today", "mid", "high", "low", "mid", "high",
  "mid", "high", "mid", "low", "mid", "high", "mid",
  "high", "low", "mid", "high", "mid", "high", "mid",
  "high", "mid", "high", "empty", "empty", "empty", "empty",
  "empty", "empty", "empty", "empty", "empty", "empty", "empty",
]

const fallbackPatternNodes: PatternNode[] = [
  { label: "Focus", pct: 82, color: "#EA580C", emoji: "🎯" },
  { label: "Calm", pct: 74, color: "#FB923C", emoji: "😌" },
  { label: "Energy", pct: 69, color: "#F59E0B", emoji: "⚡" },
  { label: "Stress", pct: 28, color: "#FDBA74", emoji: "😤" },
  { label: "Sleep", pct: 61, color: "#C2410C", emoji: "😴" },
]

const fallbackPatternInsight =
  "Focus and Calm are dominant today, while Stress remains below baseline."

const API_CANDIDATES = [
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim(),
  "http://localhost:5005",
].filter((v): v is string => Boolean(v))

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value

const formatSessionTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const now = new Date()
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

  if (todayKey === dateKey) {
    return `Today • ${format(date, "h:mm a")}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`
  if (yesterdayKey === dateKey) {
    return `Yesterday • ${format(date, "h:mm a")}`
  }

  return format(date, "MMM dd • h:mm a")
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, logout, token } = useAuth()
  const [chartMode, setChartMode] = useState<"7d" | "30d">("30d")
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user || !token) return

      setDashboardLoading(true)
      setDashboardError(null)

      try {
        let response: Response | null = null
        let data: unknown = null
        let lastError: unknown = null

        for (const base of API_CANDIDATES) {
          try {
            const candidateResponse = await fetch(
              `${base}/api/student/dashboard/overview?period=${chartMode}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            )

            const candidateData = await candidateResponse.json().catch(() => ({}))

            if (!candidateResponse.ok) {
              response = candidateResponse
              data = candidateData
              continue
            }

            response = candidateResponse
            data = candidateData
            break
          } catch (error) {
            lastError = error
          }
        }

        if (!response || !response.ok) {
          if (response) {
            const safeData = (data as { message?: string }) || {}
            throw new Error(safeData.message || "Dashboard API request failed")
          }
          throw lastError instanceof Error
            ? lastError
            : new Error("Unable to reach backend API. Check backend server/port.")
        }

        setDashboard(data as DashboardOverview)
      } catch (error) {
        setDashboardError(error instanceof Error ? error.message : "Failed to fetch dashboard")
      } finally {
        setDashboardLoading(false)
      }
    }

    fetchDashboard()
  }, [user, token, chartMode])

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </main>
    )
  }

  const recentSessions = dashboard?.recentSessions?.length
    ? dashboard.recentSessions.map((session) => ({
        ...session,
        risk: session.risk,
        time: formatSessionTime(session.time),
      }))
    : fallbackRecentSessions

  const aiTips = dashboard?.aiTips?.length ? dashboard.aiTips : fallbackAiTips

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <section className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="mb-2 border-orange-200 bg-white text-orange-700">Student wellness dashboard</Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back, {user.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You are on a {dashboard?.stats.currentStreak ?? 18}-day streak. Keep your rhythm steady today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push("/mood-tracking")}>
                <Brain className="size-4" />
                New Check-in
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push("/history")}>View History</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            title="Mood score"
            value={`${dashboard?.stats.moodScore ?? 78}/100`}
            subtitle={`${(dashboard?.stats.weeklyDelta ?? 6) >= 0 ? "+" : ""}${dashboard?.stats.weeklyDelta ?? 6} from last week`}
            icon={HeartPulse}
            tone="orange"
          />
          <StatTile
            title="Current risk"
            value={capitalize(dashboard?.stats.currentRisk ?? "low")}
            subtitle="stable trend"
            icon={ShieldAlert}
            tone="emerald"
          />
          <StatTile
            title="Completed sessions"
            value={`${dashboard?.stats.completedSessionsThisMonth ?? 62}`}
            subtitle="this month"
            icon={BookOpen}
            tone="violet"
          />
          <StatTile
            title="Consistency"
            value={`${dashboard?.stats.consistency ?? 89}%`}
            subtitle="excellent"
            icon={TrendingUp}
            tone="sky"
          />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <PatternRecognitionCard
            chartMode={chartMode}
            onChartModeChange={setChartMode}
            trendPoints={dashboard?.trend.points ?? []}
            moodScore={dashboard?.stats.moodScore ?? 78}
            patternNodes={dashboard?.patternRecognition?.nodes ?? fallbackPatternNodes}
            patternInsight={dashboard?.patternRecognition?.insight ?? fallbackPatternInsight}
            isLoading={dashboardLoading}
          />
          <DailyStreakCard
            calendar={dashboard?.streak.calendar}
            currentStreak={dashboard?.streak.currentStreak ?? 18}
          />
        </section>

        {dashboardError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Failed to load dashboard API data: {dashboardError}
          </div>
        ) : null}

        <section className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent check-ins</CardTitle>
              <CardDescription className="text-xs">Latest sessions overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.time} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{session.mood}</p>
                    <p className="text-xs text-muted-foreground">{session.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{session.score}</p>
                    <p className="text-xs text-muted-foreground">{capitalize(session.risk)}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => router.push("/history")}>
                View complete history <ArrowUpRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-orange-500" />
                AI guidance
              </CardTitle>
              <CardDescription className="text-xs">Quick recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {aiTips.map((tip) => (
                <div key={tip} className="rounded-lg border bg-orange-50/40 px-3 py-2">
                  <p className="text-xs text-foreground/90">{tip}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/")}>Home</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    router.replace("/login")
                  }}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function PatternRecognitionCard({
  chartMode,
  onChartModeChange,
  trendPoints,
  moodScore,
  patternNodes,
  patternInsight,
  isLoading,
}: {
  chartMode: "7d" | "30d"
  onChartModeChange: (mode: "7d" | "30d") => void
  trendPoints: DashboardTrendPoint[]
  moodScore: number
  patternNodes: PatternNode[]
  patternInsight: string
  isLoading: boolean
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    return (trendPoints || []).map((point) => {
      const date = new Date(point.date)
      const safeDate = Number.isNaN(date.getTime()) ? new Date() : date

      return {
        date: safeDate,
        score: point.score,
        label: format(safeDate, "MMM dd"),
      }
    })
  }, [trendPoints])

  const maxScore = Math.max(...chartData.map(d => d.score), 100)
  const minScore = Math.min(...chartData.map(d => d.score), 0)
  const range = maxScore - minScore || 1
  const divisor = Math.max(chartData.length - 1, 1)

  const P = {
    orange: "#EA580C",
    amber: "#F59E0B",
    soft: "#9A3412B3",
    rust: "#C2410C",
  }

  return (
    <Card className="border-orange-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Pattern Recognition</CardTitle>
            <CardDescription className="text-xs">Behavioral connection mapping</CardDescription>
          </div>
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Scanning</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Mood</span>
              <span className="text-xs font-semibold text-orange-700">{moodScore}% healthy</span>
            </div>
            <div className="relative h-2 rounded-full bg-orange-100">
              <motion.div
                className="h-2 rounded-full bg-orange-600"
                initial={{ width: 0 }}
                whileInView={{ width: `${moodScore}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-white p-3">
            <div className="mb-1 text-xs text-muted-foreground">Signal state</div>
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {moodScore >= 65 ? "Stable scan" : "Needs attention"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {patternNodes.map((n) => (
            <div key={n.label} className="rounded-lg border p-2 text-center">
              <div style={{ fontSize: 13 }}>{n.emoji}</div>
              <div className="mt-0.5 text-[10px] font-semibold" style={{ color: n.color }}>{n.pct}%</div>
              <div className="text-[9px]" style={{ color: P.soft }}>{n.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-orange-100 bg-orange-50/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            {patternInsight}
          </p>
        </div>

        {/* Mood Trend Chart Section */}
        <div className="rounded-xl border border-orange-100 bg-linear-to-br from-white to-orange-50/30 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-foreground">Mood Trend</p>
              <p className="text-sm text-muted-foreground">{chartMode === "7d" ? "Last 7 days" : "Last 30 days"}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={chartMode === "7d" ? "default" : "outline"}
                onClick={() => onChartModeChange("7d")}
                className="h-8 px-4 text-sm font-semibold"
              >
                7D
              </Button>
              <Button
                size="sm"
                variant={chartMode === "30d" ? "default" : "outline"}
                onClick={() => onChartModeChange("30d")}
                className="h-8 px-4 text-sm font-semibold"
              >
                30D
              </Button>
            </div>
          </div>

          {/* Chart - Much Larger */}
          <svg viewBox="0 0 1200 520" className="w-full" onMouseLeave={() => setHoveredIndex(null)}>
            {/* Grid lines - subtle */}
            {[0, 25, 50, 75, 100].map((level) => (
              <line
                key={`grid-${level}`}
                x1="80"
                y1={380 - (level / 100) * 360}
                x2="1140"
                y2={380 - (level / 100) * 360}
                stroke="#E5E7EB"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
            ))}

            {/* Y-axis labels - larger */}
            {[0, 25, 50, 75, 100].map((level) => (
              <text
                key={`label-${level}`}
                x="70"
                y={385 - (level / 100) * 360}
                fontSize="14"
                fontWeight="600"
                fill="#666"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {level}
              </text>
            ))}

            {/* Axes */}
            <line x1="80" y1="380" x2="1140" y2="380" stroke="#999" strokeWidth="2.5" />
            <line x1="80" y1="20" x2="80" y2="380" stroke="#999" strokeWidth="2.5" />

            {/* Data line and area */}
            {chartData.length > 1 && (
              <>
                {/* Area fill - beautiful gradient */}
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#FB923C" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Polygon for area */}
                <polygon
                  points={
                    chartData
                      .map((d, i) => {
                        const x = 80 + (i / divisor) * 1060
                        const y = 380 - ((d.score - minScore) / range) * 360
                        return `${x},${y}`
                      })
                      .join(" ") +
                    ` 1140,380 80,380`
                  }
                  fill="url(#areaGradient)"
                  filter="url(#shadow)"
                />

                {/* Line - thicker and more prominent */}
                <polyline
                  points={chartData
                    .map((d, i) => {
                      const x = 80 + (i / divisor) * 1060
                      const y = 380 - ((d.score - minScore) / range) * 360
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke={P.orange}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#shadow)"
                />

                {/* Data points - larger */}
                {chartData.map((d, i) => {
                  const x = 80 + (i / divisor) * 1060
                  const y = 380 - ((d.score - minScore) / range) * 360
                  const isHovered = hoveredIndex === i
                  return (
                    <g key={`point-${i}`} onMouseEnter={() => setHoveredIndex(i)}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 10 : 5.5}
                        fill={isHovered ? P.rust : P.orange}
                        stroke="white"
                        strokeWidth="3"
                        className="cursor-pointer transition-all"
                        filter="url(#shadow)"
                      />
                    </g>
                  )
                })}
                
                {/* Tooltips rendered LAST so they appear on top */}
                {chartData.map((d, i) => {
                  const x = 80 + (i / divisor) * 1060
                  const y = 380 - ((d.score - minScore) / range) * 360
                  const isHovered = hoveredIndex === i
                  return isHovered ? (
                    <g key={`tooltip-${i}`} pointerEvents="none">
                      <rect
                        x={x - 90}
                        y={y - 140}
                        width="180"
                        height="80"
                        fill="white"
                        stroke={P.orange}
                        strokeWidth="3"
                        rx="12"
                        filter="url(#shadow)"
                      />
                      <text
                        x={x}
                        y={y - 105}
                        fontSize="18"
                        fontWeight="700"
                        fill={P.rust}
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                      <text
                        x={x}
                        y={y - 65}
                        fontSize="42"
                        fontWeight="900"
                        fill={P.orange}
                        textAnchor="middle"
                      >
                        {d.score}
                      </text>
                    </g>
                  ) : null
                })}
              </>
            )}
          </svg>

          {isLoading ? (
            <p className="mt-2 text-xs text-muted-foreground">Updating trend from API...</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">✨ Hover over points to see daily scores</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">Range: {minScore} - {maxScore}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DailyStreakCard({
  calendar,
  currentStreak,
}: {
  calendar?: DashboardOverview["streak"]["calendar"]
  currentStreak: number
}) {
  const P = {
    orange: "#EA580C",
    peach: "#FB923C",
    rust: "#C2410C",
    soft: "#9A3412B3",
  }

  const calStyle = (tone: CalTone) => {
    if (tone === "empty") {
      return {
        border: "1px dashed #E5E7EB",
        background: "#F8FAFC",
        color: "#CBD5E1",
      }
    }
    if (tone === "today") {
      return {
        border: "none",
        background: `linear-gradient(135deg, ${P.peach}, ${P.orange})`,
        color: "#FFFFFF",
      }
    }
    if (tone === "high") {
      return {
        border: "none",
        background: P.orange,
        color: "#FFFFFF",
      }
    }
    if (tone === "mid") {
      return {
        border: "none",
        background: "#FFEDD5",
        color: "#9A3412",
      }
    }
    return {
      border: "1px solid #E5E7EB",
      background: "#FFF7ED",
      color: "#9A3412",
    }
  }

  const monthLabel = calendar?.monthLabel || "March 2026"

  const calendarCells = useMemo(() => {
    if (!calendar?.days?.length) {
      return fallbackCalCells.map((tone, i) => ({
        tone,
        day: i < 31 ? i + 1 : null,
      }))
    }

    const firstWeekday = new Date(calendar.year, calendar.month - 1, 1).getDay()
    const cells: Array<{ tone: CalTone; day: number | null }> = []

    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ tone: "empty", day: null })
    }

    for (const dayItem of calendar.days) {
      cells.push({ tone: dayItem.level, day: dayItem.day })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ tone: "empty", day: null })
    }

    while (cells.length < 35) {
      cells.push({ tone: "empty", day: null })
    }

    return cells
  }, [calendar])

  return (
    <Card className="border-orange-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-orange-500" />
          Daily streak
        </CardTitle>
        <CardDescription className="text-xs">Calendar intensity in {monthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: P.rust }}>{currentStreak} days</span>
            <span className="text-sm">🔥</span>
            <span className="text-[10px] text-muted-foreground">· {monthLabel}</span>
          </div>
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Active</Badge>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div key={d} className="text-center text-[8px] font-semibold" style={{ color: P.soft }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((item, i) => (
            <motion.div
              key={`cal-${i}`}
              initial={{ scale: 0.95, opacity: 0.3 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.008, duration: 0.16 }}
              className="flex items-center justify-center rounded-md text-[8px] font-semibold"
              style={{ aspectRatio: "1", ...calStyle(item.tone) }}
            >
              {item.day ?? ""}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-orange-100 pt-2">
          {[
            { bg: "#FFF7ED", label: "Low" },
            { bg: "#FFEDD5", label: "Mid" },
            { bg: P.orange, label: "High" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: item.bg,
                  border: item.bg === "#FFF7ED" ? "1px solid #E5E7EB" : "none",
                }}
              />
              <span className="text-[9px]" style={{ color: P.soft }}>{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatTile({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  tone: Tone
}) {
  const toneMap = {
    orange: "border-orange-100 bg-orange-50/45 text-orange-600",
    emerald: "border-emerald-100 bg-emerald-50/45 text-emerald-600",
    violet: "border-violet-100 bg-violet-50/45 text-violet-600",
    sky: "border-sky-100 bg-sky-50/45 text-sky-600",
  }

  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className={`grid h-8 w-8 place-items-center rounded-lg border ${toneMap[tone]}`}>
            <Icon className="size-4" />
          </div>
          {tone === "orange" ? <Flame className="size-4 text-orange-500" /> : null}
        </div>
        <p className="text-[11px] text-muted-foreground">{title}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}
