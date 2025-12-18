"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Home, RefreshCw, AlertTriangle, Bug } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Mad2Stock</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full border-destructive/20">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>
              An unexpected error occurred. We&apos;ve been notified and are working on a fix.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && error.message && (
              <div className="p-3 rounded-lg bg-muted text-xs">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <Bug className="h-3 w-3" />
                  <span className="font-medium">Error Details</span>
                </div>
                <code className="text-destructive break-all">{error.message}</code>
                {error.digest && (
                  <div className="mt-2 text-muted-foreground">
                    Digest: {error.digest}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button onClick={reset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
              If the problem persists, please contact support or try again later.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
