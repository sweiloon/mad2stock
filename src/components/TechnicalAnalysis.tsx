"use client"

import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Activity,
  BarChart3,
  LineChart,
  Target,
} from "lucide-react"

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

interface TechnicalAnalysisProps {
  symbol: string
  stockCode: string
  className?: string
}

type Signal = "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell"
type Interval = "1D" | "1W" | "1M"

interface Indicator {
  name: string
  value: number | string
  signal: Signal
}

interface IndicatorGroup {
  name: string
  indicators: Indicator[]
  summary: {
    buy: number
    neutral: number
    sell: number
    signal: Signal
  }
}

// ============================================================================
// TECHNICAL INDICATOR CALCULATIONS
// ============================================================================

// Simple Moving Average
function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null
  const slice = data.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

// Exponential Moving Average
function calculateEMA(data: number[], period: number): number | null {
  if (data.length < period) return null
  const multiplier = 2 / (period + 1)
  let ema = calculateSMA(data.slice(0, period), period)
  if (ema === null) return null

  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema
  }
  return ema
}

// Relative Strength Index (RSI)
function calculateRSI(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null

  let gains = 0
  let losses = 0

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  // Smooth RSI calculation
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period
    }
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// MACD (Moving Average Convergence Divergence)
function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)

  if (ema12 === null || ema26 === null) return null

  const macdLine = ema12 - ema26

  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = []
  for (let i = 26; i <= closes.length; i++) {
    const ema12i = calculateEMA(closes.slice(0, i), 12)
    const ema26i = calculateEMA(closes.slice(0, i), 26)
    if (ema12i !== null && ema26i !== null) {
      macdValues.push(ema12i - ema26i)
    }
  }

  const signalLine = calculateEMA(macdValues, 9)
  if (signalLine === null) return null

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  }
}

// Stochastic Oscillator
function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): { k: number; d: number } | null {
  if (closes.length < period) return null

  const recentHighs = highs.slice(-period)
  const recentLows = lows.slice(-period)
  const currentClose = closes[closes.length - 1]

  const highestHigh = Math.max(...recentHighs)
  const lowestLow = Math.min(...recentLows)

  if (highestHigh === lowestLow) return null

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100

  // Calculate %D (3-period SMA of %K)
  const kValues: number[] = []
  for (let i = period; i <= closes.length; i++) {
    const h = highs.slice(i - period, i)
    const l = lows.slice(i - period, i)
    const c = closes[i - 1]
    const hh = Math.max(...h)
    const ll = Math.min(...l)
    if (hh !== ll) {
      kValues.push(((c - ll) / (hh - ll)) * 100)
    }
  }

  const d = kValues.length >= 3 ? calculateSMA(kValues, 3) : k

  return { k, d: d ?? k }
}

// Williams %R
function calculateWilliamsR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number | null {
  if (closes.length < period) return null

  const recentHighs = highs.slice(-period)
  const recentLows = lows.slice(-period)
  const currentClose = closes[closes.length - 1]

  const highestHigh = Math.max(...recentHighs)
  const lowestLow = Math.min(...recentLows)

  if (highestHigh === lowestLow) return null

  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100
}

// CCI (Commodity Channel Index)
function calculateCCI(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 20
): number | null {
  if (closes.length < period) return null

  const typicalPrices: number[] = []
  for (let i = 0; i < closes.length; i++) {
    typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3)
  }

  const sma = calculateSMA(typicalPrices, period)
  if (sma === null) return null

  // Mean deviation
  const recentTP = typicalPrices.slice(-period)
  const meanDeviation = recentTP.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period

  if (meanDeviation === 0) return null

  const currentTP = typicalPrices[typicalPrices.length - 1]
  return (currentTP - sma) / (0.015 * meanDeviation)
}

// ADX (Average Directional Index)
function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number | null {
  if (closes.length < period * 2) return null

  // Simplified ADX calculation
  let sumDX = 0
  let count = 0

  for (let i = period; i < closes.length; i++) {
    const trueRange = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    )

    const plusDM = highs[i] - highs[i - 1] > lows[i - 1] - lows[i]
      ? Math.max(highs[i] - highs[i - 1], 0)
      : 0

    const minusDM = lows[i - 1] - lows[i] > highs[i] - highs[i - 1]
      ? Math.max(lows[i - 1] - lows[i], 0)
      : 0

    if (trueRange > 0) {
      const plusDI = (plusDM / trueRange) * 100
      const minusDI = (minusDM / trueRange) * 100
      const diSum = plusDI + minusDI
      if (diSum > 0) {
        sumDX += Math.abs(plusDI - minusDI) / diSum * 100
        count++
      }
    }
  }

  return count > 0 ? sumDX / count : null
}

// Determine signal from value
function getSignalFromValue(value: number, type: string): Signal {
  switch (type) {
    case "rsi":
      if (value > 70) return "sell"
      if (value > 60) return "neutral"
      if (value < 30) return "buy"
      if (value < 40) return "neutral"
      return "neutral"

    case "stochastic":
      if (value > 80) return "sell"
      if (value < 20) return "buy"
      return "neutral"

    case "williamsR":
      if (value > -20) return "sell"
      if (value < -80) return "buy"
      return "neutral"

    case "cci":
      if (value > 100) return "sell"
      if (value < -100) return "buy"
      return "neutral"

    case "macd":
      if (value > 0.05) return "buy"
      if (value < -0.05) return "sell"
      return "neutral"

    case "adx":
      // ADX measures trend strength, not direction
      return "neutral"

    case "ma":
      // Positive = price above MA = bullish
      if (value > 2) return "buy"
      if (value < -2) return "sell"
      return "neutral"

    default:
      return "neutral"
  }
}

// ============================================================================
// TECHNICAL ANALYSIS COMPONENT
// ============================================================================

export function TechnicalAnalysis({
  symbol,
  stockCode,
  className,
}: TechnicalAnalysisProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StockHistoricalData[]>([])
  const [interval, setInterval] = useState<Interval>("1D")

  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch enough data for calculations (use 6mo for daily)
        const period = interval === "1D" ? "6mo" : interval === "1W" ? "1y" : "5y"
        const response = await fetch(`/api/stocks/history?symbol=${stockCode}&period=${period}`)

        if (!response.ok) throw new Error("Failed to fetch data")

        const result = await response.json()
        if (result.history && result.history.length > 0) {
          setData(result.history)
        } else {
          setError("No data available")
        }
      } catch (err) {
        setError("Failed to load analysis data")
        console.error("Technical analysis error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [stockCode, interval])

  // Calculate all indicators
  const analysis = useMemo(() => {
    if (data.length < 30) return null

    const closes = data.map((d) => d.close)
    const highs = data.map((d) => d.high)
    const lows = data.map((d) => d.low)
    const currentPrice = closes[closes.length - 1]

    // Moving Averages
    const sma5 = calculateSMA(closes, 5)
    const sma10 = calculateSMA(closes, 10)
    const sma20 = calculateSMA(closes, 20)
    const sma50 = calculateSMA(closes, 50)
    const sma100 = calculateSMA(closes, 100)
    const sma200 = calculateSMA(closes, 200)
    const ema5 = calculateEMA(closes, 5)
    const ema10 = calculateEMA(closes, 10)
    const ema20 = calculateEMA(closes, 20)
    const ema50 = calculateEMA(closes, 50)
    const ema100 = calculateEMA(closes, 100)
    const ema200 = calculateEMA(closes, 200)

    // Oscillators
    const rsi = calculateRSI(closes, 14)
    const macd = calculateMACD(closes)
    const stochastic = calculateStochastic(highs, lows, closes, 14)
    const williamsR = calculateWilliamsR(highs, lows, closes, 14)
    const cci = calculateCCI(highs, lows, closes, 20)
    const adx = calculateADX(highs, lows, closes, 14)

    // Build indicator groups
    const oscillators: Indicator[] = []
    const movingAverages: Indicator[] = []

    // Oscillators
    if (rsi !== null) {
      oscillators.push({
        name: "RSI (14)",
        value: rsi.toFixed(2),
        signal: getSignalFromValue(rsi, "rsi"),
      })
    }

    if (stochastic !== null) {
      oscillators.push({
        name: "Stochastic %K",
        value: stochastic.k.toFixed(2),
        signal: getSignalFromValue(stochastic.k, "stochastic"),
      })
    }

    if (cci !== null) {
      oscillators.push({
        name: "CCI (20)",
        value: cci.toFixed(2),
        signal: getSignalFromValue(cci, "cci"),
      })
    }

    if (macd !== null) {
      oscillators.push({
        name: "MACD",
        value: macd.histogram.toFixed(4),
        signal: getSignalFromValue(macd.histogram, "macd"),
      })
    }

    if (williamsR !== null) {
      oscillators.push({
        name: "Williams %R",
        value: williamsR.toFixed(2),
        signal: getSignalFromValue(williamsR, "williamsR"),
      })
    }

    if (adx !== null) {
      oscillators.push({
        name: "ADX (14)",
        value: adx.toFixed(2),
        signal: getSignalFromValue(adx, "adx"),
      })
    }

    // Moving Averages
    const maList = [
      { name: "SMA (5)", value: sma5 },
      { name: "SMA (10)", value: sma10 },
      { name: "SMA (20)", value: sma20 },
      { name: "SMA (50)", value: sma50 },
      { name: "SMA (100)", value: sma100 },
      { name: "SMA (200)", value: sma200 },
      { name: "EMA (5)", value: ema5 },
      { name: "EMA (10)", value: ema10 },
      { name: "EMA (20)", value: ema20 },
      { name: "EMA (50)", value: ema50 },
      { name: "EMA (100)", value: ema100 },
      { name: "EMA (200)", value: ema200 },
    ]

    maList.forEach(({ name, value }) => {
      if (value !== null) {
        const diff = ((currentPrice - value) / value) * 100
        movingAverages.push({
          name,
          value: value.toFixed(3),
          signal: getSignalFromValue(diff, "ma"),
        })
      }
    })

    // Calculate summaries
    const calculateSummary = (indicators: Indicator[]) => {
      const counts = { buy: 0, neutral: 0, sell: 0 }
      indicators.forEach((ind) => {
        if (ind.signal === "buy" || ind.signal === "strong_buy") counts.buy++
        else if (ind.signal === "sell" || ind.signal === "strong_sell") counts.sell++
        else counts.neutral++
      })

      let signal: Signal = "neutral"
      if (counts.buy > counts.sell + counts.neutral) signal = "strong_buy"
      else if (counts.buy > counts.sell) signal = "buy"
      else if (counts.sell > counts.buy + counts.neutral) signal = "strong_sell"
      else if (counts.sell > counts.buy) signal = "sell"

      return { ...counts, signal }
    }

    const oscillatorsSummary = calculateSummary(oscillators)
    const maSummary = calculateSummary(movingAverages)

    // Overall summary
    const allIndicators = [...oscillators, ...movingAverages]
    const overallSummary = calculateSummary(allIndicators)

    return {
      oscillators: {
        name: "Oscillators",
        indicators: oscillators,
        summary: oscillatorsSummary,
      },
      movingAverages: {
        name: "Moving Averages",
        indicators: movingAverages,
        summary: maSummary,
      },
      overall: overallSummary,
      currentPrice,
    }
  }, [data])

  // Signal styling
  const getSignalStyle = (signal: Signal) => {
    switch (signal) {
      case "strong_buy":
        return "text-emerald-500 bg-emerald-500/10"
      case "buy":
        return "text-emerald-400 bg-emerald-400/10"
      case "neutral":
        return "text-gray-400 bg-gray-400/10"
      case "sell":
        return "text-red-400 bg-red-400/10"
      case "strong_sell":
        return "text-red-500 bg-red-500/10"
    }
  }

  const getSignalLabel = (signal: Signal) => {
    switch (signal) {
      case "strong_buy":
        return "Strong Buy"
      case "buy":
        return "Buy"
      case "neutral":
        return "Neutral"
      case "sell":
        return "Sell"
      case "strong_sell":
        return "Strong Sell"
    }
  }

  const getSignalIcon = (signal: Signal) => {
    if (signal === "buy" || signal === "strong_buy") {
      return <TrendingUp className="h-4 w-4" />
    }
    if (signal === "sell" || signal === "strong_sell") {
      return <TrendingDown className="h-4 w-4" />
    }
    return <Minus className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-muted-foreground", className)}>
        <Activity className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">{error || "Unable to calculate technical analysis"}</p>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold">Technical Analysis</span>
          <span className="text-sm text-muted-foreground">{symbol}</span>
        </div>

        {/* Interval selector */}
        <div className="flex items-center border rounded-md">
          {(["1D", "1W", "1M"] as Interval[]).map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors",
                interval === int
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                int === "1D" && "rounded-l-md",
                int === "1M" && "rounded-r-md"
              )}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Gauge */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-center gap-8">
          {/* Overall Signal */}
          <div className="text-center">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold",
              getSignalStyle(analysis.overall.signal)
            )}>
              {getSignalIcon(analysis.overall.signal)}
              {getSignalLabel(analysis.overall.signal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Signal</p>
          </div>

          {/* Signal counts */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{analysis.overall.buy}</p>
              <p className="text-xs text-muted-foreground">Buy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{analysis.overall.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{analysis.overall.sell}</p>
              <p className="text-xs text-muted-foreground">Sell</p>
            </div>
          </div>
        </div>

        {/* Signal meter */}
        <div className="mt-4">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-white rounded shadow-lg border border-gray-300 transition-all duration-300"
              style={{
                left: `${(() => {
                  const total = analysis.overall.buy + analysis.overall.neutral + analysis.overall.sell
                  if (total === 0) return 50
                  const score = (analysis.overall.buy - analysis.overall.sell) / total
                  return 50 + score * 45
                })()}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Strong Sell</span>
            <span>Sell</span>
            <span>Neutral</span>
            <span>Buy</span>
            <span>Strong Buy</span>
          </div>
        </div>
      </div>

      {/* Indicator Groups */}
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Oscillators */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" />
              <span className="font-medium">Oscillators</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              getSignalStyle(analysis.oscillators.summary.signal)
            )}>
              {getSignalLabel(analysis.oscillators.summary.signal)}
            </span>
          </div>

          <div className="space-y-2">
            {analysis.oscillators.indicators.map((ind) => (
              <div key={ind.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ind.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{ind.value}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    getSignalStyle(ind.signal)
                  )}>
                    {ind.signal === "buy" ? "Buy" : ind.signal === "sell" ? "Sell" : "Neutral"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border text-xs">
            <span className="text-emerald-500">Buy: {analysis.oscillators.summary.buy}</span>
            <span className="text-gray-400">Neutral: {analysis.oscillators.summary.neutral}</span>
            <span className="text-red-500">Sell: {analysis.oscillators.summary.sell}</span>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-medium">Moving Averages</span>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              getSignalStyle(analysis.movingAverages.summary.signal)
            )}>
              {getSignalLabel(analysis.movingAverages.summary.signal)}
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analysis.movingAverages.indicators.map((ind) => (
              <div key={ind.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{ind.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{ind.value}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    getSignalStyle(ind.signal)
                  )}>
                    {ind.signal === "buy" ? "Buy" : ind.signal === "sell" ? "Sell" : "Neutral"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border text-xs">
            <span className="text-emerald-500">Buy: {analysis.movingAverages.summary.buy}</span>
            <span className="text-gray-400">Neutral: {analysis.movingAverages.summary.neutral}</span>
            <span className="text-red-500">Sell: {analysis.movingAverages.summary.sell}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground text-center">
        Current Price: RM {analysis.currentPrice.toFixed(2)} • Based on {data.length} data points • {interval} timeframe
      </div>
    </div>
  )
}
