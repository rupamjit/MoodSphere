import Link from "next/link"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <section className="bg-background grid min-h-screen grid-rows-[auto_1fr] px-4">
      <div className="mx-auto w-full max-w-7xl border-b py-3">
        <Logo withLink className="w-fit" />
      </div>

      <div className="m-auto w-full max-w-sm py-10">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-medium text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to continue tracking your MoodSphere journey</p>
        </div>

        <Card className="mt-6 border border-border p-8">
          <form className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="login-email">Email</Label>
              <Input
                type="email"
                id="login-email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                  Forgot?
                </Link>
              </div>
              <Input type="password" id="login-password" name="password" required />
            </div>

            <Button className="h-11 w-full text-sm font-semibold">Sign In</Button>
          </form>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </section>
  )
}
