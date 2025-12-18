"use client"

import Link from "next/link"
import { useAuth } from "./AuthProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  User,
  Settings,
  Star,
  LogOut,
  Crown,
  Loader2
} from "lucide-react"

export function UserMenu() {
  const { user, profile, isLoading, signOut } = useAuth()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    )
  }

  // Not logged in - show login/signup buttons
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    )
  }

  // Get user initials for avatar
  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || "U"

  // Get tier badge color
  const tierColors = {
    free: "bg-muted text-muted-foreground",
    premium: "bg-primary/20 text-primary",
    pro: "bg-profit/20 text-profit",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
          <Avatar className="h-9 w-9 border-2 border-primary/50">
            {profile?.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={profile.fullName || "User"} />
            )}
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {profile?.fullName || "User"}
              </p>
              {profile?.membershipTier && profile.membershipTier !== "free" && (
                <Badge className={`text-[10px] h-4 ${tierColors[profile.membershipTier]}`}>
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  {profile.membershipTier.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/watchlist" className="cursor-pointer">
            <Star className="mr-2 h-4 w-4" />
            Watchlist
            {profile?.watchlist && profile.watchlist.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                {profile.watchlist.length}
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
