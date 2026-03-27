"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:5005"

type BlogItem = {
  _id: string
  title: string
  story: string
  key_learnings: string[]
  final_message: string
  summary?: string
  createdAt: string
}

export default function BlogsPage() {
  const router = useRouter()
  const { token, userType } = useAuth()
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (userType === "doctor") {
        router.replace("/doctor/dashboard")
        return
      }

      if (!token) {
        setLoading(false)
        return
      }

      try {
        setError(null)
        const response = await fetch(`${API_BASE}/api/student/blogs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.message || data?.error || "Could not load blogs")
        }

        setBlogs(data.blogs || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load blogs")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [token, userType, router])

  useEffect(() => {
    if (!selectedBlog) return

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBlog(null)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleEsc)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleEsc)
    }
  }, [selectedBlog])

  const closeModal = () => setSelectedBlog(null)

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-7">
      <div className="mx-auto max-w-5xl space-y-4">
        <Card className="border border-orange-100 p-5">
          <h1 className="text-2xl font-semibold">Anonymous Student Blogs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reflections generated from completed sessions. Author identity is hidden.
          </p>
        </Card>

        {loading ? (
          <Card className="border border-orange-100 p-5 text-sm text-muted-foreground">Loading blogs...</Card>
        ) : null}

        {error ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.length === 0 ? (
              <Card className="border border-orange-100 p-5 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
                No blogs yet. Generate one from your mood report.
              </Card>
            ) : (
              blogs.map((blog) => (
                <Card
                  key={blog._id}
                  className="cursor-pointer border border-orange-100 p-5 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                  onClick={() => setSelectedBlog(blog)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-neutral-800 line-clamp-2">{blog.title}</h2>
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>

                  {blog.summary || blog.story ? (
                    <p className="mt-2 text-sm text-neutral-600 line-clamp-3">
                      {blog.summary || blog.story}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs text-orange-600 font-semibold">
                    Click to read full blog
                  </p>
                </Card>
              ))
            )}
          </div>
        ) : null}
      </div>

      {selectedBlog ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <Card
            className="max-h-[88vh] w-full max-w-3xl overflow-hidden border border-orange-200 bg-linear-to-b from-orange-50/70 via-white to-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-orange-100 bg-white/70 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-600">MoodSphere Story</p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-neutral-800">{selectedBlog.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(selectedBlog.createdAt).toLocaleString()}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full border-orange-200 bg-white/80 hover:bg-orange-50"
                  onClick={closeModal}
                  aria-label="Close blog modal"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-[calc(88vh-96px)] overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              {selectedBlog.summary ? (
                <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Summary</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">{selectedBlog.summary}</p>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Full Story</p>
                <p className="mt-2 text-sm leading-7 text-neutral-700 whitespace-pre-line">{selectedBlog.story}</p>
              </div>

              {selectedBlog.key_learnings?.length ? (
                <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Key Learnings</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 space-y-1.5">
                    {selectedBlog.key_learnings.map((item, index) => (
                      <li key={`${selectedBlog._id}-k-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border border-orange-200 bg-linear-to-r from-orange-50 to-amber-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Final Message</p>
                <p className="mt-2 text-sm text-neutral-700">{selectedBlog.final_message}</p>
              </div>

              <div className="mt-5 flex justify-end">
                <Button type="button" onClick={closeModal} className="bg-orange-600 text-white hover:bg-orange-700">
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  )
}
