"use client"
import { motion } from "framer-motion"
import { Brain, CheckCircle2 } from "lucide-react"

interface AnalyzingViewProps {
  analyzeStep: number
}

export function AnalyzingView({ analyzeStep }: AnalyzingViewProps) {
  return (
    <div className="w-full min-h-full bg-white flex flex-col items-center justify-center px-8 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 max-w-xs text-center">

        {/* Spinner */}
        <div className="relative w-20 h-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{ borderWidth: "1.5px", borderStyle: "solid", borderColor: "transparent", borderTopColor: "#f97316", borderRightColor: "#fed7aa" }} />
          <div className="absolute inset-2.5 rounded-full flex items-center justify-center"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <Brain size={20} className="text-orange-500" />
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: "'Georgia', serif", fontSize: 24, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Analysing your session
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>voice tone · conversation · emotional cues</p>
        </div>

        <div className="flex flex-col gap-2.5 w-full text-left">
          {["Mapping facial expressions", "Analysing voice stress patterns", "Processing conversation sentiment", "Generating insight report"].map((label, i) => {
            const done = analyzeStep > i, active = analyzeStep === i
            return (
              <motion.div key={label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
                transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: done ? "#ecfdf5" : active ? "#fff7ed" : "#fafafa", border: `1px solid ${done ? "#a7f3d0" : active ? "#fed7aa" : "#e5e7eb"}` }}>
                  {done ? <CheckCircle2 size={10} className="text-emerald-500" />
                    : active ? <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-2 h-2 rounded-full bg-orange-400" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-neutral-200" />}
                </div>
                <span style={{ fontSize: 13, color: done ? "#374151" : active ? "#111827" : "#d1d5db", fontWeight: active ? 500 : 400 }}>{label}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
