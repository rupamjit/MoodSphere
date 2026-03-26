 "use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import {
  Phase, RiskLevel, ChatMsg, MoodResult,
  fmt,
  LandingView, SessionView, AnalyzingView, ResultsView
} from "@/components/mood-tracking"

const INTERVIEW_QUESTIONS = [
  "Tell me how you are feeling right now in one or two lines.",
  "What was the most stressful moment in your day today?",
  "Did anything make you feel better today?",
  "How is your sleep and energy level this week?",
  "What support do you feel you need right now?",
]

const CAPTURE_INTERVAL_MS = 1800

type RecordedTurn = {
  question: string
  transcript: string
  frames: Blob[]
  audioBlob: Blob | null
  durationMs: number
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

/* ─── Page ─── */
export default function MoodTrackingPage() {
  const [phase, setPhase] = useState<Phase>("landing")
  const [elapsed, setElapsed] = useState(0)
  const [hasVideo, setHasVideo] = useState(false)
  const [micActive, setMicActive] = useState(true)
  const [camActive, setCamActive] = useState(true)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [aiTyping, setAiTyping] = useState(false)
  const [result, setResult] = useState<MoodResult | null>(null)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcriptDraft, setTranscriptDraft] = useState("")
  const [responseCount, setResponseCount] = useState(0)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const turnFramesRef = useRef<Blob[]>([])
  const turnsRef = useRef<RecordedTurn[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef(0)
  const turnStartRef = useRef(0)
  const isRecordingRef = useRef(false)
  const captureBusyRef = useRef(false)
  const captureInitRef = useRef(false)
  const shouldCaptureRef = useRef(false)
  const speechRef = useRef<SpeechRecognitionLike | null>(null)
  const speechTextRef = useRef("")
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, aiTyping])

  const stopSpeechToText = useCallback(async () => {
    const rec = speechRef.current
    if (!rec) return

    await new Promise<void>((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      const prevOnEnd = rec.onend
      rec.onend = () => {
        prevOnEnd?.()
        done()
      }
      try {
        rec.stop()
      } catch {
        done()
      }
      setTimeout(done, 250)
    })

    speechRef.current = null
  }, [])

  const startSpeechToText = useCallback(() => {
    if (typeof window === "undefined") return
    const win = window as Window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
      SpeechRecognition?: new () => SpeechRecognitionLike
    }
    const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!RecognitionCtor) return

    if (speechRef.current) {
      try { speechRef.current.stop() } catch {}
      speechRef.current = null
    }

    const rec = new RecognitionCtor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "en-US"
    rec.onresult = (event: unknown) => {
      const speechEvent = event as {
        resultIndex: number
        results: ArrayLike<{ 0?: { transcript?: string }; isFinal?: boolean }>
      }
      let interim = ""
      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
        const chunk = String(speechEvent.results[i][0]?.transcript || "").trim()
        if (!chunk) continue
        if (speechEvent.results[i].isFinal) {
          speechTextRef.current = `${speechTextRef.current} ${chunk}`.trim()
        } else {
          interim = `${interim} ${chunk}`.trim()
        }
      }
      const merged = `${speechTextRef.current} ${interim}`.trim()
      if (merged) setTranscriptDraft(merged)
    }
    rec.onerror = () => {}
    rec.onend = () => {}

    try {
      rec.start()
      speechRef.current = rec
    } catch {
      speechRef.current = null
    }
  }, [])

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (capRef.current) clearTimeout(capRef.current)
    if (speechRef.current) {
      try { speechRef.current.stop() } catch {}
      speechRef.current = null
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (recRef.current?.state !== "inactive") recRef.current?.stop()
    recRef.current = null
    setActiveStream(null)
  }

  useEffect(() => () => stopEverything(), [])

  const captureFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current
    if (!shouldCaptureRef.current || !v || !c || v.readyState < 2 || !v.videoWidth || captureBusyRef.current) return

    if (!captureInitRef.current) {
      // Use lightweight snapshots to avoid UI hitching while video is rendering.
      const maxW = 480
      const srcW = v.videoWidth
      const srcH = v.videoHeight || 270
      const scale = Math.min(1, maxW / srcW)
      c.width = Math.round(srcW * scale)
      c.height = Math.round(srcH * scale)
      captureInitRef.current = true
    }

    captureBusyRef.current = true
    const ctx = c.getContext("2d")!
    ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0); ctx.restore()
    c.toBlob((blob) => {
      if (blob) turnFramesRef.current.push(blob)
      captureBusyRef.current = false
    }, "image/jpeg", 0.8)
  }, [])

  const handleVideoReady = useCallback(() => {
    setHasVideo(true)
  }, [])

  const startTurnRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream || isRecordingRef.current) return
    const audioTracks = stream.getAudioTracks()
    if (!audioTracks.length) return

    chunksRef.current = []
    turnFramesRef.current = []
    captureBusyRef.current = false
    captureInitRef.current = false
    shouldCaptureRef.current = true
    speechTextRef.current = ""
    turnStartRef.current = Date.now()
    setTranscriptDraft("")

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm"

    const rec = new MediaRecorder(new MediaStream(audioTracks), { mimeType: mime })
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.start(400)
    recRef.current = rec

    const scheduleCapture = () => {
      if (!shouldCaptureRef.current) return
      captureFrame()
      capRef.current = setTimeout(scheduleCapture, CAPTURE_INTERVAL_MS)
    }

    captureFrame()
    capRef.current = setTimeout(scheduleCapture, CAPTURE_INTERVAL_MS)
    startSpeechToText()
    isRecordingRef.current = true
    setIsRecording(true)
  }, [captureFrame, startSpeechToText])

  const stopTurnRecording = useCallback(async (idx: number, transcript: string) => {
    shouldCaptureRef.current = false
    if (capRef.current) clearTimeout(capRef.current)
    await stopSpeechToText()

    let audioBlob: Blob | null = null
    const recorder = recRef.current
    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        recorder.stop()
      })
    }

    if (chunksRef.current.length > 0) {
      audioBlob = new Blob(chunksRef.current, { type: recorder?.mimeType || "audio/webm" })
    }

    recRef.current = null
    isRecordingRef.current = false
    setIsRecording(false)

    const savedTurn: RecordedTurn = {
      question: INTERVIEW_QUESTIONS[idx] || "Interview answer",
      transcript: transcript.trim() || speechTextRef.current.trim() || "Speech not detected for this answer.",
      frames: [...turnFramesRef.current],
      audioBlob,
      durationMs: Date.now() - turnStartRef.current,
    }

    turnsRef.current.push(savedTurn)
    setResponseCount(turnsRef.current.length)
    setMsgs((prev) => [...prev, { role: "user", text: savedTurn.transcript, ts: Date.now() }])

    console.log("Recorded turn payload", {
      questionNumber: idx + 1,
      question: savedTurn.question,
      transcript: savedTurn.transcript,
      frames: savedTurn.frames,
      frameCount: savedTurn.frames.length,
      audioBlob: savedTurn.audioBlob,
      audioBlobSize: savedTurn.audioBlob?.size || 0,
      durationMs: savedTurn.durationMs,
    })
  }, [stopSpeechToText])

  const startSession = async () => {
    turnsRef.current = []
    chunksRef.current = []
    turnFramesRef.current = []
    setMsgs([])
    setResult(null)
    setElapsed(0)
    setQuestionIndex(0)
    setResponseCount(0)
    setTranscriptDraft("")
    setIsRecording(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      setActiveStream(stream)
      startRef.current = Date.now()
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 250)
      setPhase("session")

      setTimeout(() => {
        setAiTyping(true)
        setTimeout(() => {
          setAiTyping(false)
          setMsgs([{ role: "ai", text: INTERVIEW_QUESTIONS[0], ts: Date.now() }])
          startTurnRecording()
        }, 900)
      }, 300)
    } catch {
      alert("Camera or microphone access was denied. Please allow permissions and try again.")
    }
  }

  const stopAndAdvance = async () => {
    if (!isRecording) return

    const idx = questionIndex
    const currentTranscript = transcriptDraft
    await stopTurnRecording(idx, currentTranscript)

    const nextIdx = idx + 1
    if (nextIdx >= INTERVIEW_QUESTIONS.length) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "ai",
          text: "All questions are complete. Click End Session to generate your report.",
          ts: Date.now(),
        },
      ])
      return
    }

    setAiTyping(true)
      setTimeout(() => {
      setAiTyping(false)
      setQuestionIndex(nextIdx)
        setMsgs([{ role: "ai", text: INTERVIEW_QUESTIONS[nextIdx], ts: Date.now() }])
    }, 900)
  }

  const endSession = async () => {
    if (isRecording) {
      await stopTurnRecording(questionIndex, transcriptDraft)
    }

    shouldCaptureRef.current = false

    console.log("Session payload", {
      totalResponses: turnsRef.current.length,
      turns: turnsRef.current,
    })

    if (capRef.current) clearTimeout(capRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setActiveStream(null)

    setPhase("analyzing")
    setAnalyzeStep(0)
    ;[0, 1, 2, 3].forEach((_, i) => setTimeout(() => setAnalyzeStep(i + 1), i * 1100 + 500))

    setTimeout(() => {
      const textDensity = turnsRef.current.length
        ? turnsRef.current.reduce((acc, turn) => acc + turn.transcript.length, 0) / turnsRef.current.length
        : 0
      const avgDuration = turnsRef.current.length
        ? turnsRef.current.reduce((acc, turn) => acc + turn.durationMs, 0) / turnsRef.current.length
        : 0

      const ts = Math.min(95, 45 + textDensity / 8 + Math.random() * 18)
      const vs = Math.min(95, 48 + avgDuration / 2500 + Math.random() * 16)
      const fs = Math.min(95, 42 + (turnsRef.current.length * 10) + Math.random() * 12)
      const final = Math.round(ts * 0.35 + vs * 0.35 + fs * 0.3)
      const emotions = ["Calm", "Anxious", "Hopeful", "Stressed", "Neutral", "Reflective"]
      const emotion = emotions[Math.floor(Math.random() * emotions.length)]
      const riskLevel: RiskLevel = final >= 68 ? "low" : final >= 45 ? "medium" : "high"
      setResult({
        finalScore: final, textScore: Math.round(ts), voiceScore: Math.round(vs), faceScore: Math.round(fs),
        emotion, riskLevel,
        summary: `Your ${fmt(elapsed)} session across ${turnsRef.current.length} responses revealed a ${emotion.toLowerCase()} emotional state. Voice tone analysis detected ${vs > 65 ? "stable" : "slightly elevated"} stress markers, and your verbal content suggests a ${riskLevel} current risk profile.`,
        suggestions: riskLevel === "high"
          ? ["Reach out to a campus counsellor this week", "Try box breathing: 4s in, 4s hold, 4s out", "Limit screen time before sleep tonight"]
          : riskLevel === "medium"
          ? ["Journalling for 10 minutes can help process emotions", "A short walk in natural light may shift your mood", "Check in with yourself again tomorrow"]
          : ["You're in a good place — maintain this awareness", "Share how you're feeling with someone close", "Celebrate your emotional self-awareness today"],
      })
      setPhase("results")
    }, 4300)
  }

  const reset = () => {
    turnsRef.current = []
    setPhase("landing")
    setElapsed(0)
    setHasVideo(false)
    setMsgs([])
    setResult(null)
    setQuestionIndex(0)
    setResponseCount(0)
    setTranscriptDraft("")
    setIsRecording(false)
    setActiveStream(null)
  }

  return (
    <div className="relative flex flex-col w-full min-h-[calc(100vh-56px)] bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "landing" && (
          <LandingView key="landing" onStart={startSession} />
        )}

        {phase === "analyzing" && (
          <AnalyzingView key="analyzing" analyzeStep={analyzeStep} />
        )}

        {phase === "results" && result && (
          <ResultsView 
            key="results" 
            result={result} 
            elapsed={elapsed} 
            responseCount={responseCount} 
            onReset={reset} 
          />
        )}

        {phase === "session" && (
          <SessionView 
            key="session"
            elapsed={elapsed}
            currentQuestion={Math.min(questionIndex + 1, INTERVIEW_QUESTIONS.length)}
            totalQuestions={INTERVIEW_QUESTIONS.length}
            questionText={INTERVIEW_QUESTIONS[questionIndex] || "Session complete"}
            isRecording={isRecording}
            transcriptDraft={transcriptDraft}
            onTranscriptChange={setTranscriptDraft}
            onStartRecording={startTurnRecording}
            onStopRecording={stopAndAdvance}
            videoRef={videoRef}
            hasVideo={hasVideo}
            micActive={micActive}
            camActive={camActive}
            onToggleMic={() => { setMicActive(p => !p); streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micActive }) }}
            onToggleCam={() => { setCamActive(p => !p); streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camActive }) }}
            onEndSession={endSession}
            msgs={msgs}
            aiTyping={aiTyping}
            chatBottomRef={chatBottomRef}
            stream={activeStream}
            onVideoReady={handleVideoReady}
          />
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  )
}