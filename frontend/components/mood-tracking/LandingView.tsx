"use client"
import { motion } from "framer-motion"
import { Mic, Camera, Brain, ArrowRight, ShieldCheck } from "lucide-react"

interface LandingViewProps {
  onStart: () => void
}

export function LandingView({ onStart }: LandingViewProps) {
  return (
    <div className="w-full min-h-full bg-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        backgroundSize: "28px 28px", opacity: 0.6
      }} />
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-white to-transparent pointer-events-none z-10" />

      {/* Glow spot */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-lg w-full relative z-20"
      >
        {/* Status pill */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-10"
          style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>AI companion ready</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(38px, 5vw, 54px)",
            fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.045em",
            lineHeight: 1.08, marginBottom: 18
          }}
        >
          Understand how<br />
          you feel, <em style={{ fontStyle: "italic", color: "#f97316" }}>right now.</em>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.75, maxWidth: 420, marginBottom: 44 }}>
          An AI that listens to your voice, reads your expressions, and talks with you — giving you genuine emotional insight in minutes.
        </motion.p>

        {/* Feature trio */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 w-full mb-10">
          {[
            { icon: <Mic size={16} className="text-orange-400" />, label: "Voice analysis", sub: "Tone & stress detection" },
            { icon: <Camera size={16} className="text-blue-400" />, label: "Facial cues", sub: "Expression mapping" },
            { icon: <Brain size={16} className="text-violet-400" />, label: "AI dialogue", sub: "Real-time conversation" },
          ].map(f => (
            <motion.div key={f.label} whileHover={{ y: -2 }}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl text-center"
              style={{ background: "white", border: "1px solid #f3f4f6", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#fafafa", border: "1px solid #f3f4f6" }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{f.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA block */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
          className="w-full max-w-xs flex flex-col items-center gap-3">
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.015, boxShadow: "0 12px 36px rgba(249,115,22,0.22)" }}
            whileTap={{ scale: 0.985 }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-semibold text-sm"
            style={{
              background: "linear-gradient(160deg, #fb923c 0%, #f97316 40%, #ea580c 100%)",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 20px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
            }}
          >
            <Mic size={15} />
            Begin Check-in
            <ArrowRight size={14} />
          </motion.button>

          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-green-500" />
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Private · Never stored without consent · ~5 mins</span>
          </div>
        </motion.div>

        {/* Social row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="flex items-center gap-2 mt-10">
          <div className="flex -space-x-1.5">
            {["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>1,200+ sessions this week</span>
        </motion.div>
      </motion.div>
    </div>
  )
}
