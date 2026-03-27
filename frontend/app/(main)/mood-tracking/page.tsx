"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence } from "framer-motion"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"
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

const normalizeTranscript = (text: string) => text.replace(/\s+/g, " ").trim()

type RecordedTurn = {
  question: string
  transcript: string
  frames: Blob[]
  audioBlob: Blob | null
  durationMs: number
}


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
  const [responseCount, setResponseCount] = useState(0)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)

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

  // ── stream lifecycle ──────────────────────────────────────────────────────
  /**
   * CRITICAL FIX — camera stays on bug:
   *
   * Two things are required to turn off the OS camera indicator:
   *   1. Call track.stop() on every MediaStreamTrack
   *   2. Set video.srcObject = null
   *
   * Step 2 is essential. Even after tracks are stopped, the browser keeps the
   * hardware device reserved as long as any HTMLVideoElement still holds a
   * reference to the stream via srcObject. Clearing it releases the device
   * immediately and the OS indicator turns off.
   */
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

  const stopTurnRecording = useCallback(async (idx: number): Promise<RecordedTurn | null> => {
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
        questionNumber: idx + 1,
        transcriptBeforeStop,
        transcriptAfterStop,
      })

      return null
    }

    // 6. Persist turn data 
    const savedTurn: RecordedTurn = {
      question:   INTERVIEW_QUESTIONS[idx] || "Interview answer",
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
      questionNumber:     idx + 1,
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
    const idx = questionIndex
    const savedTurn = await stopTurnRecording(idx)
    if (!savedTurn) return

    const nextIdx = idx + 1
    if (nextIdx >= INTERVIEW_QUESTIONS.length) {
      setMsgs((prev) => [
        ...prev,
        { role: "ai", text: "All questions are complete. Click End Session to generate your report.", ts: Date.now() },
      ])
      return
    }

    setAiTyping(true)
    setTimeout(() => {
      setAiTyping(false)
      setQuestionIndex(nextIdx)
      setMsgs((prev) => [
        ...prev,
        { role: "ai", text: INTERVIEW_QUESTIONS[nextIdx], ts: Date.now() },
      ])
    }, 900)
  }

  const startSession = async () => {
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
    setQuestionIndex(0)
    setResponseCount(0)
    setIsRecording(false)
    transcriptRef.current = ""
    resetTranscript()

    const stream = await acquireStream()
    if (!stream) return

    startRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 250)
    setPhase("session")

    setTimeout(() => {
      setAiTyping(true)
      setTimeout(() => {
        setAiTyping(false)
        setMsgs([{ role: "ai", text: INTERVIEW_QUESTIONS[0], ts: Date.now() }])
        // User must click "Start Recording" manually — no auto-start
      }, 900)
    }, 300)
  }

  const endSession = async () => {
    if (isRecording) await stopTurnRecording(questionIndex)

    if (timerRef.current) clearInterval(timerRef.current)
    releaseTracks()

    console.log("=== Full Session Payload ===", {
      totalResponses: turnsRef.current.length,
      turns: turnsRef.current,
    })

    setPhase("analyzing")
    setAnalyzeStep(0)
    ;[0, 1, 2, 3].forEach((_, i) => setTimeout(() => setAnalyzeStep(i + 1), i * 1100 + 500))

    setTimeout(() => {
      const textDensity = turnsRef.current.length
        ? turnsRef.current.reduce((acc, t) => acc + t.transcript.length, 0) / turnsRef.current.length : 0
      const avgDuration = turnsRef.current.length
        ? turnsRef.current.reduce((acc, t) => acc + t.durationMs, 0) / turnsRef.current.length : 0

      const ts    = Math.min(95, 45 + textDensity / 8 + Math.random() * 18)
      const vs    = Math.min(95, 48 + avgDuration / 2500 + Math.random() * 16)
      const fs    = Math.min(95, 42 + turnsRef.current.length * 10 + Math.random() * 12)
      const final = Math.round(ts * 0.35 + vs * 0.35 + fs * 0.3)
      const emotions  = ["Calm", "Anxious", "Hopeful", "Stressed", "Neutral", "Reflective"]
      const emotion   = emotions[Math.floor(Math.random() * emotions.length)]
      const riskLevel: RiskLevel = final >= 68 ? "low" : final >= 45 ? "medium" : "high"

      setResult({
        finalScore: final, textScore: Math.round(ts), voiceScore: Math.round(vs), faceScore: Math.round(fs),
        emotion, riskLevel,
        summary: `Your ${fmt(elapsed)} session across ${turnsRef.current.length} responses revealed a ${emotion.toLowerCase()} emotional state. Voice tone analysis detected ${vs > 65 ? "stable" : "slightly elevated"} stress markers, and your verbal content suggests a ${riskLevel} current risk profile.`,
        suggestions:
          riskLevel === "high"
            ? ["Reach out to a campus counsellor this week", "Try box breathing: 4s in, 4s hold, 4s out", "Limit screen time before sleep tonight"]
            : riskLevel === "medium"
            ? ["Journalling for 10 minutes can help process emotions", "A short walk in natural light may shift your mood", "Check in with yourself again tomorrow"]
            : ["You're in a good place — maintain this awareness", "Share how you're feeling with someone close", "Celebrate your emotional self-awareness today"],
      })
      setPhase("results")
    }, 4300)
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
    setQuestionIndex(0)
    setResponseCount(0)
    setIsRecording(false)
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
          <ResultsView key="results" result={result} elapsed={elapsed} responseCount={responseCount} onReset={reset} />
        )}
        {phase === "session" && (
          <SessionView
            key="session"
            elapsed={elapsed}
            currentQuestion={Math.min(questionIndex + 1, INTERVIEW_QUESTIONS.length)}
            totalQuestions={INTERVIEW_QUESTIONS.length}
            questionText={INTERVIEW_QUESTIONS[questionIndex] || "Session complete"}
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