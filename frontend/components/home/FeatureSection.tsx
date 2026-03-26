"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"

/*  AI Chat Animation*/
const CHAT_SCRIPT = [
  {
    role: "ai",
    text: "Hey! Your 7-day mood average has been low. I noticed you haven't been sleeping well either 💙",
  },
  {
    role: "user",
    text: "Yeah… exams are killing me. I feel really burnt out.",
  },
  {
    role: "ai",
    text: "Your NLP score today is -0.62. That's your 5th consecutive low-trend day. Want me to suggest campus counseling resources?",
  },
  { role: "user", text: "Yes please, I think I need to talk to someone." },
  {
    role: "ai",
    text: "I've found 3 available campus counselors nearby. I'd recommend Dr. Priya Sharma — she specialises in academic stress. Book a session? 💛",
  },
]

function Typewriter({
  text,
  speed = 22,
  onDone,
}: {
  text: string
  speed?: number
  onDone?: () => void
}) {
  const [shown, setShown] = useState("")
  useEffect(() => {
    if (shown.length >= text.length) {
      onDone?.()
      return
    }
    const t = setTimeout(() => setShown(text.slice(0, shown.length + 1)), speed)
    return () => clearTimeout(t)
  }, [shown, text, speed, onDone])
  return (
    <span>
      {shown}
      {shown.length < text.length && (
        <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse rounded-sm bg-orange-400 align-middle" />
      )}
    </span>
  )
}

function AIChatDemo() {
  const [messages, setMessages] = useState<typeof CHAT_SCRIPT>([])
  const [visibleIdx, setVisibleIdx] = useState(0)
  const [isDone, setIsDone] = useState(false)
  // ✅ ref now points to the scrollable messages container, not a bottom sentinel
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visibleIdx < CHAT_SCRIPT.length) {
      setMessages((prev) => [...prev, CHAT_SCRIPT[visibleIdx]])
    }
  }, [visibleIdx])

  const handleDone = () => {
    if (visibleIdx < CHAT_SCRIPT.length - 1) {
      setTimeout(() => setVisibleIdx((v) => v + 1), 800)
    } else {
      setIsDone(true)
    }
  }

  useEffect(() => {
    // ✅ Scroll only the chat container, NOT the page
    const el = scrollContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
      style={{ height: 320 }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 bg-linear-to-br from-orange-400 to-orange-500 text-sm shadow-sm">
              🧠
            </div>
            <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-neutral-800">
              MoodSphere AI
            </p>
            <p className="text-[9px] font-medium text-emerald-600">
              NLP Engine Active
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-neutral-300" />
          <div className="h-1 w-1 rounded-full bg-neutral-300" />
          <div className="h-1 w-1 rounded-full bg-neutral-300" />
        </div>
      </div>

      {/* Messages — ✅ attach ref here, remove bottom sentinel div */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto scroll-smooth p-4"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="mt-0.5 mr-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-[10px]">
                🧠
              </div>
            )}
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-[11px] leading-relaxed shadow-sm ${
                msg.role === "ai"
                  ? "rounded-[4px_16px_16px_16px] border border-neutral-200 bg-neutral-50 text-neutral-700"
                  : "rounded-[16px_4px_16px_16px] border border-orange-400 bg-linear-to-br from-orange-500 to-orange-600 text-white"
              }`}
            >
              {i === messages.length - 1 && !isDone ? (
                <Typewriter text={msg.text} onDone={handleDone} />
              ) : (
                msg.text
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1 pl-3 shadow-inner">
          <div className="flex-1 text-[11px] text-neutral-400">
            Type your thoughts...
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-orange-300 bg-linear-to-br from-orange-400 to-orange-500 text-white shadow-sm">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/*  Mood Score Chart */
function MoodScoreChart() {
  const days = [
    { d: "Mon", v: -0.4 },
    { d: "Tue", v: 0.2 },
    { d: "Wed", v: -0.6 },
    { d: "Thu", v: -0.1 },
    { d: "Fri", v: 0.5 },
    { d: "Sat", v: 0.7 },
    { d: "Sun", v: 0.3 },
  ]

  const H = 90
  const TOTAL = H * 2

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[9.5px] font-bold tracking-widest text-neutral-400 uppercase">
          7-Day Mood
        </span>
        <div className="flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-0.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
          <span className="text-[9px] font-bold text-orange-500">
            Live tracking
          </span>
        </div>
      </div>

      <div
        className="relative rounded-xl border border-neutral-100 bg-neutral-50 px-3 pt-3 pb-7"
        style={{ height: TOTAL + 52 }}
      >
        {["+1.0", "+0.5", "0", "−0.5", "−1.0"].map((label, i) => {
          const topPct = (i / 4) * 100
          return (
            <div
              key={i}
              className="absolute inset-x-3 flex items-center"
              style={{ top: `${(i / 4) * TOTAL + 12}px` }}
            >
              <span className="w-7 shrink-0 text-[8px] font-bold text-neutral-300">
                {label}
              </span>
              <div
                className={`h-px flex-1 ${i === 2 ? "bg-neutral-300" : "bg-neutral-150 border-t border-dashed border-neutral-200"}`}
              />
            </div>
          )
        })}

        <div
          className="absolute inset-x-10 flex items-start gap-1"
          style={{ top: 12, height: TOTAL }}
        >
          {days.map((day, i) => {
            const isPos = day.v >= 0
            const barH = Math.round(Math.abs(day.v) * H)

            return (
              <div
                key={i}
                className="flex flex-1 flex-col"
                style={{ height: TOTAL }}
              >
                {/* Positive half */}
                <div
                  className="flex flex-col justify-end"
                  style={{ height: H }}
                >
                  {isPos && (
                    <motion.div
                      variants={{
                        hidden: { scaleY: 0, opacity: 0 },
                        visible: { scaleY: 1, opacity: 1 },
                      }}
                      style={{ height: barH, originY: 1 }}
                      transition={{
                        delay: i * 0.08,
                        duration: 0.55,
                        ease: [0.34, 1.4, 0.64, 1],
                      }}
                      className="relative w-full overflow-hidden rounded-t-[5px]"
                    >
                      {/* gradient bar */}
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-500 to-orange-300" />
                      {/* glass sheen */}
                      <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-[5px] bg-white/20" />
                      {/* score dot on top */}
                      <div className="absolute -top-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-white bg-orange-500 shadow-sm" />
                    </motion.div>
                  )}
                </div>

                {/* Zero line spacer */}
                <div className="h-px bg-neutral-200" />

                {/* Negative half */}
                <div
                  className="flex flex-col justify-start"
                  style={{ height: H }}
                >
                  {!isPos && (
                    <motion.div
                      variants={{
                        hidden: { scaleY: 0, opacity: 0 },
                        visible: { scaleY: 1, opacity: 1 },
                      }}
                      style={{ height: barH, originY: 0 }}
                      transition={{
                        delay: i * 0.08,
                        duration: 0.55,
                        ease: [0.34, 1.4, 0.64, 1],
                      }}
                      className="relative w-full overflow-hidden rounded-b-[5px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-rose-400 to-rose-200" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-[5px] bg-white/20" />
                      <div className="absolute -bottom-[5px] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-white bg-rose-400 shadow-sm" />
                    </motion.div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Day labels */}
        <div className="absolute inset-x-10 flex gap-1" style={{ bottom: 8 }}>
          {days.map((day, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-[8.5px] font-bold text-neutral-400">
                {day.d.slice(0, 2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend + avg */}
      <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-3 py-2 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-gradient-to-tr from-orange-500 to-orange-300" />
            <span className="text-[9.5px] font-semibold text-neutral-500">
              Positive
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-gradient-to-tr from-rose-400 to-rose-200" />
            <span className="text-[9.5px] font-semibold text-neutral-500">
              Negative
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-neutral-400">7-day avg</span>
          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-500">
            −0.24
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/*  Voice Wave  */
function VoiceWave() {
  const bars = [
    3, 6, 9, 12, 8, 14, 10, 7, 12, 9, 5, 11, 8, 6, 10, 13, 7, 9, 11, 6,
  ]
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-neutral-700">
            Voice Note Recording
          </p>
          <div className="mt-1 flex h-5 items-end gap-0.5">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-orange-400"
                animate={{ height: [`${h * 0.6}px`, `${h}px`, `${h * 0.6}px`] }}
                transition={{
                  repeat: Infinity,
                  duration: 1 + i * 0.05,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-[9px] font-bold text-orange-500">00:23</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
        <div className="text-base">📝</div>
        <div className="flex-1">
          <p className="text-[9px] font-semibold text-neutral-700">
            Speech-to-Text Transcript
          </p>
          <p className="mt-0.5 text-[9px] text-neutral-500 italic">
            "I've been very anxious about tomorrow's exam…"
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">
          Live
        </span>
      </div>
    </div>
  )
}

/*  Encryption Badge  */
function EncryptedStorage() {
  const items = [
    {
      label: "Journal entry",
      val: "AES-256 encrypted",
      icon: "🔒",
      color: "emerald",
    },
    {
      label: "Mood score",
      val: "-0.62 (VADER NLP)",
      icon: "🧮",
      color: "orange",
    },
    { label: "Voice memo", val: "Encrypted + STT", icon: "🎙️", color: "blue" },
  ]
  return (
    <div className="flex flex-col gap-2">
      {items.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 + i * 0.1 }}
          className="flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2"
        >
          <span className="text-sm">{r.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-semibold text-neutral-600">
              {r.label}
            </p>
            <p className="truncate text-[8.5px] text-neutral-400">{r.val}</p>
          </div>
          <div
            className={`h-1.5 w-1.5 rounded-full ${r.color === "emerald" ? "bg-emerald-400" : r.color === "orange" ? "bg-orange-400" : "bg-blue-400"}`}
          />
        </motion.div>
      ))}
    </div>
  )
}

/*  Feature Card  */
function FeatureCard({
  tag,
  icon,
  title,
  body,
  accentColor,
  visual,
  stat,
  delay,
}: {
  tag: string
  icon: string
  title: string
  body: string
  accentColor: string
  visual: React.ReactNode
  stat: { value: string; label: string }
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}70, transparent)`,
        }}
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
              style={{ background: `${accentColor}15` }}
            >
              {icon}
            </div>
            <div>
              <span
                className="mb-0.5 block text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ color: accentColor }}
              >
                {tag}
              </span>
              <h3 className="text-[13.5px] leading-tight font-bold tracking-tight text-neutral-800">
                {title}
              </h3>
            </div>
          </div>
          <div className="ml-2 shrink-0 text-right">
            <div
              className="text-lg leading-none font-black"
              style={{ color: accentColor }}
            >
              {stat.value}
            </div>
            <div className="mt-0.5 text-[8.5px] text-neutral-400">
              {stat.label}
            </div>
          </div>
        </div>
        <p className="text-[11.5px] leading-relaxed text-neutral-500">{body}</p>
        <div className="flex-1 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
          {visual}
        </div>
      </div>
    </motion.div>
  )
}

/*  Video Tile  */
function VideoTile({
  name,
  role,
  gradient,
  emoji,
  isSpeaking,
  delay,
  inView,
}: {
  name: string
  role: string
  gradient: string
  emoji: string
  isSpeaking: boolean
  delay: number
  inView: boolean
}) {
  const bars = [4, 7, 10, 7, 12, 9, 6, 10, 8, 5, 9, 7]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${gradient} flex flex-col border border-white/10 shadow-lg`}
      style={{ minHeight: 180 }}
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/40" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={
              isSpeaking
                ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 20px rgba(255,255,255,0.3)",
                      "0 0 0px rgba(255,255,255,0)",
                    ],
                  }
                : {}
            }
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl shadow-xl backdrop-blur-md"
          >
            {emoji}
          </motion.div>

          {isSpeaking && (
            <div className="flex h-6 items-end gap-[3px]">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-white"
                  animate={{
                    height: [`${h * 0.4}px`, `${h}px`, `${h * 0.4}px`],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5 + i * 0.05,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* name tag bottom aligned refined */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <div className="min-w-0">
          <p className="truncate text-[11px] leading-tight font-bold text-white">
            {name}
          </p>
          <p className="text-[9px] font-medium text-white/60">{role}</p>
        </div>
        {isSpeaking && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 whitespace-nowrap"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <span className="text-[8px] font-black tracking-wider text-emerald-300 uppercase">
              On Air
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/*  Consultant Section  */
const CONSULT_CHAT = [
  {
    role: "system",
    text: "MoodSphere flagged a consistent negative trend (7-day avg: −0.68). Student consented to connect with a counselor.",
  },
  {
    role: "doctor",
    name: "Dr. Priya Sharma",
    text: "Hi! I've reviewed your mood trends from MoodSphere. I can see you've been struggling with sleep and exam stress. How are you feeling today?",
  },
  {
    role: "student",
    name: "Rahul Mehta",
    text: "Honestly overwhelmed. It feels like no matter what I do, I can't keep up.",
  },
  {
    role: "doctor",
    name: "Dr. Priya Sharma",
    text: "That feeling is completely valid. Your data shows a pattern of late sleep on exam days. Let's work on a personalised plan together. When are you free for a 30-min session?",
  },
]

function ConsultantSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  const consultants = [
    {
      name: "Dr. Priya Sharma",
      spec: "Academic Stress & Anxiety",
      slots: "3 slots today",
      rating: "4.9",
      avatar: "👩‍⚕️",
      badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      name: "Dr. Arjun Nair",
      spec: "Sleep & Burnout Therapy",
      slots: "2 slots today",
      rating: "4.8",
      avatar: "👨‍⚕️",
      badge: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      name: "Dr. Meera Iyer",
      spec: "Emotional Wellbeing & CBT",
      slots: "Tomorrow",
      rating: "5.0",
      avatar: "👩‍⚕️",
      badge: "bg-purple-50 text-purple-600 border-purple-200",
    },
  ]

  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl border-x border-neutral-200 px-6 py-20">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-4 text-[11px] font-bold tracking-[0.28em] text-orange-500 uppercase">
            Campus Counseling
          </p>
          <h2 className="mb-4 text-4xl leading-[1.06] font-semibold tracking-tighter text-neutral-800 md:text-5xl">
            When the AI says{" "}
            <span className="text-orange-500">"talk to someone"</span>
          </h2>
          <p className="text-[14px] leading-relaxed text-neutral-500">
            If MoodSphere detects a consistent negative trend, it proactively
            suggests campus counseling resources — gently and privately.
            Students can browse and book a session directly.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: consultant cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5">
              <span className="text-sm">⚠️</span>
              <p className="text-[11px] font-semibold text-orange-700">
                MoodSphere detected a 7-day negative trend for this student.
                Proactively suggesting counseling…
              </p>
            </div>

            {consultants.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-2xl">
                  {c.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-bold text-neutral-800">
                      {c.name}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[8.5px] font-bold ${c.badge}`}
                    >
                      ★ {c.rating}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {c.spec}
                  </p>
                  <p className="mt-1 text-[9.5px] font-semibold text-emerald-600">
                    {c.slots}
                  </p>
                </div>
                <button
                  key={i}
                  className={`shrink-0 rounded-xl bg-linear-to-r from-orange-400 to-orange-500 px-4 py-2 text-[10.5px] font-semibold text-white`}
                >
                  Book
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Video Conference UI */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900"
            style={{ minHeight: 380 }}
          >
            {/* top bar */}
            <div className="flex shrink-0 items-center justify-between bg-neutral-800/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-2 w-2 rounded-full bg-red-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
                <span className="text-[10px] font-bold text-white">
                  Live Video Session
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                  🔒 E2E Encrypted
                </span>
                <span className="text-[9px] font-semibold text-neutral-400">
                  12:34
                </span>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-2 p-3">
              {/* Doctor feed */}
              <VideoTile
                name="Dr. Priya Sharma"
                role="Campus Counselor"
                gradient="from-blue-600 to-blue-800"
                emoji="👩‍⚕️"
                isSpeaking={true}
                delay={0.2}
                inView={inView}
              />
              {/* Student feed */}
              <VideoTile
                name="Rahul Mehta"
                role="Student"
                gradient="from-orange-500 to-orange-700"
                emoji="🎓"
                isSpeaking={false}
                delay={0.35}
                inView={inView}
              />
            </div>

            {/* controls */}
            <div className="flex shrink-0 items-center justify-center gap-3 bg-neutral-800/60 px-4 py-3">
              {[
                {
                  icon: "M",
                  label: "Mute",
                  active: false,
                  color: "bg-neutral-700",
                },
                {
                  icon: "V",
                  label: "Cam",
                  active: false,
                  color: "bg-neutral-700",
                },
                { icon: "✕", label: "End", active: true, color: "bg-red-500" },
              ].map((btn, i) => (
                <button
                  key={i}
                  className={`h-9 w-9 rounded-full ${btn.color} flex items-center justify-center`}
                >
                  {btn.icon === "✕" ? (
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  ) : btn.icon === "M" ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path
                        d="M19 10v2a7 7 0 0 1-14 0v-2"
                        stroke="white"
                        fill="none"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.893L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/*  Stats   */
function StatsStrip() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const stats = [
    { val: "50K+", label: "Active students", color: "#f97316" },
    { val: "4.9★", label: "App rating", color: "#d97706" },
    { val: "12M+", label: "Journal entries logged", color: "#059669" },
    { val: "89%", label: "Feel better in 2 weeks", color: "#3b82f6" },
  ]
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: 0.2 }}
      className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 md:grid-cols-4 md:divide-y-0">
        {stats.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center px-6 py-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                delay: 0.3 + i * 0.08,
                duration: 0.4,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="mb-1 text-2xl leading-none font-black tracking-tight"
              style={{ color: s.color }}
            >
              {s.val}
            </motion.div>
            <span className="text-[11px] font-medium text-neutral-400">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/*  Main Export  */
export function FeaturesSection() {
  const features = [
    {
      tag: "Journaling",
      icon: "📓",
      title: "Text & Voice Journals",
      body: "Write journal entries or record voice notes. Speech-to-Text API auto-transcribes voice memos into searchable, encrypted text.",
      accentColor: "#f97316",
      stat: { value: "STT", label: "transcription" },
      visual: <VoiceWave />,
    },
    {
      tag: "Sentiment Analysis",
      icon: "🧮",
      title: "NLP Mood Scoring",
      body: "Every entry is analyzed using VADER NLP to generate a mood score from -1 to +1, stored securely with AES-256 encryption.",
      accentColor: "#d97706",
      stat: { value: "-1→+1", label: "score range" },
      visual: <EncryptedStorage />,
    },
    {
      tag: "Dashboard",
      icon: "📈",
      title: "Private Mood Trend Dashboard",
      body: "A personal line chart showing your daily NLP scores. Spot patterns, track progress, and understand your emotional landscape over time.",
      accentColor: "#059669",
      stat: { value: "7-day", label: "trend view" },
      visual: <MoodScoreChart />,
    },
    {
      tag: "AI Companion",
      icon: "🧠",
      title: "Proactive AI Resource Bot",
      body: "When a consistent 7-day negative trend is detected, the AI gently suggests campus counseling resources — proactively, not reactively.",
      accentColor: "#3b82f6",
      stat: { value: "24/7", label: "always on" },
      visual: <AIChatDemo />,
    },
  ]

  return (
    <>
      <section id="features" className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl border-x border-neutral-200 px-6 py-20">
          {/* heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <p className="mb-4 text-[11px] font-bold tracking-[0.28em] text-orange-500 uppercase">
              Core Features
            </p>
            <h2 className="mb-4 text-4xl leading-[1.06] font-semibold tracking-tighter text-neutral-800 md:text-5xl">
              Your mental health,{" "}
              <span className="text-orange-500">understood.</span>
            </h2>
            <p className="text-[14px] leading-relaxed text-neutral-500">
              A secure, private journaling app with AI-powered sentiment
              analysis — built to surface insights before stress becomes
              disengagement.
            </p>
          </motion.div>

          {/* 2×2 feature grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.07} />
            ))}
          </div>

          <StatsStrip />
        </div>
      </section>

      <ConsultantSection />
    </>
  )
}
