"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Calendar, Flag, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns"
import type { CompetitionStatus } from "@/lib/arena/types"

interface CompetitionTimerProps {
  status: CompetitionStatus | null
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CompetitionTimer({ status }: CompetitionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [timeToStart, setTimeToStart] = useState<TimeRemaining | null>(null)

  // Default dates if no config
  const startDate = status?.startDate || new Date('2025-12-16T01:00:00Z') // 9am MYT
  const endDate = status?.endDate || new Date('2026-12-15T09:00:00Z') // 5pm MYT

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()

      if (now < startDate) {
        // Before competition starts
        const diff = startDate.getTime() - now.getTime()
        setTimeToStart({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
        setTimeRemaining(null)
      } else if (now <= endDate) {
        // Competition in progress
        const diff = endDate.getTime() - now.getTime()
        setTimeRemaining({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
        setTimeToStart(null)
      } else {
        // Competition ended
        setTimeRemaining(null)
        setTimeToStart(null)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [startDate, endDate])

  const now = new Date()
  const hasStarted = now >= startDate
  const hasEnded = now > endDate
  const isActive = hasStarted && !hasEnded
  const progressPct = status?.progressPct || 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-500" />
            Competition Status
          </CardTitle>
          <Badge
            variant={isActive ? "default" : hasEnded ? "secondary" : "outline"}
            className={cn(
              isActive && "bg-green-500 hover:bg-green-600"
            )}
          >
            {hasEnded ? "Ended" : isActive ? "Live" : "Upcoming"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Display */}
        {!hasEnded && (
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              {hasStarted ? "Time Remaining" : "Starts In"}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(hasStarted ? timeRemaining : timeToStart) && (
                <>
                  <TimeUnit value={(hasStarted ? timeRemaining : timeToStart)!.days} label="Days" />
                  <TimeUnit value={(hasStarted ? timeRemaining : timeToStart)!.hours} label="Hours" />
                  <TimeUnit value={(hasStarted ? timeRemaining : timeToStart)!.minutes} label="Min" />
                  <TimeUnit value={(hasStarted ? timeRemaining : timeToStart)!.seconds} label="Sec" />
                </>
              )}
            </div>
          </div>
        )}

        {hasEnded && (
          <div className="text-center py-4">
            <Flag className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <div className="font-semibold">Competition Completed</div>
            <div className="text-sm text-muted-foreground">
              Final results are in!
            </div>
          </div>
        )}

        {/* Progress Bar (when active) */}
        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPct.toFixed(1)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {/* Date Info */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Start</span>
            </div>
            <span className="font-medium">
              {format(startDate, 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flag className="h-4 w-4" />
              <span>End</span>
            </div>
            <span className="font-medium">
              {format(endDate, 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          {isActive && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Days Elapsed</span>
              </div>
              <span className="font-medium">
                {status?.daysElapsed || 0} / {status?.totalDays || 365} days
              </span>
            </div>
          )}
        </div>

        {/* Competition Info */}
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <div className="font-medium mb-1">Mad2Arena 2025-2026</div>
          <div className="text-muted-foreground">
            5 AI models compete trading Malaysian stocks with RM 10,000 each.
            Trading hours: 9am - 5pm MYT (Mon-Fri)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-muted rounded-lg p-2">
      <div className="text-2xl font-bold tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
