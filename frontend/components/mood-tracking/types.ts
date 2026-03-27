export type Phase = "landing" | "session" | "analyzing" | "results"
export type RiskLevel = "low" | "medium" | "high"

export interface ChatMsg { 
  role: "user" | "ai"
  text: string
  ts: number 
}

export interface SessionDetailMessage {
  userMessage: string
  aiResponse?: string
  textScore: number
  voiceScore: number
  faceScore: number
  finalScore: number
  emotion: string
  timestamp?: string
}

export interface SessionDetails {
  id: string
  sessionDuration?: number
  status: string
  startedAt?: string
  endedAt?: string
  finalMood: string
  finalScore: number
  riskLevel: RiskLevel
  averageTextScore: number
  averageVoiceScore: number
  averageFaceScore: number
  messagesCount: number
  messages: SessionDetailMessage[]
}

export interface MoodResult {
  sessionId?: string
  finalScore: number
  textScore: number
  voiceScore: number
  faceScore: number
  emotion: string
  riskLevel: RiskLevel
  summary: string
  suggestions: string[]
  details?: SessionDetails
}
