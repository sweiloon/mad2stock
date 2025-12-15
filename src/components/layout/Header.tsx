"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bell, Search, Menu, Moon, Sun, TrendingUp, Star, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStrongBuyCompanies } from "@/lib/company-data"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  // Get top strong buy companies (Category 1 with highest profit growth)
  const strongBuyCompanies = useMemo(() => getStrongBuyCompanies(3), [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/companies?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 gap-4">
      {/* Left side - Menu button (mobile) + Top Strong Buy Companies */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Top Strong Buy Companies - Desktop */}
        <div className="hidden lg:flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="h-4 w-4 text-profit" />
            <span className="text-xs font-semibold text-profit">Top Strong Buy</span>
          </div>
          <div className="flex items-center gap-2">
            {strongBuyCompanies.map((company) => (
              <Link
                key={company.code}
                href={`/companies/${company.code}`}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-profit/10 hover:bg-profit/20 transition-colors"
              >
                <span className="text-xs font-semibold text-profit">{company.code}</span>
                <span className="flex items-center text-[10px] font-medium text-profit tabular-nums">
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  +{(company.profitYoY ?? 0).toFixed(0)}%
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/companies?category=1"
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-profit transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Center - Search */}
      <form onSubmit={handleSearch} className="relative hidden md:block w-80 shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search companies, signals..."
          className="w-full pl-10 h-9 bg-muted/50 border-border focus:bg-background transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </form>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
          >
            3
          </Badge>
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">A</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">admin@klse.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Watchlist</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
