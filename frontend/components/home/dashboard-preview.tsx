import { CalendarDays, ShieldCheck, Sparkles, TrendingUp, Waves } from "lucide-react"
import type { ReactNode } from "react"

const bars = [42, 56, 48, 72, 68, 81, 76]
const patternMix = [
  { label: "Focus", score: 86, color: "#F97316" },
  { label: "Calm", score: 74, color: "#14B8A6" },
  { label: "Energy", score: 78, color: "#F59E0B" },
  { label: "Stress", score: 31, color: "#F43F5E" },
]
const streakDays = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 64 },
  { day: "Wed", score: 80 },
  { day: "Thu", score: 74 },
  { day: "Fri", score: 86 },
  { day: "Sat", score: 78 },
  { day: "Sun", score: 83 },
]

const calendar = [
  0, 0, 1, 2, 3, 4, 5,
  6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 0, 0, 0,
]

export function DashboardPreview() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-[20px] border border-neutral-200 bg-linear-to-b from-white via-orange-50/20 to-white">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl" />

      <div className="relative grid h-full grid-cols-[220px_1fr]">
        <aside className="border-r border-neutral-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm">
          <div className="mb-4 rounded-2xl border border-orange-100 bg-linear-to-r from-orange-50 to-amber-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-orange-500">MoodSphere</p>
            <p className="mt-1 text-sm font-semibold text-neutral-800">Student Console</p>
          </div>

          <div className="space-y-2">
            {[
              "Dashboard",
              "Mood Tracking",
              "Sessions",
              "Consultants",
              "Insights",
            ].map((item, index) => (
              <div
                key={item}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  index === 0
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">Live Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold text-neutral-700">All signals stable</p>
            </div>
          </div>
        </aside>

        <main className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="Mood Score"
              value="82"
              suffix="/100"
              hint="+8 this week"
              icon={<TrendingUp className="size-4" />}
              tone="orange"
            />
            <MetricCard
              label="Current Risk"
              value="Low"
              hint="Healthy trend"
              icon={<ShieldCheck className="size-4" />}
              tone="emerald"
            />
            <MetricCard
              label="Consistency"
              value="91"
              suffix="%"
              hint="Excellent"
              icon={<Sparkles className="size-4" />}
              tone="violet"
            />
          </div>

          <div className="grid grid-cols-[1.3fr_1fr] gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Pattern Recognition</p>
                  <p className="text-base font-semibold text-neutral-800">Emotion + Trend Graph</p>
                </div>
                <Waves className="size-4 text-orange-500" />
              </div>

              <div className="grid grid-cols-[1.1fr_1fr] gap-2">
                <div className="h-[145px] rounded-xl border border-orange-100 bg-orange-50/40 px-2 pb-2 pt-3">
                  <div className="flex h-full items-end gap-2">
                    {bars.map((bar, i) => (
                      <div key={`${bar}-${i}`} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-linear-to-t from-orange-500 to-amber-300"
                          style={{ height: `${bar}%` }}
                        />
                        <span className="text-[10px] text-neutral-500">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-orange-100 bg-white px-2 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Emotion Map</p>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">Live</span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="h-[88px] w-[88px]">
                      <polygon points="60,12 108,60 60,108 12,60" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
                      <polygon points="60,26 94,60 60,94 26,60" fill="none" stroke="#FED7AA" strokeWidth="1" />
                      <polygon points="60,18 84,60 60,83 36,60" fill="#FB923C55" stroke="#F97316" strokeWidth="1.6" />
                      <line x1="60" y1="12" x2="60" y2="108" stroke="#FED7AA" strokeWidth="1" />
                      <line x1="12" y1="60" x2="108" y2="60" stroke="#FED7AA" strokeWidth="1" />
                      <circle cx="60" cy="18" r="2.2" fill="#F97316" />
                      <circle cx="84" cy="60" r="2.2" fill="#F59E0B" />
                      <circle cx="60" cy="83" r="2.2" fill="#F43F5E" />
                      <circle cx="36" cy="60" r="2.2" fill="#14B8A6" />
                    </svg>
                  </div>

                  <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
                    {patternMix.map((item) => (
                      <div key={item.label} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[9px] font-medium text-neutral-500">{item.label}</span>
                        <span className="ml-auto text-[9px] font-semibold text-neutral-700">{item.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-800">Streak Calendar</p>
                <CalendarDays className="size-4 text-orange-500" />
              </div>

              <div className="mb-2 flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/60 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-600">Current Streak</p>
                <p className="text-base font-bold text-orange-600">18 days</p>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendar.map((day, idx) => (
                  <div
                    key={`${day}-${idx}`}
                    className={`grid h-8 place-items-center rounded-md text-[14px] font-bold ${
                      day === 0
                        ? "text-neutral-300"
                        : day === 17
                        ? "bg-orange-500 text-white"
                        : "bg-orange-50 text-neutral-700"
                    }`}
                  >
                    {day || ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">Next 7 Days Forecast</p>
            <div className="grid grid-cols-7 gap-2">
              {streakDays.map((item) => (
                <div key={item.day} className="rounded-xl border border-orange-100 bg-orange-50/40 p-2 text-center">
                  <p className="text-[11px] font-semibold text-neutral-500">{item.day}</p>
                  <p className="mt-1 text-lg font-bold text-neutral-800">{item.score}</p>
                  <p className="text-[10px] text-neutral-500">mood</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  suffix,
  hint,
  icon,
  tone,
}: {
  label: string
  value: string
  suffix?: string
  hint: string
  icon: ReactNode
  tone: "orange" | "emerald" | "violet"
}) {
  const toneMap = {
    orange: {
      badge: "bg-orange-100 text-orange-600",
      value: "text-orange-600",
    },
    emerald: {
      badge: "bg-emerald-100 text-emerald-600",
      value: "text-emerald-600",
    },
    violet: {
      badge: "bg-violet-100 text-violet-600",
      value: "text-violet-600",
    },
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">{label}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneMap[tone].badge}`}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold leading-none ${toneMap[tone].value}`}>
        {value}
        {suffix ? <span className="ml-1 text-sm font-semibold text-neutral-400">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{hint}</p>
    </div>
  )
}
