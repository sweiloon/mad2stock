"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  MessageSquare,
  Plus,
  Megaphone,
  Settings,
  Activity,
  ChevronRight,
  Zap,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, description: "Market overview" },
  { name: "Companies", href: "/companies", icon: Building2, description: "All listings" },
  { name: "Signals", href: "/signals", icon: TrendingUp, description: "Live alerts" },
  { name: "AI Chat", href: "/chat", icon: MessageSquare, description: "Analysis assistant" },
  { name: "Add Company", href: "/add-company", icon: Plus, description: "New listing" },
  { name: "Content", href: "/content", icon: Megaphone, description: "Creator studio" },
]

export function Sidebar() {
  const pathname = usePathname()

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
            <span className="text-base font-bold text-sidebar-foreground tracking-tight">KLSE Analytics</span>
            <span className="text-xs text-muted-foreground">Professional Trading</span>
          </div>
        </Link>
      </div>

      {/* Market Status */}
      <div className="mx-4 mt-4 mb-2 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-profit opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-profit" />
            </span>
            <span className="text-xs font-medium text-profit">Market Open</span>
          </div>
          <span className="text-xs text-muted-foreground">KLSE</span>
        </div>
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
