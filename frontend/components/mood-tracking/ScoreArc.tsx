"use client"
import { motion } from "framer-motion"

export function ScoreArc({ score, size = 140 }: { score: number; size?: number }) {
  const strokeW = 6, r = (size - strokeW * 2) / 2
  const cx = size / 2, cy = size / 2
  const startAngle = -220, totalArc = 260
  const endAngle = startAngle + (score / 100) * totalArc
  const toRad = (d: number) => (d * Math.PI) / 180
  const arc = (start: number, end: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) }
    const e = { x: cx + r * Math.cos(toRad(end)), y: cy + r * Math.sin(toRad(end)) }
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }
  const color = score >= 68 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444"

  return (
    <svg width={size} height={size}>
      <path d={arc(startAngle, startAngle + totalArc)} fill="none" stroke="#f3f4f6" strokeWidth={strokeW} strokeLinecap="round" />
      <motion.path d={arc(startAngle, endAngle)} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }} />
      <text x={cx} y={cy - 2} textAnchor="middle"
        style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: 30, fontWeight: 800, fill: "#111827" }}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontSize: 10, fill: "#9ca3af", letterSpacing: "0.1em" }}>SCORE</text>
    </svg>
  )
}
