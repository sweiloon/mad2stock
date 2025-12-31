"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { QUOTE_CURRENCIES } from "@/lib/crypto"

// ============================================
// TYPES
// ============================================

interface TradingPairSelectorProps {
  symbol: string
  selectedPair: string
  onPairChange: (pair: string) => void
  availablePairs?: string[]
  disabled?: boolean
}

// ============================================
// PAIR DISPLAY INFO
// ============================================

const PAIR_INFO: Record<string, { label: string; icon: string; color: string }> = {
  USDT: { label: "USDT", icon: "💵", color: "text-green-600" },
  USDC: { label: "USDC", icon: "🔵", color: "text-blue-600" },
  BTC: { label: "BTC", icon: "₿", color: "text-amber-500" },
  ETH: { label: "ETH", icon: "Ξ", color: "text-purple-500" },
  BNB: { label: "BNB", icon: "🔶", color: "text-yellow-500" },
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TradingPairSelector({
  symbol,
  selectedPair,
  onPairChange,
  availablePairs,
  disabled = false,
}: TradingPairSelectorProps) {
  const pairs = availablePairs || [...QUOTE_CURRENCIES]
  const selectedQuote = selectedPair.replace(symbol, "")
  const pairInfo = PAIR_INFO[selectedQuote] || { label: selectedQuote, icon: "🪙", color: "" }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
        >
          <span className={pairInfo.color}>{pairInfo.icon}</span>
          <span className="font-mono">
            {symbol}/{selectedQuote}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {pairs.map((quote) => {
          const info = PAIR_INFO[quote] || { label: quote, icon: "🪙", color: "" }
          const isSelected = selectedQuote === quote

          return (
            <DropdownMenuItem
              key={quote}
              className={cn(
                "flex items-center justify-between gap-2 cursor-pointer",
                isSelected && "bg-muted"
              )}
              onClick={() => onPairChange(`${symbol}${quote}`)}
            >
              <div className="flex items-center gap-2">
                <span className={info.color}>{info.icon}</span>
                <span className="font-mono">
                  {symbol}/{quote}
                </span>
              </div>
              {isSelected && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================
// PAIR TABS
// ============================================

export function TradingPairTabs({
  symbol,
  selectedPair,
  onPairChange,
  availablePairs,
}: Omit<TradingPairSelectorProps, "disabled">) {
  const pairs = availablePairs || ["USDT", "BTC", "ETH"]

  return (
    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
      {pairs.map((quote) => {
        const pairSymbol = `${symbol}${quote}`
        const isSelected = selectedPair === pairSymbol
        const info = PAIR_INFO[quote] || { label: quote, icon: "🪙", color: "" }

        return (
          <Button
            key={quote}
            variant={isSelected ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-3 gap-1.5",
              isSelected && "bg-background shadow-sm"
            )}
            onClick={() => onPairChange(pairSymbol)}
          >
            <span className={cn("text-sm", info.color)}>{info.icon}</span>
            <span className="font-mono text-xs">{quote}</span>
          </Button>
        )
      })}
    </div>
  )
}

// ============================================
// PAIR BADGE
// ============================================

export function TradingPairBadge({
  pair,
  showIcon = true,
}: {
  pair: string
  showIcon?: boolean
}) {
  // Extract quote from pair (e.g., BTCUSDT -> USDT)
  const quote = pair.replace(/^[A-Z]+/, "")
  const base = pair.replace(quote, "")
  const info = PAIR_INFO[quote] || { label: quote, icon: "🪙", color: "" }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm font-mono">
      {showIcon && <span className={info.color}>{info.icon}</span>}
      <span>{base}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{quote}</span>
    </span>
  )
}
