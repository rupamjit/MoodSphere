"use client"
import { motion } from "framer-motion"
import { RotateCcw, CheckCircle2, Activity, AlertCircle, TrendingUp, TrendingDown, Sparkles } from "lucide-react"
import { MoodResult } from "./types"
import { fmt } from "./utils"
import { ScoreArc } from "./ScoreArc"

interface ResultsViewProps {
  result: MoodResult
  elapsed: number
  responseCount: number
  onReset: () => void
}

const EMOTION_HINT: Record<string, { icon: string; text: string }> = {
  Calm: { icon: "😌", text: "Relaxed and centred energy" },
  Anxious: { icon: "😟", text: "Some tension detected" },
  Stressed: { icon: "😰", text: "Elevated stress markers" },
  Hopeful: { icon: "🙂", text: "Positive emotional energy" },
  Reflective: { icon: "🤔", text: "Thoughtful, introspective" },
}

const RISK_STYLE = {
  low: {
    border: "#d1fae5",
    bg: "#f8fffe",
    title: "#10b981",
    heading: "#065f46",
    text: "#059669",
    label: "Emotional state looks balanced",
  },
  medium: {
    border: "#fef3c7",
    bg: "#fffdf5",
    title: "#f59e0b",
    heading: "#92400e",
    text: "#b45309",
    label: "Some areas deserve attention",
  },
  high: {
    border: "#fee2e2",
    bg: "#fffafa",
    title: "#ef4444",
    heading: "#991b1b",
    text: "#b91c1c",
    label: "Professional support recommended",
  },
} as const

export function ResultsView({ result, elapsed, responseCount, onReset }: ResultsViewProps) {
  const emotion = EMOTION_HINT[result.emotion] || { icon: "🙂", text: "Steady, balanced state" }
  const risk = RISK_STYLE[result.riskLevel]

  return (
    <div className="w-full min-h-full overflow-auto bg-linear-to-b from-white to-orange-50/30">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 md:mb-10">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase" }}>Session complete</span>
            </div>
            <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 38, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Your mood report
            </h1>
            <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              {fmt(elapsed)} · {responseCount} responses captured
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={onReset}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
            style={{ border: "1px solid #e5e7eb", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", cursor: "pointer", color: "#374151", fontFamily: "inherit", fontWeight: 600 }}>
            <RotateCcw size={12} />New session
          </motion.button>
        </div>

        {/* ── Top 3 cards ── */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-12">

          {/* Arc score */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center rounded-2xl p-5 md:col-span-3"
            style={{ border: "1px solid #f3f4f6", background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)" }}>
            <ScoreArc score={result.finalScore} size={128} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af", marginTop: 4 }}>Overall mood</span>
          </motion.div>

          {/* Emotion */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 md:col-span-5"
            style={{ border: "1px solid #ffedd5", background: "linear-gradient(150deg, #fffdf9 0%, #fffbf5 70%)", boxShadow: "0 6px 20px rgba(234, 88, 12, 0.08)" }}>
            <div className="absolute right-4 top-4 select-none text-5xl opacity-10">
              {emotion.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fb923c", letterSpacing: "0.1em", textTransform: "uppercase" }}>Detected emotion</span>
            <div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 36, fontWeight: 800, color: "#9a3412", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 6 }}>
                {result.emotion}
              </div>
              <p style={{ fontSize: 12, color: "#c2410c", lineHeight: 1.5 }}>
                {emotion.text}
              </p>
            </div>
          </motion.div>

          {/* Risk */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="flex flex-col justify-between rounded-2xl p-6 md:col-span-4"
            style={{ border: `1px solid ${risk.border}`, background: risk.bg, boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: risk.title
            }}>Risk level</span>
            <div>
              <div className="flex items-center gap-2 mb-2">
                {result.riskLevel === "low" ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : result.riskLevel === "medium" ? <Activity size={18} className="text-amber-500" />
                  : <AlertCircle size={18} className="text-red-500" />}
                <span style={{
                  fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em",
                  textTransform: "capitalize",
                  color: risk.heading
                }}>{result.riskLevel}</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: risk.text }}>{risk.label}</p>
            </div>
          </motion.div>
        </div>

        {/* ── Signal bars ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Voice tone", val: result.voiceScore, color: "#8b5cf6", bg: "#f5f3ff", border: "#ede9fe", track: "#ede9fe" },
            { label: "Facial cues", val: result.faceScore, color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe", track: "#dbeafe" },
            { label: "Text sentiment", val: result.textScore, color: "#f97316", bg: "#fff7ed", border: "#fed7aa", track: "#ffedd5" },
          ].map(({ label, val, color, bg, border, track }) => (
            <div key={label} className="rounded-2xl p-5" style={{ border: `1px solid ${border}`, background: bg, boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)" }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 12, fontWeight: 500, color: "#374151" }}>{label}</span>
                <span style={{ fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{val}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: track }}>
                <motion.div className="h-full rounded-full" style={{ background: color }}
                  initial={{ width: 0 }} animate={{ width: `${val}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }} />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {val >= 65 ? <TrendingUp size={9} style={{ color }} /> : <TrendingDown size={9} style={{ color }} />}
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{val >= 65 ? "Above baseline" : "Below baseline"}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Summary + Suggestions ── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
            className="rounded-2xl p-6" style={{ border: "1px solid #f3f4f6", background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)", boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={12} className="text-orange-400" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>AI summary</span>
            </div>
            <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>{result.summary}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            className="rounded-2xl p-6" style={{ border: "1px solid #f3f4f6", background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)", boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>Suggestions</span>
            </div>
            <ol className="flex flex-col gap-3">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: "#f97316", background: "#fff7ed",
                    border: "1px solid #fed7aa", borderRadius: 9999, width: 18, height: 18,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7 }}>{s}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
