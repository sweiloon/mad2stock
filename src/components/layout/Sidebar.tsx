"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  MessageSquare,
  Megaphone,
  Settings,
  Activity,
  ChevronRight,
  Zap,
  Swords,
  Sparkles,
  Moon,
} from "lucide-react"

// Check if Malaysian stock market is open
// Market hours: 9:00 AM - 5:00 PM MYT (UTC+8), Monday to Friday
function isMarketOpen(): boolean {
  const now = new Date()
  // Convert to Malaysia time (UTC+8)
  const malaysiaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }))
  const hours = malaysiaTime.getHours()
  const minutes = malaysiaTime.getMinutes()
  const day = malaysiaTime.getDay() // 0 = Sunday, 6 = Saturday

  // Check if it's a weekday (Monday = 1, Friday = 5)
  const isWeekday = day >= 1 && day <= 5

  // Check if within trading hours (9:00 AM - 5:00 PM)
  const currentMinutes = hours * 60 + minutes
  const marketOpen = 9 * 60 // 9:00 AM
  const marketClose = 17 * 60 // 5:00 PM
  const isDuringTradingHours = currentMinutes >= marketOpen && currentMinutes < marketClose

  return isWeekday && isDuringTradingHours
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, description: "Market overview" },
  { name: "Companies", href: "/companies", icon: Building2, description: "All listings" },
  { name: "Signals", href: "/signals", icon: TrendingUp, description: "Live alerts" },
  { name: "AI Chat", href: "/chat", icon: MessageSquare, description: "Analysis assistant" },
  { name: "Content", href: "/content", icon: Megaphone, description: "Creator studio" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [marketOpen, setMarketOpen] = useState(false)

  // Check market status on mount and every minute
  useEffect(() => {
    setMarketOpen(isMarketOpen())

    const interval = setInterval(() => {
      setMarketOpen(isMarketOpen())
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg glow-primary transition-all group-hover:scale-105">
            <Activity className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-profit border-2 border-sidebar">
              <span className="absolute inset-0 rounded-full bg-profit animate-ping opacity-75" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">Mad2Stock</span>
            <span className="text-xs text-muted-foreground">KLSE Analysis Platform</span>
          </div>
        </Link>
      </div>

      {/* Mad2Arena Premium Button */}
      <div className="mx-3 mt-4 mb-2">
        <Link
          href="/arena"
          className={cn(
            "group relative block p-3 rounded-xl overflow-hidden transition-all duration-300",
            "bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500",
            "hover:from-purple-500 hover:via-pink-500 hover:to-orange-400",
            "hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30",
            pathname === "/arena" && "ring-2 ring-white/40"
          )}
        >
          {/* Animated background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* LIVE badge - top right */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur-sm z-10">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            </span>
            <span className="text-[9px] font-semibold text-white tracking-wide">LIVE</span>
          </div>

          {/* Main content */}
          <div className="relative z-10">
            {/* Title row with icon */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm">
                <Swords className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
                  Mad2Arena
                </h3>
                <p className="text-[10px] font-medium text-white/80 -mt-0.5">AI Trading Competition</p>
              </div>
            </div>

            {/* AI Logos row */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/20">
              <div className="flex -space-x-2">
                <div className="relative h-7 w-7 rounded-full bg-white/90 ring-2 ring-white/50 overflow-hidden z-[5] shadow-lg">
                  <Image src="/images/deepseek-logo.png" alt="DeepSeek" fill sizes="28px" className="object-cover" />
                </div>
                <div className="relative h-7 w-7 rounded-full bg-white/90 ring-2 ring-white/50 overflow-hidden z-[4] shadow-lg">
                  <Image src="/images/claude-logo.webp" alt="Claude" fill sizes="28px" className="object-cover" />
                </div>
                <div className="relative h-7 w-7 rounded-full bg-white/90 ring-2 ring-white/50 overflow-hidden z-[3] shadow-lg">
                  <Image src="/images/openai-logo.png" alt="ChatGPT" fill sizes="28px" className="object-cover" />
                </div>
                <div className="relative h-7 w-7 rounded-full bg-white/90 ring-2 ring-white/50 overflow-hidden z-[2] shadow-lg">
                  <Image src="/images/gemini-logo.png" alt="Gemini" fill sizes="28px" className="object-cover" />
                </div>
                <div className="relative h-7 w-7 rounded-full bg-white/90 ring-2 ring-white/50 overflow-hidden z-[1] shadow-lg">
                  <Image src="/images/Grok-logo.png" alt="Grok" fill sizes="28px" className="object-cover" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-white/90">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                <span className="text-xs font-bold">5 AIs</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Market Status */}
      <div className={cn(
        "mx-4 mb-2 p-2.5 rounded-lg border",
        marketOpen
          ? "bg-green-500/10 border-green-500/20"
          : "bg-muted/50 border-border"
      )}>
        <div className="flex items-center gap-2">
          {marketOpen ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Market Open</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Market Closed</span>
            </>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {marketOpen ? "Trading hours: 9am - 5pm MYT" : "Opens Mon-Fri 9am MYT"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto scrollbar-thin">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary ml-0.5"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-sidebar-accent text-muted-foreground group-hover:text-sidebar-foreground"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground opacity-0 transition-all",
                isActive ? "opacity-100" : "group-hover:opacity-100 group-hover:translate-x-0.5"
              )} />
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-sidebar-foreground">Quick Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded bg-sidebar/50">
            <p className="text-lg font-bold text-profit tabular-nums">80</p>
            <p className="text-[10px] text-muted-foreground">Companies</p>
          </div>
          <div className="text-center p-2 rounded bg-sidebar/50">
            <p className="text-lg font-bold text-primary tabular-nums">12</p>
            <p className="text-[10px] text-muted-foreground">Signals</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </div>
  )
}
