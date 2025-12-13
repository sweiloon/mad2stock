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
  Play,
  Pause,
  RotateCcw,
  Maximize2
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// AI Logo mapping
const AI_LOGOS: Record<string, string> = {
  'DeepSeek': '/images/deepseek-logo.png',
  'Grok': '/images/Grok-logo.png',
  'Claude': '/images/claude-logo.webp',
  'ChatGPT': '/images/openai-logo.png',
  'Gemini': '/images/gemini-logo.png',
}

// AI Colors matching the arena theme
const AI_COLORS: Record<string, string> = {
  'DeepSeek': '#3B82F6',  // Blue
  'Grok': '#000000',      // Black
  'Claude': '#D97706',    // Orange/Amber
  'ChatGPT': '#10B981',   // Green
  'Gemini': '#8B5CF6',    // Purple
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
  showDemoData?: boolean
}

// Generate realistic demo competition data
function generateDemoData(): AIPerformanceData[] {
  const startDate = new Date('2024-12-01')
  const days = 30
  const startingCapital = 10000

  const aiModels = [
    { name: 'DeepSeek', volatility: 0.015, trend: 0.003, color: AI_COLORS['DeepSeek'] },
    { name: 'Claude', volatility: 0.012, trend: 0.0025, color: AI_COLORS['Claude'] },
    { name: 'ChatGPT', volatility: 0.018, trend: 0.002, color: AI_COLORS['ChatGPT'] },
    { name: 'Grok', volatility: 0.02, trend: 0.0015, color: AI_COLORS['Grok'] },
    { name: 'Gemini', volatility: 0.014, trend: 0.001, color: AI_COLORS['Gemini'] },
  ]

  return aiModels.map(ai => {
    let currentValue = startingCapital
    const data: LineData<Time>[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      // Generate random walk with trend
      const randomChange = (Math.random() - 0.5) * 2 * ai.volatility
      const trendChange = ai.trend
      currentValue = currentValue * (1 + randomChange + trendChange)

      // Add some market events (dips and rallies)
      if (i === 10) currentValue *= (ai.name === 'DeepSeek' ? 1.03 : 0.98)
      if (i === 15) currentValue *= (ai.name === 'Claude' ? 1.025 : 1.01)
      if (i === 20) currentValue *= (ai.name === 'ChatGPT' ? 0.97 : 1.005)

      const timestamp = Math.floor(date.getTime() / 1000) as Time

      data.push({
        time: timestamp,
        value: Math.round(currentValue * 100) / 100
      })
    }

    const finalValue = data[data.length - 1]?.value || startingCapital
    const changePercent = ((finalValue - startingCapital) / startingCapital) * 100

    return {
      name: ai.name,
      color: ai.color,
      data,
      currentValue: finalValue,
      changePercent
    }
  })
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | 'ALL'

interface LogoPosition {
  name: string
  x: number
  y: number
  color: string
  visible: boolean
}

export function ArenaChart({ height = 500, showDemoData = true }: ArenaChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRefs = useRef<Map<string, ISeriesApi<"Line">>>(new Map())

  const [demoData] = useState<AIPerformanceData[]>(() => generateDemoData())
  const [selectedAI, setSelectedAI] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
  const [isPlaying, setIsPlaying] = useState(false)
  const [crosshairData, setCrosshairData] = useState<{ time: string; values: Record<string, number> } | null>(null)
  const [logoPositions, setLogoPositions] = useState<LogoPosition[]>([])

  // Sort by performance
  const sortedData = [...demoData].sort((a, b) => b.changePercent - a.changePercent)

  // Function to update logo positions based on chart coordinates
  const updateLogoPositions = useCallback(() => {
    if (!chartRef.current || !chartContainerRef.current) return

    const chart = chartRef.current
    const timeScale = chart.timeScale()
    const positions: LogoPosition[] = []

    demoData.forEach(ai => {
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
  }, [demoData])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

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
    demoData.forEach(ai => {
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

    // Add starting line marker
    const startingLine = chart.addSeries(LineSeries, {
      color: 'rgba(156, 163, 175, 0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    if (demoData[0]?.data.length > 0) {
      const startTime = demoData[0].data[0].time
      const endTime = demoData[0].data[demoData[0].data.length - 1].time
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

    // Subscribe to visible logical range change for better tracking
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      updateLogoPositions()
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
        // Update logo positions after resize
        setTimeout(() => updateLogoPositions(), 50)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      seriesRefs.current.clear()
    }
  }, [demoData, updateLogoPositions])

  // Handle AI selection (highlight/dim)
  useEffect(() => {
    seriesRefs.current.forEach((series, name) => {
      const ai = demoData.find(a => a.name === name)
      if (!ai) return

      if (selectedAI === null) {
        // Show all with full opacity
        series.applyOptions({
          color: ai.color,
          lineWidth: 2,
        })
      } else if (selectedAI === name) {
        // Highlight selected
        series.applyOptions({
          color: ai.color,
          lineWidth: 3,
        })
      } else {
        // Dim others
        series.applyOptions({
          color: ai.color + '40',
          lineWidth: 1,
        })
      }
    })
  }, [selectedAI, demoData])

  // Handle time range filter
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
    if (!chartRef.current || demoData[0]?.data.length === 0) return

    const now = demoData[0].data[demoData[0].data.length - 1].time as number
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
  }, [demoData])

  const resetChart = useCallback(() => {
    setSelectedAI(null)
    setTimeRange('ALL')
    chartRef.current?.timeScale().fitContent()
  }, [])

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
              DEMO MODE
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
                left: logo.x - 12, // Center the 24px logo
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
