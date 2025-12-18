"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import { Lock, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlurredContentProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  minHeight?: string
  icon?: "sparkles" | "lock"
}

export function BlurredContent({
  children,
  title = "Unlock Premium Insights",
  description = "Get personalized AI analysis, trading signals, and market insights.",
  className,
  minHeight = "200px",
  icon = "sparkles",
}: BlurredContentProps) {
  const { user, isLoading } = useAuth()

  // Show content if user is authenticated
  if (user) {
    return <>{children}</>
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("relative", className)} style={{ minHeight }}>
        {children}
      </div>
    )
  }

  const IconComponent = icon === "sparkles" ? Sparkles : Lock

  // Show blurred content with elegant overlay for unauthenticated users
  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)} style={{ minHeight }}>
      {/* Blurred content */}
      <div className="blur-[6px] pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* Elegant gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Centered reminder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 px-6 py-8 max-w-md">
          {/* Glowing icon */}
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10">
            <IconComponent className="h-7 w-7 text-violet-500" />
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {/* Sign up button */}
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 px-6"
          >
            <Link href="/signup" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {/* Subtle login link */}
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-500 hover:text-violet-400 hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Simpler version for inline content
export function RequireAuth({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return fallback || null
  }

  if (!user) {
    return fallback || (
      <div className="text-center py-8 space-y-4">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <Link href="/login" className="text-primary hover:underline">
            sign in
          </Link>{" "}
          to view this content.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
