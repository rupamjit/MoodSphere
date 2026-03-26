export type Phase = "landing" | "session" | "analyzing" | "results"
export type RiskLevel = "low" | "medium" | "high"

export interface ChatMsg { 
  role: "user" | "ai"
  text: string
  ts: number 
}

export interface MoodResult {
  finalScore: number
  textScore: number
  voiceScore: number
  faceScore: number
  emotion: string
  riskLevel: RiskLevel
  summary: string
  suggestions: string[]
}
