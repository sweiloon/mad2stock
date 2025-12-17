"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  Time,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  AreaData
} from "lightweight-charts"
import { cn } from "@/lib/utils"
import { Loader2, TrendingUp, TrendingDown, BarChart3, CandlestickChart } from "lucide-react"

// ============================================================================
// TYPES
// ============================================================================

interface StockHistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface StockChartProps {
  symbol: string
  stockCode: string
  height?: number
  className?: string
  showVolume?: boolean
  defaultPeriod?: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y"
  defaultChartType?: "area" | "candlestick"
}

interface ChartLegendData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  change: number
  changePercent: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PERIODS = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "6M", value: "6mo" },
  { label: "1Y", value: "1y" },
  { label: "5Y", value: "5y" },
] as const

const CHART_COLORS = {
  background: "transparent",
  lineColor: "#10b981",
  areaTopColor: "rgba(16, 185, 129, 0.4)",
  areaBottomColor: "rgba(16, 185, 129, 0.0)",
  textColor: "#9ca3af",
  gridColor: "rgba(107, 114, 128, 0.1)",
  upColor: "#10b981",
  downColor: "#ef4444",
  volumeUp: "rgba(16, 185, 129, 0.5)",
  volumeDown: "rgba(239, 68, 68, 0.5)",
  crosshairColor: "#6b7280",
}

// ============================================================================
// CHART COMPONENT
// ============================================================================

export function StockChart({
  symbol,
  stockCode,
  height = 400,
  className,
  showVolume = true,
  defaultPeriod = "3mo",
  defaultChartType = "area",
}: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null)

  const [period, setPeriod] = useState<string>(defaultPeriod)
  const [chartType, setChartType] = useState<"area" | "candlestick">(defaultChartType)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StockHistoricalData[]>([])
  const [legendData, setLegendData] = useState<ChartLegendData | null>(null)

  // Fetch historical data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/stocks/history?symbol=${stockCode}&period=${period}`)
      if (!response.ok) throw new Error("Failed to fetch data")

      const result = await response.json()
      if (result.history && result.history.length > 0) {
        setData(result.history)
      } else {
        setError("No historical data available")
      }
    } catch (err) {
      setError("Failed to load chart data")
      console.error("Chart data error:", err)
    } finally {
      setLoading(false)
    }
  }, [stockCode, period])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.textColor,
      },
      grid: {
        vertLines: { color: CHART_COLORS.gridColor },
        horzLines: { color: CHART_COLORS.gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: height - 60, // Account for controls
      crosshair: {
        mode: 1,
        vertLine: {
          color: CHART_COLORS.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: "#374151",
        },
        horzLine: {
          color: CHART_COLORS.crosshairColor,
          width: 1,
          style: 2,
          labelBackgroundColor: "#374151",
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.gridColor,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [height, showVolume])

  // Update chart data when data or chart type changes
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    // Remove existing series
    if (mainSeriesRef.current) {
      chartRef.current.removeSeries(mainSeriesRef.current)
      mainSeriesRef.current = null
    }
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current)
      volumeSeriesRef.current = null
    }

    // Create main series based on chart type
    if (chartType === "candlestick") {
      const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: CHART_COLORS.upColor,
        downColor: CHART_COLORS.downColor,
        borderUpColor: CHART_COLORS.upColor,
        borderDownColor: CHART_COLORS.downColor,
        wickUpColor: CHART_COLORS.upColor,
        wickDownColor: CHART_COLORS.downColor,
      })

      const candleData: CandlestickData[] = data.map((d) => ({
        time: d.date.split("T")[0] as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))

      candlestickSeries.setData(candleData)
      mainSeriesRef.current = candlestickSeries
    } else {
      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        lineColor: CHART_COLORS.lineColor,
        topColor: CHART_COLORS.areaTopColor,
        bottomColor: CHART_COLORS.areaBottomColor,
        lineWidth: 2,
      })

      const areaData: AreaData[] = data.map((d) => ({
        time: d.date.split("T")[0] as Time,
        value: d.close,
      }))

      areaSeries.setData(areaData)
      mainSeriesRef.current = areaSeries
    }

    // Add volume series
    if (showVolume) {
      const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
        color: CHART_COLORS.volumeUp,
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
      })

      chartRef.current.priceScale("volume").applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      })

      const volumeData: HistogramData[] = data.map((d, i) => ({
        time: d.date.split("T")[0] as Time,
        value: d.volume,
        color: i > 0 && d.close >= data[i - 1].close
          ? CHART_COLORS.volumeUp
          : CHART_COLORS.volumeDown,
      }))

      volumeSeries.setData(volumeData)
      volumeSeriesRef.current = volumeSeries
    }

    // Fit content
    chartRef.current.timeScale().fitContent()

    // Set up crosshair move handler for legend
    chartRef.current.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        // Show latest data when not hovering
        const latest = data[data.length - 1]
        const prev = data.length > 1 ? data[data.length - 2] : latest
        if (latest) {
          setLegendData({
            time: new Date(latest.date).toLocaleDateString(),
            open: latest.open,
            high: latest.high,
            low: latest.low,
            close: latest.close,
            volume: latest.volume,
            change: latest.close - prev.close,
            changePercent: ((latest.close - prev.close) / prev.close) * 100,
          })
        }
        return
      }

      // Find the data point for this time
      const timeStr = param.time.toString()
      const dataPoint = data.find((d) => d.date.startsWith(timeStr))
      const dataIndex = data.findIndex((d) => d.date.startsWith(timeStr))
      const prevPoint = dataIndex > 0 ? data[dataIndex - 1] : dataPoint

      if (dataPoint && prevPoint) {
        setLegendData({
          time: new Date(dataPoint.date).toLocaleDateString(),
          open: dataPoint.open,
          high: dataPoint.high,
          low: dataPoint.low,
          close: dataPoint.close,
          volume: dataPoint.volume,
          change: dataPoint.close - prevPoint.close,
          changePercent: ((dataPoint.close - prevPoint.close) / prevPoint.close) * 100,
        })
      }
    })

    // Show latest data initially
    const latest = data[data.length - 1]
    const prev = data.length > 1 ? data[data.length - 2] : latest
    if (latest) {
      setLegendData({
        time: new Date(latest.date).toLocaleDateString(),
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
        change: latest.close - prev.close,
        changePercent: ((latest.close - prev.close) / prev.close) * 100,
      })
    }
  }, [data, chartType, showVolume])

  // Fetch data on mount and period change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`
    return vol.toString()
  }

  return (
    <div className={cn("relative rounded-lg bg-card", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{symbol}</span>
            {legendData && (
              <span className={cn(
                "text-sm font-medium",
                legendData.change >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                RM {legendData.close.toFixed(2)}
                <span className="ml-1 text-xs">
                  {legendData.change >= 0 ? "+" : ""}
                  {legendData.change.toFixed(2)} ({legendData.changePercent.toFixed(2)}%)
                </span>
              </span>
            )}
          </div>
          {legendData && (
            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
              <span>O: {legendData.open.toFixed(2)}</span>
              <span>H: {legendData.high.toFixed(2)}</span>
              <span>L: {legendData.low.toFixed(2)}</span>
              <span>C: {legendData.close.toFixed(2)}</span>
              <span>Vol: {formatVolume(legendData.volume)}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "p-1.5 rounded-l-md transition-colors",
                chartType === "area"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              title="Area Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType("candlestick")}
              className={cn(
                "p-1.5 rounded-r-md transition-colors",
                chartType === "candlestick"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              title="Candlestick Chart"
            >
              <CandlestickChart className="h-4 w-4" />
            </button>
          </div>

          {/* Period selector */}
          <div className="flex items-center border rounded-md">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-2 py-1 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  p.value === "1d" && "rounded-l-md",
                  p.value === "5y" && "rounded-r-md"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative" style={{ height: height - 60 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 z-10">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-primary text-sm hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
        <span>Data from Yahoo Finance • {data.length} data points</span>
        <span>{legendData?.time}</span>
      </div>
    </div>
  )
}

// ============================================================================
// MINI CHART COMPONENT (for dashboard/list views)
// ============================================================================

interface MiniChartProps {
  symbol: string
  stockCode: string
  height?: number
  className?: string
  period?: "1d" | "5d" | "1mo" | "3mo"
}

export function MiniStockChart({
  symbol,
  stockCode,
  height = 120,
  className,
  period = "1mo",
}: MiniChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<StockHistoricalData[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/stocks/history?symbol=${stockCode}&period=${period}`)
        if (response.ok) {
          const result = await response.json()
          if (result.history) setData(result.history)
        }
      } catch (err) {
        console.error("Mini chart error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [stockCode, period])

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: CHART_COLORS.textColor,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScale: false,
      handleScroll: false,
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
    })

    const isPositive = data.length > 1 && data[data.length - 1].close >= data[0].close

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: isPositive ? CHART_COLORS.upColor : CHART_COLORS.downColor,
      topColor: isPositive
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(239, 68, 68, 0.3)",
      bottomColor: isPositive
        ? "rgba(16, 185, 129, 0.0)"
        : "rgba(239, 68, 68, 0.0)",
      lineWidth: 2,
    })

    const areaData: AreaData[] = data.map((d) => ({
      time: d.date.split("T")[0] as Time,
      value: d.close,
    }))

    areaSeries.setData(areaData)
    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [data, height])

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground text-xs", className)} style={{ height }}>
        No data
      </div>
    )
  }

  const change = data.length > 1 ? data[data.length - 1].close - data[0].close : 0
  const changePercent = data.length > 1 ? (change / data[0].close) * 100 : 0

  return (
    <div className={cn("relative", className)}>
      <div ref={chartContainerRef} style={{ height }} />
      <div className={cn(
        "absolute bottom-1 right-1 text-xs font-medium px-1.5 py-0.5 rounded",
        change >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
      )}>
        {change >= 0 ? "+" : ""}{changePercent.toFixed(1)}%
      </div>
    </div>
  )
}
