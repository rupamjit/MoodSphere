"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string
  specialization?: string
}

type UserType = "student" | "doctor"

type LoginPayload = {
  email: string
  password: string
}

type SignupPayload = {
  name: string
  email: string
  phone: string
  password: string
  specialization?: string
  licenseNumber?: string
  experience?: number
  consultationFee?: number
  city?: string
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  userType: UserType
  loading: boolean
  login: (payload: LoginPayload, type?: UserType) => Promise<void>
  signup: (payload: SignupPayload, type?: UserType) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || ""

const FALLBACK_API_BASES = [
  "http://localhost:5005",
  "http://127.0.0.1:5005",
  "http://localhost:5001",
  "http://127.0.0.1:5001",
]

const API_BASES = [API_BASE, ...FALLBACK_API_BASES].filter(Boolean)

const TOKEN_KEY = "moodsphere.token"
const USER_KEY = "moodsphere.user"
const USER_TYPE_KEY = "moodsphere.userType"

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  let lastNetworkError: Error | null = null

  for (const base of API_BASES) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 12000)

    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        ...init,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.message || `Request failed (${response.status})`)
      }

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)

      const normalizedError =
        error instanceof Error ? error : new Error("Network request failed")

      const isNetworkFailure =
        normalizedError.name === "TypeError" ||
        normalizedError.name === "AbortError" ||
        /fetch|network|load failed|failed to fetch/i.test(normalizedError.message)

      if (!isNetworkFailure) {
        throw normalizedError
      }

      lastNetworkError = normalizedError
    }
  }

  throw new Error(
    lastNetworkError?.name === "AbortError"
      ? "Backend request timed out. Please ensure the backend server is running."
      : "Cannot connect to backend API. Start backend server and set NEXT_PUBLIC_BACKEND_URL if needed."
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
  })

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null
    const savedUser = localStorage.getItem(USER_KEY)
    if (!savedUser) return null

    try {
      return JSON.parse(savedUser) as AuthUser
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  })

  const [userType, setUserType] = useState<UserType>(() => {
    if (typeof window === "undefined") return "student"
    const savedType = localStorage.getItem(USER_TYPE_KEY)
    return savedType === "doctor" ? "doctor" : "student"
  })

  const loading = false

  const setSession = useCallback((nextToken: string, nextUser: AuthUser, nextUserType: UserType) => {
    setToken(nextToken)
    setUser(nextUser)
    setUserType(nextUserType)
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    localStorage.setItem(USER_TYPE_KEY, nextUserType)
  }, [])

  const login = useCallback(
    async (payload: LoginPayload, type: UserType = "student") => {
      const data = await requestJSON<{
        token: string
        user?: AuthUser
        doctor?: AuthUser
      }>(`/api/${type}/login`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const actor = data.user || data.doctor
      if (!actor) throw new Error("Invalid auth response")
      setSession(data.token, actor, type)
    },
    [setSession]
  )

  const signup = useCallback(
    async (payload: SignupPayload, type: UserType = "student") => {
      const data = await requestJSON<{
        token: string
        user?: AuthUser
        doctor?: AuthUser
      }>(`/api/${type}/signup`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const actor = data.user || data.doctor
      if (!actor) throw new Error("Invalid auth response")
      setSession(data.token, actor, type)
    },
    [setSession]
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setUserType("student")
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_TYPE_KEY)
  }, [])

  const value = useMemo(
    () => ({ user, token, userType, loading, login, signup, logout }),
    [user, token, userType, loading, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
