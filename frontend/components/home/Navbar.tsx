"use client"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useAuth } from "@/components/auth/auth-context"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 h-16 w-full border-y border-neutral-200 bg-white/95 px-6 backdrop-blur"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between">
          <Logo withLink />

          <div className="flex items-center gap-3">
            {!user ? (
              <Button
                variant="outline"
                onClick={() => router.push("/doctor/login")}
                className="h-10 rounded-full border-orange-200 px-5 text-[14px] font-semibold text-orange-600 hover:bg-orange-50"
              >
                Start as Doctor
              </Button>
            ) : null}
            <Button
              onClick={() => router.push(user ? "/dashboard" : "/signup")}
              className="h-10 rounded-full bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 px-7 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {user ? "Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="h-16" aria-hidden />
    </>
  )
}
