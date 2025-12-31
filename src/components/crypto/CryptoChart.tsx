"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Kline } from "@/lib/crypto"
import type { ChartInterval } from "@/hooks/use-crypto-chart"

// ============================================
// TYPES
// ============================================

interface CryptoChartProps {
  symbol: string
  klines: Kline[]
  isLoading?: boolean
  height?: number
  showVolume?: boolean
  showMA?: boolean
}

// ============================================
// INTERVAL OPTIONS
// ============================================

const INTERVALS: { label: string; value: ChartInterval }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
]

// ============================================
// MAIN COMPONENT
// ============================================

export function CryptoChart({
  symbol,
  klines,
  isLoading = false,
  height = 400,
  showVolume = true,
  showMA = true,
}: CryptoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  const ma20SeriesRef = useRef<any>(null)
  const ma50SeriesRef = useRef<any>(null)

  const [selectedInterval, setSelectedInterval] = useState<ChartInterval>("1h")
  const [chartLoaded, setChartLoaded] = useState(false)

  // Initialize chart
  useEffect(() => {
    let chart: any = null

    const initChart = async () => {
      if (!containerRef.current) return

      try {
        // Dynamically import lightweight-charts
        const { createChart, ColorType, CrosshairMode } = await import(
          "lightweight-charts"
        )

        // Clear previous chart
        if (chartRef.current) {
          chartRef.current.remove()
        }

        // Create new chart
        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: height,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#71717a",
          },
          grid: {
            vertLines: { color: "#27272a" },
            horzLines: { color: "#27272a" },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: "#3f3f46",
            scaleMargins: {
              top: 0.1,
              bottom: showVolume ? 0.25 : 0.1,
            },
          },
          timeScale: {
            borderColor: "#3f3f46",
            timeVisible: true,
            secondsVisible: false,
          },
        })

        // Create candlestick series
        const candleSeries = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        })

        candleSeriesRef.current = candleSeries

        // Create volume series
        if (showVolume) {
          const volumeSeries = chart.addHistogramSeries({
            color: "#6366f1",
            priceFormat: {
              type: "volume",
            },
            priceScaleId: "",
            scaleMargins: {
              top: 0.8,
              bottom: 0,
            },
          })
          volumeSeriesRef.current = volumeSeries
        }

        // Create MA series
        if (showMA) {
          const ma20Series = chart.addLineSeries({
            color: "#f59e0b",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          ma20SeriesRef.current = ma20Series

          const ma50Series = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          })
          ma50SeriesRef.current = ma50Series
        }

        chartRef.current = chart
        setChartLoaded(true)

        // Handle resize
        const handleResize = () => {
          if (containerRef.current && chart) {
            chart.applyOptions({ width: containerRef.current.clientWidth })
          }
        }

        window.addEventListener("resize", handleResize)

        return () => {
          window.removeEventListener("resize", handleResize)
        }
      } catch (error) {
        console.error("Failed to load chart:", error)
      }
    }

    initChart()

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height, showVolume, showMA])

  // Update chart data
  useEffect(() => {
    if (!chartLoaded || !candleSeriesRef.current || klines.length === 0) return

    // Format data for chart
    const candleData = klines.map((k) => ({
      time: Math.floor(k.openTime.getTime() / 1000) as any,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }))

    candleSeriesRef.current.setData(candleData)

    // Volume data
    if (volumeSeriesRef.current) {
      const volumeData = klines.map((k) => ({
        time: Math.floor(k.openTime.getTime() / 1000) as any,
        value: k.volume,
        color: k.close >= k.open ? "#22c55e40" : "#ef444440",
      }))
      volumeSeriesRef.current.setData(volumeData)
    }

    // MA data
    if (ma20SeriesRef.current && showMA) {
      const ma20Data = calculateMA(klines, 20)
      ma20SeriesRef.current.setData(ma20Data)
    }

    if (ma50SeriesRef.current && showMA) {
      const ma50Data = calculateMA(klines, 50)
      ma50SeriesRef.current.setData(ma50Data)
    }

    // Fit content
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [klines, chartLoaded, showMA])

  if (isLoading) {
    return <Skeleton className="w-full" style={{ height }} />
  }

  return (
    <div className="space-y-3">
      {/* Interval Selector */}
      <div className="flex items-center gap-1">
        {INTERVALS.map((interval) => (
          <Button
            key={interval.value}
            variant={selectedInterval === interval.value ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSelectedInterval(interval.value)}
          >
            {interval.label}
          </Button>
        ))}

        {/* Legend */}
        {showMA && (
          <div className="ml-auto flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-500" />
              MA20
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-violet-500" />
              MA50
            </span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />

      {/* Price Summary */}
      {klines.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            O: {klines[klines.length - 1]?.open.toFixed(2)} |
            H: {klines[klines.length - 1]?.high.toFixed(2)} |
            L: {klines[klines.length - 1]?.low.toFixed(2)} |
            C: {klines[klines.length - 1]?.close.toFixed(2)}
          </span>
          <span>
            Vol: {formatVolume(klines[klines.length - 1]?.volume || 0)}
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================
// HELPERS
// ============================================

function calculateMA(
  klines: Kline[],
  period: number
): { time: any; value: number }[] {
  const result: { time: any; value: number }[] = []

  for (let i = period - 1; i < klines.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += klines[i - j].close
    }
    result.push({
      time: Math.floor(klines[i].openTime.getTime() / 1000),
      value: sum / period,
    })
  }

  return result
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
  return volume.toFixed(2)
}

// ============================================
// MINI SPARKLINE CHART
// ============================================

export function MiniSparkline({
  data,
  width = 100,
  height = 30,
  color,
}: {
  data: number[]
  width?: number
  height?: number
  color?: "green" | "red" | "neutral"
}) {
  if (data.length < 2) {
    return <div style={{ width, height }} className="bg-muted rounded" />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  const strokeColor =
    color === "green"
      ? "#22c55e"
      : color === "red"
      ? "#ef4444"
      : "#71717a"

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
