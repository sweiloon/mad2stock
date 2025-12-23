"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createChart, IChartApi, ISeriesApi, LineData, Time, ColorType, LineSeries, LineStyle } from "lightweight-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  BarChart3
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useArenaStore } from "@/stores/arena"

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

// AI Colors matching the arena theme - All 7 AI models
const AI_COLORS: Record<string, string> = {
  'Claude': '#FF6B35',    // Orange (Anthropic)
  'ChatGPT': '#10A37F',   // Green (OpenAI)
  'DeepSeek': '#5865F2',  // Blue (DeepSeek)
  'Gemini': '#4285F4',    // Google Blue
  'Grok': '#1DA1F2',      // Twitter Blue (xAI)
  'Kimi': '#9B59B6',      // Purple (Moonshot)
  'Qwen': '#FF7000',      // Orange (Alibaba)
}

interface AIPerformanceData {
  name: string
  color: string
  data: LineData<Time>[]
  currentValue: number
  changePercent: number
}

interface ArenaChartProps {
  height?: number
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | 'ALL'

interface LogoPosition {
  name: string
  x: number
  y: number
  color: string
  visible: boolean
}

export function ArenaChart({ height = 500 }: ArenaChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map())

  const { dailySnapshots, participants, competitionStatus } = useArenaStore()

  const [selectedAI, setSelectedAI] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
  const [crosshairData, setCrosshairData] = useState<{ time: string; values: Record<string, number> } | null>(null)
  const [logoPositions, setLogoPositions] = useState<LogoPosition[]>([])

  // Convert store data to chart data
  const chartData: AIPerformanceData[] = participants.map(participant => {
    const participantSnapshots = dailySnapshots.filter(s => s.participant_id === participant.id)
    const data: LineData<Time>[] = participantSnapshots.map(snapshot => ({
      time: Math.floor(new Date(snapshot.snapshot_date).getTime() / 1000) as Time,
      value: snapshot.portfolio_value
    }))

    const startValue = 10000
    const currentValue = participant.portfolio_value
    const changePercent = ((currentValue - startValue) / startValue) * 100

    return {
      name: participant.display_name,
      color: AI_COLORS[participant.display_name] || participant.avatar_color,
      data,
      currentValue,
      changePercent
    }
  })

  // Sort by performance
  const sortedData = [...chartData].sort((a, b) => b.changePercent - a.changePercent)

  // Check if we have data
  const hasData = chartData.some(ai => ai.data.length > 0)

  // Function to update logo positions based on chart coordinates
  const updateLogoPositions = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current || !hasData) return

    const chart = chartRef.current
    const timeScale = chart.timeScale()
    const positions: LogoPosition[] = []

    chartData.forEach(ai => {
      const series = seriesRefs.current.get(ai.name)
      if (!series || ai.data.length === 0) return

      const lastDataPoint = ai.data[ai.data.length - 1]
      const timeCoordinate = timeScale.timeToCoordinate(lastDataPoint.time)
      const priceCoordinate = series.priceToCoordinate(lastDataPoint.value)

      if (timeCoordinate !== null && priceCoordinate !== null) {
        positions.push({
          name: ai.name,
          x: timeCoordinate,
          y: priceCoordinate,
          color: ai.color,
          visible: true
        })
      }
    })

    setLogoPositions(positions)
  }, [chartData, hasData])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !hasData) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9CA3AF',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
        horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.4)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(156, 163, 175, 0.4)',
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    chartRef.current = chart

    // Add series for each AI
    chartData.forEach(ai => {
      if (ai.data.length === 0) return

      const series = chart.addSeries(LineSeries, {
        color: ai.color,
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => `RM ${price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
        },
        lastValueVisible: true,
        priceLineVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      })
      series.setData(ai.data)
      seriesRefs.current.set(ai.name, series)
    })

    // Add starting line marker at RM 10,000
    if (chartData[0]?.data.length > 0) {
      const startingLine = chart.addSeries(LineSeries, {
        color: 'rgba(156, 163, 175, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      })

      const startTime = chartData[0].data[0].time
      const endTime = chartData[0].data[chartData[0].data.length - 1].time
      startingLine.setData([
        { time: startTime, value: 10000 },
        { time: endTime, value: 10000 }
      ])
    }

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairData(null)
        return
      }

      const values: Record<string, number> = {}
      seriesRefs.current.forEach((series, name) => {
        const data = param.seriesData.get(series)
        if (data && 'value' in data) {
          values[name] = data.value as number
        }
      })

      const date = new Date((param.time as number) * 1000)
      setCrosshairData({
        time: date.toLocaleDateString('en-MY', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        values
      })
    })

    // Fit content
    chart.timeScale().fitContent()

    // Update logo positions after initial render
    setTimeout(() => updateLogoPositions(), 100)

    // Subscribe to time scale changes to update logo positions
    chart.timeScale().subscribeVisibleTimeRangeChange(() => {
      updateLogoPositions()
    })

    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      updateLogoPositions()
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
        setTimeout(() => updateLogoPositions(), 50)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      seriesRefs.current.clear()
    }
  }, [chartData, hasData, updateLogoPositions])

  // Handle AI selection (highlight/dim)
  useEffect(() => {
    seriesRefs.current.forEach((series, name) => {
      const ai = chartData.find(a => a.name === name)
      if (!ai) return

      if (selectedAI === null) {
        series.applyOptions({
          color: ai.color,
          lineWidth: 2,
        })
      } else if (selectedAI === name) {
        series.applyOptions({
          color: ai.color,
          lineWidth: 3,
        })
      } else {
        series.applyOptions({
          color: ai.color + '40',
          lineWidth: 1,
        })
      }
    })
  }, [selectedAI, chartData])

  // Handle time range filter
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
    if (!chartRef.current || !hasData) return

    const allData = chartData.flatMap(ai => ai.data)
    if (allData.length === 0) return

    const now = Math.max(...allData.map(d => d.time as number))
    let from: number

    switch (range) {
      case '1D':
        from = now - 86400
        break
      case '1W':
        from = now - 7 * 86400
        break
      case '1M':
        from = now - 30 * 86400
        break
      case '3M':
        from = now - 90 * 86400
        break
      case 'ALL':
      default:
        chartRef.current.timeScale().fitContent()
        return
    }

    chartRef.current.timeScale().setVisibleRange({
      from: from as Time,
      to: now as Time
    })
  }, [chartData, hasData])

  const resetChart = useCallback(() => {
    setSelectedAI(null)
    setTimeRange('ALL')
    chartRef.current?.timeScale().fitContent()
  }, [])

  // Show waiting state if no data
  if (!hasData) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Portfolio Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tracking AI trading model performance
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center" style={{ height: height - 150 }}>
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Waiting for Trading Data</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {competitionStatus?.hasStarted
                ? "Chart data will appear as AI models execute trades and daily snapshots are recorded."
                : "The competition hasn't started yet. Check back on December 27, 2025."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Portfolio Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Live tracking of all AI trading models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <Tabs value={timeRange} onValueChange={(v) => handleTimeRangeChange(v as TimeRange)}>
              <TabsList className="h-8">
                <TabsTrigger value="1D" className="text-xs px-2 h-6">1D</TabsTrigger>
                <TabsTrigger value="1W" className="text-xs px-2 h-6">1W</TabsTrigger>
                <TabsTrigger value="1M" className="text-xs px-2 h-6">1M</TabsTrigger>
                <TabsTrigger value="3M" className="text-xs px-2 h-6">3M</TabsTrigger>
                <TabsTrigger value="ALL" className="text-xs px-2 h-6">ALL</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button variant="outline" size="icon" className="h-8 w-8" onClick={resetChart}>
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Badge variant="secondary" className="gap-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Crosshair Info Bar */}
        {crosshairData && (
          <div className="px-6 py-2 border-b bg-muted/30 flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">{crosshairData.time}</span>
            {Object.entries(crosshairData.values).map(([name, value]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: AI_COLORS[name] }}
                />
                <span className="text-xs text-muted-foreground">{name}:</span>
                <span className="text-xs font-medium">
                  RM {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Chart Container */}
        <div className="relative">
          <div
            ref={chartContainerRef}
            style={{ height: height }}
            className="w-full"
          />

          {/* AI Logo Overlay at end of each line */}
          {logoPositions.map((logo) => (
            <div
              key={logo.name}
              className={cn(
                "absolute pointer-events-none transition-all duration-150 ease-out",
                selectedAI !== null && selectedAI !== logo.name && "opacity-30"
              )}
              style={{
                left: logo.x - 12,
                top: logo.y - 12,
                zIndex: 10,
              }}
            >
              <div
                className="relative h-6 w-6 rounded-full overflow-hidden ring-2 bg-background shadow-lg"
                style={{
                  ['--tw-ring-color' as string]: logo.color,
                  boxShadow: `0 0 8px ${logo.color}40`
                } as React.CSSProperties}
              >
                <Image
                  src={AI_LOGOS[logo.name] || ''}
                  alt={logo.name}
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI Legend / Selector */}
        <div className="px-6 py-4 border-t bg-muted/20">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {sortedData.map((ai, index) => (
              <button
                key={ai.name}
                onClick={() => setSelectedAI(selectedAI === ai.name ? null : ai.name)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  "border hover:shadow-md",
                  selectedAI === ai.name
                    ? "bg-background shadow-md border-primary/50"
                    : selectedAI === null
                      ? "bg-background/50 border-border hover:bg-background"
                      : "bg-muted/30 border-transparent opacity-50"
                )}
              >
                {/* Rank Badge */}
                <span className={cn(
                  "flex items-center justify-center w-5 h-5 rounded text-xs font-bold",
                  index === 0 && "bg-yellow-500 text-white",
                  index === 1 && "bg-slate-400 text-white",
                  index === 2 && "bg-orange-500 text-white",
                  index > 2 && "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </span>

                {/* AI Logo */}
                <div
                  className="relative h-6 w-6 rounded-full overflow-hidden ring-2"
                  style={{ ['--tw-ring-color' as string]: ai.color } as React.CSSProperties}
                >
                  <Image
                    src={AI_LOGOS[ai.name] || ''}
                    alt={ai.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>

                {/* Name & Performance */}
                <div className="text-left">
                  <div className="text-sm font-medium">{ai.name}</div>
                  <div className={cn(
                    "text-xs font-semibold flex items-center gap-0.5",
                    ai.changePercent >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {ai.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {ai.changePercent >= 0 ? "+" : ""}{ai.changePercent.toFixed(2)}%
                  </div>
                </div>

                {/* Current Value */}
                <div className="text-right pl-2 border-l">
                  <div className="text-xs text-muted-foreground">Portfolio</div>
                  <div className="text-sm font-bold">
                    RM {ai.currentValue.toLocaleString('en-MY', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-3 text-xs text-muted-foreground">
            Click on an AI model to highlight its performance • Starting capital: RM 10,000
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
