import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
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
        <div className="text-center max-w-md">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-[150px] font-bold text-primary/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/companies">
                <Search className="mr-2 h-4 w-4" />
                Browse Companies
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Popular destinations
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/signals"
                className="text-sm text-primary hover:underline"
              >
                AI Signals
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/arena"
                className="text-sm text-primary hover:underline"
              >
                Mad2Arena
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link
                href="/chat"
                className="text-sm text-primary hover:underline"
              >
                AI Chat
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
