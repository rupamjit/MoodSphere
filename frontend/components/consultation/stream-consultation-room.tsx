"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CallControls,
  CallParticipantsList,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  type User,
} from "@stream-io/video-react-sdk"
import type { Call } from "@stream-io/video-client"
import "@stream-io/video-react-sdk/dist/css/styles.css"

import { useAuth } from "@/components/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"
const PUBLIC_STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY?.trim() || ""

type TokenResponse = {
  token: string
  callId: string
  apiKey?: string
}

export default function StreamConsultationRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, user, userType } = useAuth()

  const consultationId = searchParams.get("consultationId") || ""

  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<Call | null>(null)
  const [callId, setCallId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  useEffect(() => {
    if (!token) {
      router.replace(userType === "doctor" ? "/doctor/login" : "/login")
      return
    }

    if (!consultationId) {
      setError("Missing consultationId in URL")
      setLoading(false)
      return
    }

    let unmounted = false
    let nextClient: StreamVideoClient | null = null
    let nextCall: Call | null = null

    const connectCall = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE}/api/${userType}/consultations/${consultationId}/stream-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = (await response.json().catch(() => ({}))) as Partial<TokenResponse> & {
          message?: string
        }

        if (!response.ok || !data.token || !data.callId) {
          throw new Error(data.message || "Could not initialize stream consultation")
        }

        const apiKey = data.apiKey || PUBLIC_STREAM_API_KEY
        if (!apiKey) {
          throw new Error("Stream API key missing. Set STREAM_API_KEY in backend and NEXT_PUBLIC_STREAM_API_KEY in frontend.")
        }

        const streamUser: User = {
          id: `${userType}-${user?.id || "guest"}`,
          name: user?.name || user?.email || "Participant",
        }

        nextClient = new StreamVideoClient({
          apiKey,
          user: streamUser,
          token: data.token,
        })

        nextCall = nextClient.call("default", data.callId)
        await nextCall.join({
          create: true,
          members_limit: 2,
          data: {
            settings_override: {
              limits: {
                max_participants: 2,
              },
            },
          },
        })

        if (unmounted) {
          return
        }

        setClient(nextClient)
        setCall(nextCall)
        setCallId(data.callId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect")
      } finally {
        if (!unmounted) {
          setLoading(false)
        }
      }
    }

    connectCall()

    return () => {
      unmounted = true
      if (nextCall) {
        nextCall.leave().catch(() => {})
      }
      if (nextClient) {
        nextClient.disconnectUser().catch(() => {})
      }
    }
  }, [consultationId, token, userType, router, user?.email, user?.id, user?.name])

  const isConnected = useMemo(() => Boolean(client && call && !loading && !error), [client, call, loading, error])

  const leaveCall = () => {
    call?.leave().catch(() => {})
    client?.disconnectUser().catch(() => {})
    router.replace(userType === "doctor" ? "/doctor/consultants" : "/consultants")
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Card className="border border-orange-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Live Consultation Room</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {user?.name ? `Connected as ${user.name}` : "Secure end-to-end call powered by Stream"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{callId || "Preparing call..."}</Badge>
              <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? "Live" : "Connecting"}</Badge>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="border border-orange-100 p-8 text-center text-sm text-muted-foreground">Joining call...</Card>
        ) : null}

        {error ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
        ) : null}

        {!loading && !error && client && call ? (
          <>
            <Card className="border border-orange-100 p-2 md:p-3">
              <StreamVideo client={client}>
                <StreamCall call={call}>
                  <StreamTheme>
                    <div className="overflow-hidden rounded-lg border border-orange-100">
                      <SpeakerLayout participantsBarLimit={2} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      <CallControls onLeave={leaveCall} />
                      <Button type="button" variant="outline" onClick={() => setShowParticipants((prev) => !prev)}>
                        {showParticipants ? "Hide Participants" : "Show Participants"}
                      </Button>
                    </div>
                    {showParticipants ? (
                      <div className="mt-3 rounded-lg border border-orange-100 bg-white p-2">
                        <CallParticipantsList onClose={() => setShowParticipants(false)} />
                      </div>
                    ) : null}
                  </StreamTheme>
                </StreamCall>
              </StreamVideo>
            </Card>

            <Card className="border border-orange-100 p-4">
              <div className="flex items-center justify-center">
                <Button type="button" variant="destructive" onClick={leaveCall}>
                  Leave Consultation
                </Button>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  )
}
