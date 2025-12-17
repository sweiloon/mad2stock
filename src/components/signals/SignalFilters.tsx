"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export interface SignalFiltersState {
  type: string
  status: string
  sector: string
  strength: string
  timeHorizon: string
  minConfidence: string
  search: string
}

interface SignalFiltersProps {
  filters: SignalFiltersState
  onFilterChange: (key: keyof SignalFiltersState, value: string) => void
  onReset: () => void
  onRefresh?: () => void
  isLoading?: boolean
  sectors?: string[]
}

// ============================================================================
// DEFAULT FILTERS
// ============================================================================

export const DEFAULT_FILTERS: SignalFiltersState = {
  type: "all",
  status: "active",
  sector: "all",
  strength: "all",
  timeHorizon: "all",
  minConfidence: "",
  search: "",
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SignalFilters({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  isLoading = false,
  sectors = [],
}: SignalFiltersProps) {
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) =>
      value !== DEFAULT_FILTERS[key as keyof SignalFiltersState] &&
      value !== "" &&
      value !== "all"
  ).length

  return (
    <div className="space-y-4">
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Signal Type:</span>
        {["all", "BUY", "SELL", "HOLD"].map((type) => (
          <Button
            key={type}
            variant={filters.type === type ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("type", type)}
            className={cn(
              "h-8",
              filters.type === type && type === "BUY" && "bg-profit hover:bg-profit/90",
              filters.type === type && type === "SELL" && "bg-loss hover:bg-loss/90"
            )}
          >
            {type === "all" ? "All" : type}
          </Button>
        ))}

        {/* Active Filter Count */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </Badge>
        )}
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stock code..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange("status", value)}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hit_target">Hit Target</SelectItem>
            <SelectItem value="hit_stoploss">Hit Stop Loss</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {/* Sector */}
        <Select
          value={filters.sector}
          onValueChange={(value) => onFilterChange("sector", value)}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Strength */}
        <Select
          value={filters.strength}
          onValueChange={(value) => onFilterChange("strength", value)}
        >
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Strength" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strength</SelectItem>
            <SelectItem value="Strong">Strong</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="Weak">Weak</SelectItem>
          </SelectContent>
        </Select>

        {/* Time Horizon */}
        <Select
          value={filters.timeHorizon}
          onValueChange={(value) => onFilterChange("timeHorizon", value)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Time Horizon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Horizons</SelectItem>
            <SelectItem value="Intraday">Intraday</SelectItem>
            <SelectItem value="Short-term">Short-term</SelectItem>
            <SelectItem value="Medium-term">Medium-term</SelectItem>
            <SelectItem value="Long-term">Long-term</SelectItem>
          </SelectContent>
        </Select>

        {/* Min Confidence */}
        <Select
          value={filters.minConfidence}
          onValueChange={(value) => onFilterChange("minConfidence", value)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Min Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Confidence</SelectItem>
            <SelectItem value="80">80%+ (High)</SelectItem>
            <SelectItem value="60">60%+ (Medium)</SelectItem>
            <SelectItem value="40">40%+ (Low)</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset} className="h-9">
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9"
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FILTER SUMMARY (for mobile)
// ============================================================================

export function SignalFilterSummary({
  filters,
  onReset,
}: {
  filters: SignalFiltersState
  onReset: () => void
}) {
  const activeFilters = Object.entries(filters)
    .filter(
      ([key, value]) =>
        value !== DEFAULT_FILTERS[key as keyof SignalFiltersState] &&
        value !== "" &&
        value !== "all"
    )
    .map(([key, value]) => ({ key, value }))

  if (activeFilters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">Filters:</span>
      {activeFilters.map(({ key, value }) => (
        <Badge key={key} variant="secondary" className="text-xs">
          {key}: {value}
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onReset} className="h-6 px-2">
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
