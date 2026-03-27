"use client"
import { RefObject, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Mic, MicOff, Camera, CameraOff, Square,
  Brain, Loader2, Radio, Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChatMsg } from "./types"
import { fmt } from "./utils"

interface SessionViewProps {
  elapsed: number
  currentQuestion: number
  totalQuestions: number
  questionText: string
  isRecording: boolean
  transcriptDraft: string
  onTranscriptChange: (val: string) => void
  onStartRecording: () => void
  onStopRecording: () => void
  videoRef: RefObject<HTMLVideoElement | null>
  hasVideo: boolean
  micActive: boolean
  camActive: boolean
  onToggleMic: () => void
  onToggleCam: () => void
  onEndSession: () => void
  msgs: ChatMsg[]
  aiTyping: boolean
  chatBottomRef: RefObject<HTMLDivElement | null>
  stream?: MediaStream | null
  onVideoReady?: () => void
}

export function SessionView({
  elapsed,
  currentQuestion,
  totalQuestions,
  questionText,
  isRecording,
  transcriptDraft,
  onStartRecording,
  onStopRecording,
  videoRef,
  hasVideo,
  micActive,
  camActive,
  onToggleMic,
  onToggleCam,
  onEndSession,
  msgs,
  aiTyping,
  chatBottomRef,
  stream,
  onVideoReady,
}: SessionViewProps) {


  useEffect(() => {
    let active = true
    if (active && videoRef.current && stream) {
      const video = videoRef.current
      if (video.srcObject !== stream) {
        video.srcObject = stream
      }
      video.onloadedmetadata = () => {
        video.play().catch(() => {})
        onVideoReady?.()
      }
    }
    return () => { active = false }
  }, [stream, videoRef, onVideoReady])

  return (
    <div
      className="w-full h-full bg-background p-4 md:p-6"
      style={{ height: "calc(100vh - 64px)" }}
    >
      <div className="grid h-full gap-4 md:grid-cols-[1.2fr_1fr]">

        {/* ── Left column: camera + controls ── */}
        <Card className="h-full rounded-2xl border-border/60 bg-card/95 py-0 overflow-hidden">
          <CardHeader className="border-b px-4 py-4 md:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Live Interview Recorder</CardTitle>
                <CardDescription>
                  Question {currentQuestion} of {totalQuestions} · Session {fmt(elapsed)}
                </CardDescription>
              </div>

              {/* Recording status badge */}
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                {isRecording ? (
                  <>
                    <Radio className="size-3 text-red-500" />
                    Recording
                    <span className="ml-1 flex items-center gap-1" aria-hidden="true">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-red-500"
                          animate={{ opacity: [0.25, 1, 0.25], y: [0, -1, 0] }}
                          transition={{
                            duration: 0.9,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay,
                          }}
                        />
                      ))}
                    </span>
                  </>
                ) : (
                  <>
                    <Circle className="size-3" />
                    Waiting
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex h-full flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4 md:px-5">
            {/* Camera preview */}
            <div className="relative flex-1 overflow-hidden rounded-xl border bg-muted/40">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover scale-x-[-1]"
                style={{ opacity: hasVideo && camActive ? 1 : 0.12 }}
              />

              <AnimatePresence>
                {(!hasVideo || !camActive) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85"
                  >
                    {!hasVideo
                      ? <Brain className="size-8 text-muted-foreground" />
                      : <CameraOff className="size-8 text-muted-foreground" />}
                    <p className="text-sm text-muted-foreground">
                      {!hasVideo
                        ? "Click Start Recording to begin"
                        : "Camera is paused"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current question */}
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current AI Question
              </p>
              <p className="mt-1 text-sm text-foreground">{questionText}</p>
            </div>

            {/* Live transcript box — read-only, driven by react-speech-recognition */}
            <div className="rounded-xl border bg-muted/10 p-3 min-h-20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Live Transcript
                {isRecording && (
                  <span className="ml-2 inline-flex items-center gap-1 text-red-500">
                    <motion.span
                      className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    Listening…
                  </span>
                )}
              </p>
              {transcriptDraft ? (
                <p className="text-sm text-foreground leading-relaxed">{transcriptDraft}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {isRecording
                    ? "Start speaking — your words will appear here…"
                    : "Press Start Recording, then speak your answer."}
                </p>
              )}
            </div>

            {/* Mic / Cam toggles */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onToggleMic} disabled={!isRecording}>
                {micActive ? <Mic className="size-4 mr-1" /> : <MicOff className="size-4 mr-1" />}
                {micActive ? "Mic On" : "Mic Off"}
              </Button>
              <Button variant="outline" size="sm" onClick={onToggleCam} disabled={!isRecording}>
                {camActive ? <Camera className="size-4 mr-1" /> : <CameraOff className="size-4 mr-1" />}
                {camActive ? "Cam On" : "Cam Off"}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-2 border-t bg-card/95 px-4 pb-1 pt-3 backdrop-blur md:-mx-5 md:px-5">
              <Button
                onClick={onStartRecording}
                disabled={isRecording}
                className="gap-2"
              >
                <Radio className="size-4" />
                Start Recording
              </Button>
              <Button
                variant="destructive"
                onClick={onStopRecording}
                disabled={!isRecording}
                className="gap-2"
              >
                <Square className="size-4" />
                Stop & Save Answer
              </Button>
              <Button variant="outline" onClick={onEndSession} className="gap-2">
                End Session &amp; Show Result
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Right column: AI chat ── */}
        <Card className="h-full rounded-2xl border-border/60 bg-card/95 py-0 overflow-hidden">
          <CardHeader className="border-b px-4 py-4 md:px-5">
            <CardTitle className="text-base">AI Conversation</CardTitle>
            <CardDescription>
              Your answers appear here. Stop recording to save each response.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex h-full flex-col px-4 pb-4 pt-4 md:px-5 overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">

              {msgs.length === 0 && !aiTyping && (
                <p className="text-sm text-muted-foreground text-center pt-6">
                  The conversation will appear here once you start.
                </p>
              )}

              {msgs.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "ai"
                        ? "bg-muted text-foreground"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}


              {isRecording && transcriptDraft && (
                <div className="flex justify-end">
                  <div className="max-w-[88%] rounded-2xl px-3 py-2 text-sm bg-orange-300/60 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200 italic border border-orange-400/30">
                    <span className="text-xs not-italic font-medium block mb-0.5 opacity-70">
                      Speaking now…
                    </span>
                    {transcriptDraft}
                  </div>
                </div>
              )}

              {aiTyping && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  AI is preparing the next question…
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}