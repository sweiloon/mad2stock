"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart } from "lucide-react"
import Image from "next/image"
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts"
import { format } from "date-fns"
import type { ChartDataPoint, AIParticipant } from "@/lib/arena/types"

// AI Logo mapping - All 7 AI models
const AI_LOGOS: Record<string, string> = {
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'DeepSeek': '/images/deepseek-logo.png',
  'Gemini': '/images/gemini-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Kimi': '/images/kimi-logo.jpg',
  'Qwen': '/images/qwen-logo.jpg',
}

interface PerformanceChartProps {
  data: ChartDataPoint[]
  participants: AIParticipant[]
  height?: number
}

export function PerformanceChart({ data, participants, height = 400 }: PerformanceChartProps) {
  // Use real data or show starting point (all at RM 10,000)
  const chartData = data.length > 0 ? data : generateStartingPoint(participants)
  const hasRealData = data.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-purple-500" />
            Portfolio Performance
          </CardTitle>
          <Badge variant={hasRealData ? "default" : "secondary"}>
            {hasRealData ? `${data.length} days` : 'Starting Point'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
              domain={[9000, 11000]}
            />
            <ReferenceLine
              y={10000}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              label={{ value: 'Starting: RM 10,000', position: 'right', fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null
                return (
                  <div className="bg-popover border rounded-lg shadow-lg p-3">
                    <div className="text-sm font-medium mb-2">
                      {format(new Date(label), 'MMM d, yyyy')}
                    </div>
                    {payload.map((entry: any) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="relative h-4 w-4 rounded-full overflow-hidden">
                          <Image
                            src={AI_LOGOS[entry.name] || ''}
                            alt={entry.name}
                            fill
                            sizes="16px"
                            className="object-cover"
                          />
                        </div>
                        <span>{entry.name}:</span>
                        <span className="font-medium">
                          RM {Number(entry.value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  {payload?.map((entry: any) => (
                    <div key={entry.value} className="flex items-center gap-2">
                      <div className="relative h-5 w-5 rounded-full overflow-hidden ring-2 ring-offset-1" style={{ ['--tw-ring-color' as string]: entry.color } as React.CSSProperties}>
                        <Image
                          src={AI_LOGOS[entry.value] || ''}
                          alt={entry.value}
                          fill
                          sizes="20px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            />
            {participants.map((participant) => (
              <Line
                key={participant.id}
                type="monotone"
                dataKey={participant.display_name}
                stroke={participant.avatar_color}
                strokeWidth={2}
                dot={{ r: 4, fill: participant.avatar_color }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>

        {!hasRealData && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            All AI models start with <span className="font-semibold text-foreground">RM 10,000</span> • Competition begins Dec 16, 2025
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Generate starting point data (all participants at RM 10,000)
function generateStartingPoint(participants: AIParticipant[]): ChartDataPoint[] {
  const startDate = new Date('2025-12-16')

  const point: ChartDataPoint = {
    date: format(startDate, 'yyyy-MM-dd'),
    timestamp: startDate.getTime()
  }

  // All participants start at exactly RM 10,000
  participants.forEach((p) => {
    point[p.display_name] = 10000
  })

  return [point]
}
