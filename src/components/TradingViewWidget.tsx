"use client"

import { useEffect, useRef, memo } from "react"

interface TradingViewWidgetProps {
  symbol: string
  stockCode?: string
  height?: number
  theme?: "light" | "dark"
  interval?: string
  showToolbar?: boolean
  showDetails?: boolean
  allowSymbolChange?: boolean
}

// TradingView Symbol Overview Widget
// Uses symbol-overview widget which has better support for Malaysian stocks
// Docs: https://www.tradingview.com/widget/symbol-overview/
function TradingViewWidgetComponent({
  symbol,
  stockCode,
  height = 400,
  theme = "dark",
  interval = "D",
  showToolbar = true,
  showDetails = true,
  allowSymbolChange = false,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)

  // Convert to TradingView symbol format
  // Malaysian stocks use MYX: prefix with ticker symbol
  const tvSymbol = `MYX:${symbol}`

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ""

    // Create widget container
    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = `calc(100% - ${showDetails ? 32 : 0}px)`
    widgetDiv.style.width = "100%"

    widgetContainer.appendChild(widgetDiv)

    if (showDetails) {
      const copyrightDiv = document.createElement("div")
      copyrightDiv.className = "tradingview-widget-copyright"
      copyrightDiv.innerHTML = `<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="text-xs text-muted-foreground">Track all markets on TradingView</span></a>`
      widgetContainer.appendChild(copyrightDiv)
    }

    containerRef.current.appendChild(widgetContainer)

    // Create and load widget script - using symbol-overview for better Malaysian stock support
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [[tvSymbol, tvSymbol]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: theme,
      autosize: true,
      showVolume: true,
      showMA: true,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      lineWidth: 2,
      lineType: 0,
      dateRanges: [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ],
      isTransparent: true,
    })

    widgetDiv.appendChild(script)
    scriptRef.current = script

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, theme, showDetails])

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  )
}

// Mini chart widget for dashboard/list views
interface MiniChartProps {
  symbol: string
  stockCode?: string
  height?: number
  theme?: "light" | "dark"
}

function MiniChartComponent({
  symbol,
  stockCode,
  height = 200,
  theme = "dark",
}: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use ticker symbol, not numeric code
  const tvSymbol = `MYX:${symbol}`

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = "100%"
    widgetDiv.style.width = "100%"

    widgetContainer.appendChild(widgetDiv)
    containerRef.current.appendChild(widgetContainer)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "6M",
      colorTheme: theme,
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      noTimeScale: false,
    })

    widgetDiv.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, theme])

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  )
}

// Symbol Info widget - shows price, change, and basic info
interface SymbolInfoProps {
  symbol: string
  stockCode?: string
  theme?: "light" | "dark"
  width?: number | string
}

function SymbolInfoComponent({
  symbol,
  stockCode,
  theme = "dark",
  width = "100%",
}: SymbolInfoProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use ticker symbol, not numeric code
  const tvSymbol = `MYX:${symbol}`

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"

    widgetContainer.appendChild(widgetDiv)
    containerRef.current.appendChild(widgetContainer)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: typeof width === "number" ? width : "100%",
      locale: "en",
      colorTheme: theme,
      isTransparent: true,
    })

    widgetDiv.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, theme, width])

  return (
    <div
      ref={containerRef}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    />
  )
}

// Technical Analysis widget - shows buy/sell signals
interface TechnicalAnalysisProps {
  symbol: string
  stockCode?: string
  theme?: "light" | "dark"
  height?: number
  interval?: string
}

function TechnicalAnalysisComponent({
  symbol,
  stockCode,
  theme = "dark",
  height = 400,
  interval = "1D",
}: TechnicalAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Use ticker symbol, not numeric code
  const tvSymbol = `MYX:${symbol}`

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = "100%"
    widgetDiv.style.width = "100%"

    widgetContainer.appendChild(widgetDiv)
    containerRef.current.appendChild(widgetContainer)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      interval: interval,
      width: "100%",
      height: "100%",
      symbol: tvSymbol,
      showIntervalTabs: true,
      locale: "en",
      colorTheme: theme,
      isTransparent: true,
    })

    widgetDiv.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [tvSymbol, theme, interval])

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  )
}

// Market Overview widget - shows multiple symbols
interface MarketOverviewProps {
  theme?: "light" | "dark"
  height?: number
}

function MarketOverviewComponent({
  theme = "dark",
  height = 400,
}: MarketOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = ""

    const widgetContainer = document.createElement("div")
    widgetContainer.className = "tradingview-widget-container"
    widgetContainer.style.height = "100%"
    widgetContainer.style.width = "100%"

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    widgetDiv.style.height = "100%"
    widgetDiv.style.width = "100%"

    widgetContainer.appendChild(widgetDiv)
    containerRef.current.appendChild(widgetContainer)

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "100%",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: "rgba(16, 185, 129, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(66, 66, 66, 0.3)",
      scaleFontColor: "rgba(156, 163, 175, 1)",
      belowLineFillColorGrowing: "rgba(16, 185, 129, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(16, 185, 129, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(16, 185, 129, 0.12)",
      tabs: [
        {
          title: "KLSE Top Stocks",
          symbols: [
            { s: "MYX:1155", d: "Maybank" },
            { s: "MYX:1295", d: "Public Bank" },
            { s: "MYX:4715", d: "Genting" },
            { s: "MYX:6888", d: "Axiata" },
            { s: "MYX:4863", d: "Telekom" },
            { s: "MYX:5225", d: "IHH Healthcare" },
            { s: "MYX:3182", d: "Genting Malaysia" },
            { s: "MYX:5183", d: "Petronas Chemicals" },
          ],
          originalTitle: "KLSE Top Stocks",
        },
      ],
    })

    widgetDiv.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
      className="rounded-lg overflow-hidden"
    />
  )
}

// Memoized exports to prevent unnecessary re-renders
export const TradingViewWidget = memo(TradingViewWidgetComponent)
export const TradingViewMiniChart = memo(MiniChartComponent)
export const TradingViewSymbolInfo = memo(SymbolInfoComponent)
export const TradingViewTechnicalAnalysis = memo(TechnicalAnalysisComponent)
export const TradingViewMarketOverview = memo(MarketOverviewComponent)
