import Link from "next/link"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  withLink?: boolean
}

export function Logo({ className, withLink = false }: LogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.44-4.44 3 3 0 0 1-1.09-5.13A2.5 2.5 0 0 1 9.5 2Z" />
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.44-4.44 3 3 0 0 0 1.09-5.13A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
      </div>
      <span className="bg-linear-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-[22px] font-bold tracking-tight text-transparent">
        MoodSphere
      </span>
    </div>
  )

  if (!withLink) return content

  return (
    <Link href="/" aria-label="go home" className="inline-flex">
      {content}
    </Link>
  )
}
