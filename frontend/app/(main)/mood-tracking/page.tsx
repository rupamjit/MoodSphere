"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-context"
import {
  Phase, RiskLevel, ChatMsg, MoodResult, SessionDetails,
  fmt,
  LandingView, SessionView, AnalyzingView, ResultsView
} from "@/components/mood-tracking"

const INITIAL_INTERVIEW_PROMPT =
  "Tell me how you are feeling right now in one or two lines."

const CAPTURE_INTERVAL_MS = 1800
const API_BASE_DEFAULT = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"
const API_BASE_CANDIDATES = [API_BASE_DEFAULT, "http://localhost:5005", "http://127.0.0.1:5005"]
  .filter((value, index, arr) => Boolean(value) && arr.indexOf(value) === index)

const normalizeTranscript = (text: string) => text.replace(/\s+/g, " ").trim()

type RecordedTurn = {
  question: string
  transcript: string
  frames: Blob[]
  audioBlob: Blob | null
  durationMs: number
}

type BackendSessionStart = {
  _id: string
}

type BackendSendMessage = {
  reply: string
  emotion?: string
  score?: number
  riskLevel?: RiskLevel
  action?: string
}

type BackendSessionEnd = {
  success: boolean
  session: {
    id?: string
    finalScore: number
    finalMood: string
    riskLevel: RiskLevel
    averageTextScore?: number
    averageVoiceScore?: number
    averageFaceScore?: number
    messagesCount?: number
  }
  sessionDetails?: SessionDetails
}

type BackendSessionDetails = {
  success: boolean
  session: SessionDetails
}

const toScoreNumber = (value: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.round(Math.abs(parsed) * 100)
}


export default function MoodTrackingPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [phase, setPhase] = useState<Phase>("landing")
  const [elapsed, setElapsed] = useState(0)
  const [hasVideo, setHasVideo] = useState(false)
  const [micActive, setMicActive] = useState(true)
  const [camActive, setCamActive] = useState(true)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [aiTyping, setAiTyping] = useState(false)
  const [result, setResult] = useState<MoodResult | null>(null)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(INITIAL_INTERVIEW_PROMPT)
  const [isRecording, setIsRecording] = useState(false)
  const [responseCount, setResponseCount] = useState(0)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null)
  const [activeApiBase, setActiveApiBase] = useState(API_BASE_DEFAULT)
  const [blogGenerating, setBlogGenerating] = useState(false)
  const [blogStatus, setBlogStatus] = useState<string | null>(null)

  // react-speech-recognition 
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  const transcriptRef = useRef("")
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])


  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const recRef         = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const turnFramesRef  = useRef<Blob[]>([])
  const turnsRef       = useRef<RecordedTurn[]>([])
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const capRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef       = useRef(0)
  const turnStartRef   = useRef(0)
  const isRecordingRef = useRef(false)
  const captureBusyRef = useRef(false)
  const captureInitRef = useRef(false)
  const shouldCaptureRef = useRef(false)
  const chatBottomRef  = useRef<HTMLDivElement>(null)

  const requestWithFallback = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const candidateBases = [activeApiBase, ...API_BASE_CANDIDATES].filter(
        (value, index, arr) => Boolean(value) && arr.indexOf(value) === index
      )
      let lastError = "Request failed"

      for (const base of candidateBases) {
        let response: Response
        try {
          response = await fetch(`${base}${path}`, init)
        } catch (error) {
          // Retry only on network/CORS style failures where fetch itself rejects.
          lastError = error instanceof Error ? error.message : "Network request failed"
          continue
        }

        const data = await response.json().catch(() => ({})) as T & { message?: string; msg?: string; error?: string }

        if (!response.ok) {
          // Surface backend error directly instead of masking it with fallback attempts.
          throw new Error(data?.message || data?.msg || data?.error || `Request failed (${response.status})`)
        }

        if (base !== activeApiBase) {
          setActiveApiBase(base)
        }

        return data as T
      }

      throw new Error(lastError)
    },
    [activeApiBase]
  )

  useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, aiTyping])

  // ── frame capture
  const captureFrame = useCallback(() => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!shouldCaptureRef.current || !v || !c || v.readyState < 2 || !v.videoWidth || captureBusyRef.current) return

    if (!captureInitRef.current) {
      const maxW  = 480
      const srcW  = v.videoWidth
      const srcH  = v.videoHeight || 270
      const scale = Math.min(1, maxW / srcW)
      c.width  = Math.round(srcW * scale)
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

  const handleVideoReady = useCallback(() => setHasVideo(true), [])

  const releaseTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null  
    }
    setActiveStream(null)
    setHasVideo(false)
  }, [])


  const acquireStream = useCallback(async (): Promise<MediaStream | null> => {
    if (streamRef.current?.active) return streamRef.current


    releaseTracks()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      setActiveStream(stream)
      return stream
    } catch {
      alert("Camera or microphone access was denied. Please allow permissions and try again.")
      return null
    }
  }, [releaseTracks])

  //  recording turn
  const startTurnRecording = useCallback(async () => {
    if (isRecordingRef.current) return

    const stream = await acquireStream()
    if (!stream) return

    chunksRef.current      = []
    turnFramesRef.current  = []
    captureBusyRef.current = false
    captureInitRef.current = false
    shouldCaptureRef.current = true
    turnStartRef.current   = Date.now()


    transcriptRef.current = ""
    resetTranscript()

    SpeechRecognition.startListening({ continuous: true, language: "en-IN" })


    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length > 0) {
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"
      const rec = new MediaRecorder(new MediaStream(audioTracks), { mimeType: mime })
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.start(400)
      recRef.current = rec
    }

    // Frame capture loop
    const scheduleCapture = () => {
      if (!shouldCaptureRef.current) return
      captureFrame()
      capRef.current = setTimeout(scheduleCapture, CAPTURE_INTERVAL_MS)
    }
    captureFrame()
    capRef.current = setTimeout(scheduleCapture, CAPTURE_INTERVAL_MS)

    isRecordingRef.current = true
    setIsRecording(true)
  }, [acquireStream, captureFrame, resetTranscript])

  const stopTurnRecording = useCallback(async (questionLabel: string): Promise<RecordedTurn | null> => {
    // Keep both pre-stop and post-stop snapshots because Web Speech can flush final words on stop.
    const transcriptBeforeStop = normalizeTranscript(transcriptRef.current)

    //  2. Stop frame capt7ure 
    shouldCaptureRef.current = false
    if (capRef.current) clearTimeout(capRef.current)

    //  3. Stop speech recognition 
    SpeechRecognition.stopListening()
    await new Promise<void>((resolve) => setTimeout(resolve, 350))
    let transcriptAfterStop = normalizeTranscript(transcriptRef.current)

    // Give the engine a short extra window to flush final chunks on slower devices.
    if (!transcriptAfterStop) {
      for (const delayMs of [250, 250, 300]) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
        transcriptAfterStop = normalizeTranscript(transcriptRef.current)
        if (transcriptAfterStop) break
      }
    }
    const savedTranscript = transcriptAfterStop || transcriptBeforeStop

    // 4. Stop audio MediaRecorder 
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

    // 5. Release camera + mic → OS indicator off 
    releaseTracks()

    isRecordingRef.current = false
    setIsRecording(false)

    if (!savedTranscript) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I could not detect speech. Please click Start Recording and answer this question again.",
          ts: Date.now(),
        },
      ])

      console.warn("No speech captured for turn", {
        questionNumber: turnsRef.current.length + 1,
        transcriptBeforeStop,
        transcriptAfterStop,
      })

      return null
    }

    // 6. Persist turn data 
    const savedTurn: RecordedTurn = {
      question:   questionLabel || "Interview answer",
      transcript: savedTranscript,
      frames:     [...turnFramesRef.current],
      audioBlob,
      durationMs: Date.now() - turnStartRef.current,
    }

    turnsRef.current.push(savedTurn)
    setResponseCount(turnsRef.current.length)

    setMsgs((prev) => [
      ...prev,
      { role: "user", text: savedTurn.transcript, ts: Date.now() },
    ])

    //  7. Console log 
    console.log("=== Recorded Turn Payload ===", {
      questionNumber:     turnsRef.current.length,
      question:           savedTurn.question,
      transcript:         savedTurn.transcript,
      transcriptBeforeStop,
      transcriptAfterStop,
      frameCount:         savedTurn.frames.length,
      frames:             savedTurn.frames,
      audioBlob:          savedTurn.audioBlob,
      audioBlobSizeBytes: savedTurn.audioBlob?.size ?? 0,
      durationMs:         savedTurn.durationMs,
    })

    return savedTurn
  }, [releaseTracks])

  //  session flow
  const stopAndAdvance = async () => {
    if (!isRecording) return
    const savedTurn = await stopTurnRecording(currentPrompt)
    if (!savedTurn) return

    setAiTyping(true)
    let aiReply = "Thanks for sharing."
    try {
      if (token && backendSessionId) {
        const data = await requestWithFallback<BackendSendMessage>("/api/student/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: backendSessionId,
            message: savedTurn.transcript,
          }),
        })
        if (data.reply) aiReply = data.reply
      }
    } catch (error) {
      console.error("sendMessage failed:", error)
      aiReply = "I could not process that right now, but your response is noted."
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 600))
    setAiTyping(false)
    setMsgs((prev) => [...prev, { role: "ai", text: aiReply, ts: Date.now() }])
    setCurrentPrompt(aiReply)
  }

  const startSession = async () => {
    if (!token) {
      alert("Please login first. Student session APIs require auth token.")
      return
    }

    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition. Please use Chrome.")
      return
    }

    turnsRef.current      = []
    chunksRef.current     = []
    turnFramesRef.current = []
    setMsgs([])
    setResult(null)
    setElapsed(0)
    setCurrentPrompt(INITIAL_INTERVIEW_PROMPT)
    setResponseCount(0)
    setIsRecording(false)
    setBackendSessionId(null)
    setBlogStatus(null)
    setBlogGenerating(false)
    transcriptRef.current = ""
    resetTranscript()

    try {
      const started = await requestWithFallback<BackendSessionStart>("/api/student/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration: 10 }),
      })
      setBackendSessionId(started._id)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not start session")
      return
    }

    const stream = await acquireStream()
    if (!stream) return

    startRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 250)
    setPhase("session")

    setTimeout(() => {
      setAiTyping(true)
      setTimeout(() => {
        setAiTyping(false)
        setMsgs([{ role: "ai", text: INITIAL_INTERVIEW_PROMPT, ts: Date.now() }])
        // User must click "Start Recording" manually — no auto-start
      }, 900)
    }, 300)
  }

  const endSession = async () => {
    if (!token || !backendSessionId) {
      alert("Session not initialized. Please start a new session.")
      return
    }

    if (isRecording) {
      const savedTurn = await stopTurnRecording(currentPrompt)
      if (savedTurn) {
        try {
          const data = await requestWithFallback<BackendSendMessage>("/api/student/message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId: backendSessionId,
              message: savedTurn.transcript,
            }),
          })

          if (data.reply) {
            setMsgs((prev) => [...prev, { role: "ai", text: data.reply, ts: Date.now() }])
          }
        } catch (error) {
          console.error("Final sendMessage failed:", error)
        }
      }
    }

    if (timerRef.current) clearInterval(timerRef.current)
    releaseTracks()

    console.log("=== Full Session Payload ===", {
      totalResponses: turnsRef.current.length,
      turns: turnsRef.current,
    })

    setPhase("analyzing")
    setAnalyzeStep(0)
    ;[0, 1, 2, 3].forEach((_, i) => setTimeout(() => setAnalyzeStep(i + 1), i * 1100 + 500))

    try {
      const ended = await requestWithFallback<BackendSessionEnd>("/api/student/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: backendSessionId }),
      })

      const final = toScoreNumber(ended.session.finalScore)
      const textScore = toScoreNumber(ended.session.averageTextScore || 0)
      const voiceScore = toScoreNumber(ended.session.averageVoiceScore || 0)
      const faceScore = toScoreNumber(ended.session.averageFaceScore || 0)
      const emotion = ended.session.finalMood || "neutral"
      const riskLevel = ended.session.riskLevel || "low"

      let details: SessionDetails | undefined = ended.sessionDetails
      const detailsSessionId = ended.session.id || backendSessionId
      if (!details && detailsSessionId) {
        try {
          const detailsRes = await requestWithFallback<BackendSessionDetails>(`/api/student/session/${detailsSessionId}/details`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          details = detailsRes.session
        } catch (detailsError) {
          console.error("session details fetch failed:", detailsError)
        }
      }

      const summary = `Your ${fmt(elapsed)} session has been analyzed using backend scoring and stored successfully. Final mood: ${emotion}. Risk level: ${riskLevel}.`
      const suggestions =
        riskLevel === "high"
          ? [
              "Reach out to a counsellor or trusted mentor soon.",
              "Take a short grounding break with breathing before your next task.",
              "Prioritize sleep and reduce late-night screen exposure today.",
            ]
          : riskLevel === "medium"
          ? [
              "Take 10 minutes to journal your stress triggers.",
              "Use a short walk or stretch break to reset your mind.",
              "Check in again tomorrow to monitor changes.",
            ]
          : [
              "Keep your current self-care routine consistent.",
              "Continue sharing your feelings with trusted people.",
              "Schedule regular check-ins to maintain progress.",
            ]

      setTimeout(() => {
        setResult({
          sessionId: detailsSessionId,
          finalScore: final,
          textScore,
          voiceScore,
          faceScore,
          emotion,
          riskLevel,
          summary,
          suggestions,
          details,
        })
        setBlogStatus(null)
        setBlogGenerating(false)
        setPhase("results")
      }, 1700)
    } catch (error) {
      console.error("endSession failed:", error)
      alert(error instanceof Error ? error.message : "Could not end session")
      setPhase("session")
    }
  }

  const reset = () => {
    releaseTracks()
    if (timerRef.current) clearInterval(timerRef.current)
    turnsRef.current = []
    transcriptRef.current = ""
    resetTranscript()
    setPhase("landing")
    setElapsed(0)
    setHasVideo(false)
    setMsgs([])
    setResult(null)
    setCurrentPrompt(INITIAL_INTERVIEW_PROMPT)
    setResponseCount(0)
    setBackendSessionId(null)
    setIsRecording(false)
    setBlogStatus(null)
    setBlogGenerating(false)
  }

  const handleGenerateBlog = async () => {
    if (!token) {
      alert("Please login first")
      return
    }

    const targetSessionId = result?.sessionId || backendSessionId
    if (!targetSessionId) {
      alert("Session id is missing. Please start a new session.")
      return
    }

    setBlogGenerating(true)
    setBlogStatus(null)

    try {
      const response = await requestWithFallback<{ message?: string; error?: string }>("/api/student/generate-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessions_id: [targetSessionId],
        }),
      })

      setBlogStatus(response.message || "Blog generated successfully")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate blog"
      setBlogStatus(message)
    } finally {
      setBlogGenerating(false)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (capRef.current)   clearTimeout(capRef.current)
      SpeechRecognition.stopListening()
      releaseTracks()
      if (recRef.current?.state !== "inactive") recRef.current?.stop()
    }
  }, [releaseTracks])

  return (
    <div className="relative flex flex-col w-full min-h-[calc(100vh-56px)] bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "landing"   && <LandingView key="landing" onStart={startSession} />}
        {phase === "analyzing" && <AnalyzingView key="analyzing" analyzeStep={analyzeStep} />}
        {phase === "results" && result && (
          <ResultsView
            key="results"
            result={result}
            elapsed={elapsed}
            responseCount={responseCount}
            onReset={reset}
            onGenerateBlog={handleGenerateBlog}
            onOpenBlogs={() => router.push("/blogs")}
            blogGenerating={blogGenerating}
            blogStatus={blogStatus}
          />
        )}
        {phase === "session" && (
          <SessionView
            key="session"
            elapsed={elapsed}
            currentQuestion={responseCount + 1}
            totalQuestions={Math.max(1, responseCount + 1)}
            questionText={currentPrompt}
            isRecording={isRecording}
            transcriptDraft={transcript}
            onTranscriptChange={() => {}}
            onStartRecording={startTurnRecording}
            onStopRecording={stopAndAdvance}
            videoRef={videoRef}
            hasVideo={hasVideo}
            micActive={micActive}
            camActive={camActive}
            onToggleMic={() => {
              setMicActive((p) => !p)
              streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !micActive })
            }}
            onToggleCam={() => {
              setCamActive((p) => !p)
              streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !camActive })
            }}
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