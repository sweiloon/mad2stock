"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"

interface CategoryData {
  category: number
  name: string
  count: number
}

interface CategoryPieChartProps {
  data: CategoryData[]
  title: string
  type: "yoy" | "qoq"
}

const COLORS = [
  "#22c55e", // Category 1 - Green
  "#3b82f6", // Category 2 - Blue
  "#f59e0b", // Category 3 - Amber
  "#ef4444", // Category 4 - Red
  "#10b981", // Category 5 - Emerald
  "#f43f5e", // Category 6 - Rose
]

const chartConfig = {
  count: {
    label: "Companies",
  },
} satisfies ChartConfig

export function CategoryPieChart({ data, title, type }: CategoryPieChartProps) {
  const chartData = data.map((item, index) => ({
    name: `Cat ${item.category}`,
    value: item.count,
    fill: COLORS[index % COLORS.length],
    fullName: item.name,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant="outline">{type.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{data.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.value} companies
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground truncate">
                {item.fullName}
              </span>
              <span className="font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
