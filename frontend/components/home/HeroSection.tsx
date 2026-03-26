"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { DashboardPreview } from "@/components/home/dashboard-preview"
import BackgroundPaths from "@/components/kokonutui/background-paths"
import { useRouter } from "next/navigation"

export default function HeroSection() {
  const router = useRouter()

  return (
    <>
      {/* Hero Section  */}
      <section className="relative border-b border-neutral-200">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_-10%,rgba(255,170,110,0.28)_0%,rgba(255,186,140,0.16)_40%,rgba(255,255,255,0)_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_15%_20%,rgba(255,210,170,0.22)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_30%_at_85%_10%,rgba(255,228,205,0.2)_0%,rgba(255,255,255,0)_70%)]" />

        <div className="relative z-10 mx-auto max-w-6xl overflow-hidden border-x border-neutral-200 px-6 pb-16 pt-0">
          <div className="absolute inset-0 z-0">
             <BackgroundPaths />
          </div>

          <motion.div
            className="mt-24 text-center relative z-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          >
            <p className="mb-4 text-[13px] font-bold uppercase tracking-[0.2em] text-orange-500 drop-shadow-sm">
              Privacy-first student well-being.
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tighter text-neutral-800 md:text-[76px]">
              Make early care
              <br />
              feel <span className="text-orange-500">gentle</span> and human
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-500 md:text-lg">
              MoodSphere surfaces quiet, consent-led insights so teams can act
              before stress turns into disengagement.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => router.push("/signup")}
                className="h-11 rounded-full bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 px-8 text-[15px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                Get started
              </Button>
              <Button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                }}
                variant="outline"
                className="h-11 rounded-full border-neutral-200 bg-white px-8 text-[15px] font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                Learn more
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-500">
              <div className="flex items-center gap-1.5 text-orange-500">
                <span className="text-sm">★ ★ ★ ★ ★</span>
              </div>
              <span className="hidden h-4 w-px bg-neutral-200 md:inline-block" />
              <span>Innovative AI Solution 2026</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/*  Dashboard preview */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl border-x border-neutral-200 px-6 py-12">
          <div className="group rounded-[28px] border border-neutral-200 bg-white p-3 shadow-[0_22px_60px_-50px_rgba(0,0,0,0.45)] hover:shadow-[0_22px_65px_-40px_rgba(249,115,22,0.15)] transition-shadow duration-500">
            <div className="rounded-[24px] bg-neutral-50 p-2 transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1px_rgba(229,229,229,1)]">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}