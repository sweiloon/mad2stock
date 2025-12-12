"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ArrowRightLeft, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  category: number
  name: string
  count: number
  type: "yoy" | "qoq"
}

const categoryConfig: Record<number, {
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}> = {
  1: {
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "Strong growth"
  },
  2: {
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "Efficiency gains"
  },
  3: {
    icon: ArrowRightLeft,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    description: "Margin pressure"
  },
  4: {
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-100",
    description: "Declining"
  },
  5: {
    icon: RotateCcw,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    description: "Turnaround"
  },
  6: {
    icon: TrendingDown,
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    description: "Deteriorating"
  }
}

export function CategoryCard({ category, name, count, type }: CategoryCardProps) {
  const config = categoryConfig[category] || categoryConfig[4]
  const Icon = config.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Category {category}
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {type.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>
          <div>
            <div className="text-2xl font-bold">{count}</div>
            <p className="text-xs text-muted-foreground">{name}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{config.description}</p>
      </CardContent>
    </Card>
  )
}
