"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock company data
const mockCompanies = [
  { code: "AEONCR", name: "AEON Credit Service", sector: "Finance", yoyCategory: 1, qoqCategory: 1, revenueYoY: 14.1, profitYoY: 1.4, revenueQoQ: 5.2, profitQoQ: 8.3, marketCap: 3200 },
  { code: "BNASTRA", name: "Bina Nusantara", sector: "Education", yoyCategory: 1, qoqCategory: 2, revenueYoY: 71.9, profitYoY: 24.0, revenueQoQ: -3.5, profitQoQ: 12.1, marketCap: 890 },
  { code: "UWC", name: "UWC Berhad", sector: "Manufacturing", yoyCategory: 1, qoqCategory: 1, revenueYoY: 43.0, profitYoY: 685.7, revenueQoQ: 28.5, profitQoQ: 112.4, marketCap: 1250 },
  { code: "UMCCA", name: "UMCCA Berhad", sector: "Plantation", yoyCategory: 1, qoqCategory: 3, revenueYoY: 16.9, profitYoY: 184.2, revenueQoQ: 8.2, profitQoQ: -15.3, marketCap: 450 },
  { code: "HIGHTEC", name: "Hightec Global", sector: "Technology", yoyCategory: 1, qoqCategory: 1, revenueYoY: 44.2, profitYoY: 180.6, revenueQoQ: 22.1, profitQoQ: 45.8, marketCap: 180 },
  { code: "ECOWLD", name: "Eco World Development", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: 17.6, profitYoY: 51.9, revenueQoQ: 52.4, profitQoQ: 235.2, marketCap: 2800 },
  { code: "CRESNDO", name: "Crescendo Corporation", sector: "Property", yoyCategory: 1, qoqCategory: 1, revenueYoY: 19.3, profitYoY: 129.6, revenueQoQ: 19.3, profitQoQ: 129.6, marketCap: 320 },
  { code: "MYNEWS", name: "Mynews Holdings", sector: "Retail", yoyCategory: 1, qoqCategory: 4, revenueYoY: 11.3, profitYoY: 146.2, revenueQoQ: -5.8, profitQoQ: -22.4, marketCap: 210 },
  { code: "ASTRO", name: "Astro Malaysia", sector: "Media", yoyCategory: 5, qoqCategory: 5, revenueYoY: -13.0, profitYoY: 0, revenueQoQ: -7.4, profitQoQ: 0, marketCap: 679 },
  { code: "GAMUDA", name: "Gamuda Berhad", sector: "Construction", yoyCategory: 1, qoqCategory: 2, revenueYoY: 25.4, profitYoY: 18.9, revenueQoQ: -8.2, profitQoQ: 5.6, marketCap: 18500 },
  { code: "KOSSAN", name: "Kossan Rubber", sector: "Healthcare", yoyCategory: 4, qoqCategory: 4, revenueYoY: -15.2, profitYoY: -42.3, revenueQoQ: -8.5, profitQoQ: -18.7, marketCap: 4200 },
  { code: "SCIENTX", name: "Scientex Berhad", sector: "Industrial", yoyCategory: 3, qoqCategory: 1, revenueYoY: 8.5, profitYoY: -12.4, revenueQoQ: 12.3, profitQoQ: 22.1, marketCap: 5600 },
]

const CATEGORIES = {
  1: { label: "Revenue UP, Profit UP", color: "bg-green-100 text-green-700" },
  2: { label: "Revenue DOWN, Profit UP", color: "bg-blue-100 text-blue-700" },
  3: { label: "Revenue UP, Profit DOWN", color: "bg-amber-100 text-amber-700" },
  4: { label: "Revenue DOWN, Profit DOWN", color: "bg-red-100 text-red-700" },
  5: { label: "Turnaround", color: "bg-emerald-100 text-emerald-700" },
  6: { label: "Deteriorating", color: "bg-rose-100 text-rose-700" },
}

type ViewMode = "table" | "cards" | "excel"

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sectorFilter, setSectorFilter] = useState<string>("all")
  const [analysisType, setAnalysisType] = useState<"yoy" | "qoq">("yoy")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortField, setSortField] = useState<string>("code")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const sectors = useMemo(() => {
    return [...new Set(mockCompanies.map(c => c.sector))].sort()
  }, [])

  const filteredCompanies = useMemo(() => {
    return mockCompanies
      .filter(company => {
        const matchesSearch = company.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === "all" ||
          (analysisType === "yoy" ? company.yoyCategory : company.qoqCategory) === parseInt(categoryFilter)
        const matchesSector = sectorFilter === "all" || company.sector === sectorFilter
        return matchesSearch && matchesCategory && matchesSector
      })
      .sort((a, b) => {
        let aVal: number | string, bVal: number | string
        switch (sortField) {
          case "revenue":
            aVal = analysisType === "yoy" ? a.revenueYoY : a.revenueQoQ
            bVal = analysisType === "yoy" ? b.revenueYoY : b.revenueQoQ
            break
          case "profit":
            aVal = analysisType === "yoy" ? a.profitYoY : a.profitQoQ
            bVal = analysisType === "yoy" ? b.profitYoY : b.profitQoQ
            break
          case "marketCap":
            aVal = a.marketCap
            bVal = b.marketCap
            break
          default:
            aVal = a.code
            bVal = b.code
        }
        if (sortDirection === "asc") {
          return aVal > bVal ? 1 : -1
        }
        return aVal < bVal ? 1 : -1
      })
  }, [searchQuery, categoryFilter, sectorFilter, analysisType, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const renderChange = (value: number) => {
    const isPositive = value >= 0
    return (
      <div className={cn(
        "flex items-center gap-1",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {isPositive ? "+" : ""}{value.toFixed(1)}%
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Browse and analyze {filteredCompanies.length} KLSE listed companies
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORIES).map(([id, cat]) => (
                      <SelectItem key={id} value={id}>
                        Cat {id}: {cat.label.split(",")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-[180px]">
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
              </div>

              <div className="flex items-center gap-2">
                <Tabs value={analysisType} onValueChange={(v) => setAnalysisType(v as "yoy" | "qoq")}>
                  <TabsList>
                    <TabsTrigger value="yoy">YoY</TabsTrigger>
                    <TabsTrigger value="qoq">QoQ</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("cards")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "excel" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("excel")}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table View */}
        {viewMode === "table" && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-1">
                      Code <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("revenue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("profit")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Profit <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleSort("marketCap")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Market Cap <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => {
                  const category = analysisType === "yoy" ? company.yoyCategory : company.qoqCategory
                  const catInfo = CATEGORIES[category as keyof typeof CATEGORIES]
                  return (
                    <TableRow key={company.code}>
                      <TableCell>
                        <Link
                          href={`/companies/${company.code}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {company.code}
                        </Link>
                      </TableCell>
                      <TableCell>{company.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.sector}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={catInfo.color}>
                          Cat {category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderChange(analysisType === "yoy" ? company.revenueYoY : company.revenueQoQ)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderChange(analysisType === "yoy" ? company.profitYoY : company.profitQoQ)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        RM{(company.marketCap / 1000).toFixed(1)}B
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => {
              const category = analysisType === "yoy" ? company.yoyCategory : company.qoqCategory
              const catInfo = CATEGORIES[category as keyof typeof CATEGORIES]
              return (
                <Link key={company.code} href={`/companies/${company.code}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.code}</CardTitle>
                        <Badge className={catInfo.color}>Cat {category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{company.name}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        {renderChange(analysisType === "yoy" ? company.revenueYoY : company.revenueQoQ)}
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Profit</span>
                        {renderChange(analysisType === "yoy" ? company.profitYoY : company.profitQoQ)}
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                        <Badge variant="outline">{company.sector}</Badge>
                        <span className="font-medium">RM{(company.marketCap / 1000).toFixed(1)}B</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Excel View */}
        {viewMode === "excel" && (
          <Card className="overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left font-medium">Code</th>
                  <th className="border px-3 py-2 text-left font-medium">Name</th>
                  <th className="border px-3 py-2 text-left font-medium">Sector</th>
                  <th className="border px-3 py-2 text-center font-medium">YoY Cat</th>
                  <th className="border px-3 py-2 text-center font-medium">QoQ Cat</th>
                  <th className="border px-3 py-2 text-right font-medium">Rev YoY%</th>
                  <th className="border px-3 py-2 text-right font-medium">Profit YoY%</th>
                  <th className="border px-3 py-2 text-right font-medium">Rev QoQ%</th>
                  <th className="border px-3 py-2 text-right font-medium">Profit QoQ%</th>
                  <th className="border px-3 py-2 text-right font-medium">MCap (RM M)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, idx) => (
                  <tr key={company.code} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="border px-3 py-2 font-medium">
                      <Link href={`/companies/${company.code}`} className="text-primary hover:underline">
                        {company.code}
                      </Link>
                    </td>
                    <td className="border px-3 py-2">{company.name}</td>
                    <td className="border px-3 py-2">{company.sector}</td>
                    <td className="border px-3 py-2 text-center">{company.yoyCategory}</td>
                    <td className="border px-3 py-2 text-center">{company.qoqCategory}</td>
                    <td className={cn(
                      "border px-3 py-2 text-right",
                      company.revenueYoY >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.revenueYoY.toFixed(1)}
                    </td>
                    <td className={cn(
                      "border px-3 py-2 text-right",
                      company.profitYoY >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.profitYoY.toFixed(1)}
                    </td>
                    <td className={cn(
                      "border px-3 py-2 text-right",
                      company.revenueQoQ >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.revenueQoQ.toFixed(1)}
                    </td>
                    <td className={cn(
                      "border px-3 py-2 text-right",
                      company.profitQoQ >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {company.profitQoQ.toFixed(1)}
                    </td>
                    <td className="border px-3 py-2 text-right">{company.marketCap.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
