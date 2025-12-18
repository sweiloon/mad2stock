"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Sparkles, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlurredContentProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  minHeight?: string
}

export function BlurredContent({
  children,
  title = "Sign in to unlock AI insights",
  description = "Get personalized AI analysis, trading signals, and market insights.",
  className,
  minHeight = "200px",
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

  // Show blurred content with login prompt for unauthenticated users
  return (
    <div className={cn("relative", className)} style={{ minHeight }}>
      {/* Blurred content */}
      <div className="blur-md pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Overlay with login prompt */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
        <Card className="w-full max-w-sm mx-4 border-primary/20 bg-card/95">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up for free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
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
