"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"


const T = {
  orange:   "#F97316",
  orange6:  "#EA580C",
  orange4:  "#FB923C",
  orange3:  "#FDBA74",
  orange2:  "#FED7AA",
  orangeBg: "#FFF7ED",
  orangeB:  "#FFEDD5",
  text:     "#171717",
  muted:    "#737373",
  soft:     "#A3A3A3",
  border:   "#E5E7EB",
  surface:  "#FAFAFA",
  green:    "#10B981",
  blue:     "#3B82F6",
  rose:     "#F43F5E",
}


const STEPS = [
  {
    id: "a",
    icon: "🔐",
    tag:  "Secure Login",
    title: "Private & Encrypted Account",
    body:  "Create a secure account with encrypted credentials. Your data is yours — no third-party sharing, ever.",
    accent: T.orange,
    miniUI: <LoginMini />,
  },
  {
    id: "b",
    icon: "📓",
    tag:  "Journaling",
    title: "Write or Record Your Thoughts",
    body:  "Log daily mood entries as rich text or tap the mic to capture a voice note — whichever feels most natural.",
    accent: T.orange4,
    miniUI: <JournalMini />,
  },
  {
    id: "c",
    icon: "🎙️",
    tag:  "Speech-to-Text",
    title: "Voice Notes Auto-Transcribed",
    body:  "Our Speech-to-Text engine converts your voice memos into searchable, encrypted text in real time.",
    accent: "#8B5CF6",
    miniUI: <STTMini />,
  },
  {
    id: "d",
    icon: "🧮",
    tag:  "NLP Analysis",
    title: "Mood Score via Sentiment AI",
    body:  "Every entry is processed by VADER NLP to produce a mood score from −1 (very negative) to +1 (very positive).",
    accent: T.blue,
    miniUI: <NLPMini />,
  },
  {
    id: "e",
    icon: "🔒",
    tag:  "Encrypted Storage",
    title: "AES-256 Secure Logging",
    body:  "Scores and entries are logged with AES-256 encryption at rest. Only you hold the key to your emotional data.",
    accent: T.green,
    miniUI: <EncryptMini />,
  },
  {
    id: "f",
    icon: "📈",
    tag:  "Dashboard",
    title: "Private Mood Trend Dashboard",
    body:  "A personal line chart surfaces daily NLP scores over time — helping you spot patterns and track your emotional arc.",
    accent: T.orange6,
    miniUI: <DashMini />,
  },
  {
    id: "g",
    icon: "🧠",
    tag:  "AI Companion",
    title: "Proactive Counseling Suggestions",
    body:  "If a 7-day negative trend is detected, MoodSphere gently and privately suggests campus counseling resources.",
    accent: T.rose,
    miniUI: <BotMini />,
  },
]



function LoginMini() {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 400); return () => clearTimeout(t) }, [])
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200">
        <span className="text-[11px] text-neutral-400 flex-1">student@university.edu</span>
        <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">✓ Verified</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200">
        <span className="text-[11px] text-neutral-400 flex-1">••••••••••</span>
        <span className="text-[10px]">🔒</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }} animate={show ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-3 py-2 rounded-xl border border-orange-200 bg-orange-50">
        <span className="text-[10px] font-semibold text-orange-600">🛡️ E2E Encrypted Session</span>
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </motion.div>
    </div>
  )
}

function JournalMini() {
  const [text, setText] = useState("")
  const full = "Today was tough — exams back to back, barely slept…"
  useEffect(() => {
    if (text.length >= full.length) return
    const t = setTimeout(() => setText(full.slice(0, text.length + 1)), 42)
    return () => clearTimeout(t)
  }, [text])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {["📝 Text", "🎙️ Voice"].map((m, i) => (
            <span key={i} className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${i===0 ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>{m}</span>
          ))}
        </div>
      </div>
      <div className="min-h-16 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 leading-relaxed">
        {text}
        {text.length < full.length && <span className="inline-block w-0.5 h-3 ml-0.5 align-middle rounded-sm bg-orange-400 animate-pulse" />}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-neutral-400">Mood tag:</span>
        {["😔 Stressed","😴 Tired"].map((tag, i) => (
          <span key={i} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">{tag}</span>
        ))}
      </div>
    </div>
  )
}

function STTMini() {
  const bars = [3,6,9,12,8,14,10,7,12,9,5,11,8,6,10,13,7,9,11,6]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-50 border border-purple-100">
        <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" fill="none" strokeWidth="2"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-[9.5px] font-bold text-neutral-700">Recording…</p>
          <div className="flex items-end gap-0.5 h-4 mt-1">
            {bars.map((h, i) => (
              <motion.div key={i} className="w-[2.5px] rounded-full bg-purple-400"
                animate={{ height: [`${h*0.5}px`, `${h}px`, `${h*0.5}px`] }}
                transition={{ repeat: Infinity, duration: 0.8 + i * 0.04, ease: "easeInOut" }} />
            ))}
          </div>
        </div>
        <span className="text-[9px] font-bold text-purple-500">00:18</span>
      </div>
      <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
        <p className="text-[9px] font-bold text-blue-600 mb-1">📝 Transcript (live)</p>
        <p className="text-[10px] text-neutral-600 italic">&quot;I&apos;ve been really anxious about the exam results...&quot;</p>
      </div>
    </div>
  )
}

function NLPMini() {
  const score = -0.62
  const words = [
    { w: "anxious", s: -0.7, col: "#F43F5E" },
    { w: "tired", s: -0.5, col: "#FB923C" },
    { w: "hopeful", s: 0.6, col: "#10B981" },
    { w: "stressed", s: -0.8, col: "#F43F5E" },
  ]
  const col = score >= 0 ? T.green : score > -0.5 ? T.orange : T.rose
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1.5">
        {words.map((w, i) => (
          <span key={i} className="text-[9.5px] font-bold px-2 py-0.5 rounded-full border"
            style={{ background: `${w.col}12`, borderColor: `${w.col}30`, color: w.col }}>
            {w.w} <span className="opacity-60">{w.s}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
        <div className="flex flex-col items-center">
          <span className="text-[22px] font-black leading-none" style={{ color: col }}>{score.toFixed(2)}</span>
          <span className="text-[8px] text-neutral-400 mt-0.5">VADER score</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[8px] text-neutral-400 mb-1">
            <span>−1</span><span>0</span><span>+1</span>
          </div>
          <div className="relative h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div className="absolute inset-y-0 left-0 right-0 bg-linear-to-r from-rose-400 via-orange-300 to-green-400 rounded-full" />
            <motion.div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow-sm"
              style={{ borderColor: col }}
              animate={{ left: `${((score + 1) / 2) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }} />
          </div>
          <div className="text-[8.5px] font-bold mt-1" style={{ color: col }}>
            {score >= 0 ? "😊 Positive" : score > -0.5 ? "😐 Neutral" : "😔 Negative"}
          </div>
        </div>
      </div>
    </div>
  )
}

function EncryptMini() {
  const rows = [
    { label: "Journal entry",  val: "a3f8…c21d", icon: "📝", col: T.green  },
    { label: "Mood score",     val: "−0.62 → 🔒", icon: "🧮", col: T.blue   },
    { label: "Voice memo",     val: "b7d2…9e3a", icon: "🎙️", col: "#8B5CF6" },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-200">
        <span className="text-[10px]">🛡️</span>
        <span className="text-[9.5px] font-bold text-green-700">AES-256 Encryption Active</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      </div>
      {rows.map((r, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.1 }}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-neutral-50 border border-neutral-100">
          <span className="text-sm">{r.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[9.5px] font-semibold text-neutral-600">{r.label}</p>
            <p className="text-[8.5px] font-mono text-neutral-400">{r.val}</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.col }} />
        </motion.div>
      ))}
    </div>
  )
}

function DashMini() {
  const pts = [-0.4, 0.2, -0.6, -0.1, 0.5, 0.7, 0.3]
  const W = 220, H = 70, pad = 10
  const toX = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2)
  const toY = (v: number) => H / 2 - v * (H / 2 - 6)
  const d = pts.map((v, i) => {
    const x = toX(i), y = toY(v)
    if (!i) return `M${x},${y}`
    const px = toX(i - 1), py = toY(pts[i - 1]), cx = (px + x) / 2
    return `C${cx},${py} ${cx},${y} ${x},${y}`
  }).join(" ")
  const area = d + ` L${toX(pts.length-1)},${H} L${toX(0)},${H} Z`
  const days = ["M","T","W","T","F","S","S"]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-bold text-neutral-500">7-Day Mood Line</span>
        <span className="text-[8.5px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">−1 → +1</span>
      </div>
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-2 overflow-hidden">
        <svg width="100%" viewBox={`0 0 ${W} ${H+16}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.orange} stopOpacity="0.18" />
              <stop offset="100%" stopColor={T.orange} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* zero line */}
          <line x1={pad} y1={H/2} x2={W-pad} y2={H/2} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 3" />
          {/* area */}
          <path d={area} fill="url(#dg)" />
          {/* line */}
          <motion.path d={d} fill="none" stroke={T.orange} strokeWidth="2.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
            viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16,1,0.3,1] }} />
          {/* dots */}
          {pts.map((v, i) => (
            <motion.circle key={i} cx={toX(i)} cy={toY(v)} r="3.5"
              fill={v >= 0 ? T.orange : T.rose} stroke="white" strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.3, ease: [0.34,1.56,0.64,1] }} />
          ))}
          {/* day labels */}
          {days.map((d, i) => (
            <text key={i} x={toX(i)} y={H + 13} textAnchor="middle"
              style={{ fontSize: 8, fontWeight: 700, fill: "#A3A3A3" }}>{d}</text>
          ))}
        </svg>
      </div>
    </div>
  )
}

function BotMini() {
  const msgs = [
    { role: "ai",   text: "7-day avg is −0.68. Detected consistent low trend 📊" },
    { role: "ai",   text: "Want me to suggest campus counselors nearby? 💙" },
    { role: "user", text: "Yes please." },
    { role: "ai",   text: "Found Dr. Priya Sharma — available today 🌿" },
  ]
  const [shown, setShown] = useState(1)
  useEffect(() => {
    if (shown >= msgs.length) return
    const t = setTimeout(() => setShown(s => s + 1), 900)
    return () => clearTimeout(t)
  }, [shown, msgs.length])

  return (
    <div className="flex flex-col gap-2 min-h-30">
      <AnimatePresence>
        {msgs.slice(0, shown).map((m, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[90%] px-2.5 py-1.5 text-[9.5px] leading-relaxed rounded-xl ${
              m.role === "ai"
                ? "bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-tl-sm"
                : "bg-linear-to-br from-rose-500 to-rose-600 text-white rounded-tr-sm"
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/*  Step Card */
function StepCard({ step, index, total }: { step: typeof STEPS[0]; index: number; total: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const isEven = index % 2 === 0

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: isEven ? -28 : 28 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative grid md:grid-cols-[1.05fr_0.95fr] gap-0 rounded-3xl overflow-hidden border border-[#EFE7DB] bg-[#FFFEFC]
        shadow-[0_2px_14px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300`}>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ background: `linear-gradient(to right, ${step.accent}75, transparent)` }}
      />

      {/* Info side */}
      <div className={`flex flex-col justify-center gap-4 p-6 md:p-7 ${isEven ? "md:order-1" : "md:order-2"}`}
        style={{ borderRight: isEven ? "1px solid #F3ECE1" : "none", borderLeft: !isEven ? "1px solid #F3ECE1" : "none" }}>

        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          <span>Step {index + 1}</span>
          <span>{String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
        </div>

        {/* Step badge + tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black text-white shrink-0"
            style={{ background: step.accent }}>
            {String.fromCharCode(96 + index + 1).toUpperCase()}
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.22em]" style={{ color: step.accent }}>
            {step.tag}
          </span>
        </div>

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${step.accent}12`, border: `1px solid ${step.accent}22` }}>
            {step.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] md:text-[16px] font-bold text-neutral-900 leading-snug tracking-tight">{step.title}</h3>
            <p className="text-[12px] md:text-[12.5px] leading-relaxed text-neutral-500 mt-1.5">{step.body}</p>
          </div>
        </div>

        {/* Step counter */}
        <div className="flex items-center gap-2 mt-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 20 : 6,
                background: i === index ? step.accent : "#E5E7EB",
              }} />
          ))}
        </div>
      </div>

      {/* Visual side */}
      <div className={`relative flex items-center justify-center p-5 md:p-6 ${isEven ? "md:order-2" : "md:order-1"}`}
        style={{ background: `linear-gradient(145deg, ${step.accent}06, #FFFEFC)` }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${step.accent}10, transparent 44%)` }}
        />
        <div className="w-full max-w-70">
          {/* Card shell */}
          <div className="rounded-2xl border border-[#F0EADF] bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Mini header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F5EFE6] bg-[#FFFCF8]">
              <div className="flex gap-1">
                {["#FF5F57","#FEBC2E","#28C840"].map(c => (
                  <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-[9px] font-semibold text-neutral-400 flex-1 text-center">MoodSphere · {step.tag}</span>
            </div>
            {/* Mini UI */}
            <div className="p-3">
              {step.miniUI}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/*  Progress sidebar  */
function StepNav({ activeIdx }: { activeIdx: number }) {
  const progress = ((activeIdx + 1) / STEPS.length) * 100

  return (
    <div className="hidden xl:flex flex-col gap-2 sticky top-24 h-fit rounded-2xl border border-[#F3EBDD] bg-[#FFFEFC]/95 backdrop-blur px-2.5 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      <div className="px-1 pb-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400">Flow Progress</p>
        <div className="mt-2 h-1.5 rounded-full bg-[#F8F1E6] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-orange-200 to-rose-300"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
      {STEPS.map((s, i) => (
        <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-200 ${i === activeIdx ? "bg-[#FFFAF2] border-[#F6E5CE]" : "bg-transparent border-transparent"}`}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
            style={{ background: i <= activeIdx ? s.accent : "#E5E7EB" }}>
            {i <= activeIdx ? "✓" : i + 1}
          </div>
          <span className={`text-[10.5px] font-semibold ${i === activeIdx ? "text-neutral-800" : "text-neutral-400"}`}>{s.tag}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Section ────────────────────────────────────────────── */
export function HowItWorksSection() {
  const [activeIdx, setActiveIdx] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(i) },
        { threshold: 0.5, rootMargin: "-10% 0px -30% 0px" }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  return (
    <section id="how-it-works" className="relative border-b border-[#F2EBDD] bg-linear-to-b from-[#FFFDFC] via-[#FFFAF5] to-[#FFFEFC]">
      {/* Subtle grid bg */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: "linear-gradient(#737373 1px, transparent 1px), linear-gradient(90deg, #737373 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative mx-auto max-w-6xl border-x border-[#F2EBDD] px-5 md:px-6 py-20">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-16 max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-4">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-semibold leading-[1.06] tracking-tighter text-neutral-800 mb-4">
            Seven steps to{" "}
            <span className="text-orange-500">understand yourself</span>
          </h2>
          <p className="text-[14px] leading-relaxed text-neutral-500">
            From secure login to proactive counseling — every step is private, consent-led, and powered by AI.
          </p>

          {/* Step pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-3xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-bold"
                style={{ background: `${s.accent}0C`, borderColor: `${s.accent}25`, color: s.accent }}>
                <span>{s.icon}</span>
                <span>{s.tag}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Body — sticky nav + cards */}
        <div className="xl:grid xl:grid-cols-[176px_1fr] gap-8 items-start">
          <StepNav activeIdx={activeIdx} />

          <div className="relative flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div key={step.id} ref={(el) => { stepRefs.current[i] = el }} className="relative">
                <StepCard step={step} index={i} total={STEPS.length} />
                {i < STEPS.length - 1 && (
                  <div className="relative h-8">
                    <motion.div
                      initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }} transition={{ duration: 0.35 }}
                      className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-8 origin-top"
                      style={{ background: `linear-gradient(to bottom, ${step.accent}38, ${STEPS[i+1].accent}38)` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  )
}