"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const NAV = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Get Started", href: "#" },
      { label: "Live Demo", href: "#" },
    ],
  },
  {
    label: "Resources",
    links: [
      { label: "Student Care", href: "#" },
      { label: "Campus Use Cases", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
]

const SOCIALS = [
  {
    label: "X",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export function FooterSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <footer ref={ref} className="relative border-t border-[#F2EBDD] bg-linear-to-b from-[#FFFEFC] via-[#FFF9F2] to-[#FFFCF8]">
      <div className="relative mx-auto max-w-6xl overflow-hidden border-x border-[#F2EBDD]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-orange-50/60 to-transparent" />

        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none absolute inset-x-0 top-[58%] -translate-y-1/2 z-0 select-none text-center"
        >
          <p
            className="font-semibold tracking-tight"
            style={{
              fontSize: "clamp(3.2rem, 11.2vw, 8.8rem)",
              lineHeight: 0.9,
              color: "transparent",
              WebkitTextStroke: "1.15px rgba(234,88,12,0.2)",
              letterSpacing: "-0.03em",
            }}
          >
            MoodSphere
          </p>
        </motion.div>

        <div className="relative z-10 px-6 pb-8 pt-12 md:px-8 md:pb-10 md:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-10 lg:grid-cols-[1.1fr_1.9fr]"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-3 rounded-2xl border border-[#EFD9C2] bg-white/95 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.44-4.44 3 3 0 0 1-1.09-5.13A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.44-4.44 3 3 0 0 0 1.09-5.13A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[17px] font-bold leading-none tracking-tight text-neutral-900">MoodSphere</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Privacy First Mental Health AI</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {SOCIALS.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E9D9C8] bg-white/90 text-neutral-500 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600"
                  >
                    {s.icon}
                  </Link>
                ))}
              </div>

              <p className="max-w-sm text-[13px] leading-relaxed text-neutral-600">
                Detect emotional risk trends early with consent-led insights and proactive campus support workflows.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/doctor/login"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-4 text-[12px] font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                >
                  Start as Doctor
                </Link>
                <Link
                  href="/doctor/signup"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E9D9C8] bg-white/90 px-4 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-orange-200 hover:text-orange-600"
                >
                  Doctor Sign Up
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {NAV.map((col, i) => (
                <motion.div
                  key={col.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.42, delay: 0.08 + i * 0.07 }}
                  className="space-y-3"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">{col.label}</p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-[13px] text-neutral-600 transition-colors hover:text-orange-600">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="mt-8 h-px bg-linear-to-r from-transparent via-[#E9DDCF] to-transparent" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-5 flex flex-col gap-3 text-[12px] text-neutral-500 md:flex-row md:items-center md:justify-between"
          >
            <p>© {new Date().getFullYear()} MoodSphere. Built for hackathon impact.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="transition-colors hover:text-neutral-800">Privacy</Link>
              <span className="h-3 w-px bg-[#E8DCCC]" />
              <Link href="#" className="transition-colors hover:text-neutral-800">Terms</Link>
              <span className="h-3 w-px bg-[#E8DCCC]" />
              <Link href="#" className="transition-colors hover:text-neutral-800">Cookies</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
