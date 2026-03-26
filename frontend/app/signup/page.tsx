import Link from "next/link"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
  return (
    <section className="bg-background grid min-h-screen grid-rows-[auto_1fr] px-4">
      <div className="mx-auto w-full max-w-7xl border-b py-3">
        <Logo withLink className="w-fit" />
      </div>

      <div className="m-auto w-full max-w-2xl py-10">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-medium text-foreground">Create an account</h1>
          <p className="text-muted-foreground mt-2 text-sm">Fill in your student details to start using MoodSphere</p>
        </div>

        <Card className="mt-6 border border-border p-8">
          <form className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input id="signup-name" name="name" placeholder="Your full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone</Label>
                <Input id="signup-phone" name="phone" type="tel" placeholder="10-digit phone" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  type="email"
                  id="signup-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input type="password" id="signup-password" name="password" required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="signup-university">University</Label>
                <Input id="signup-university" name="university" placeholder="University name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-roll">Roll Number</Label>
                <Input id="signup-roll" name="rollNumber" placeholder="Roll number" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="signup-class">Class</Label>
                <Input id="signup-class" name="className" placeholder="Class" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="signup-section">Section</Label>
                <Input id="signup-section" name="section" placeholder="Section" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="signup-age">Age</Label>
                <Input id="signup-age" name="age" type="number" min="1" placeholder="Age" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-gender">Gender</Label>
              <select
                id="signup-gender"
                name="gender"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                defaultValue=""
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parent-name">Parent Name</Label>
                <Input id="parent-name" name="parentContact.name" placeholder="Parent name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-phone">Parent Phone</Label>
                <Input id="parent-phone" name="parentContact.phone" type="tel" placeholder="Parent phone" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">Parent Email</Label>
              <Input id="parent-email" name="parentContact.email" type="email" placeholder="parent@example.com" />
            </div>


            <Button className="h-11 w-full text-sm font-semibold">Create Account</Button>
          </form>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}
