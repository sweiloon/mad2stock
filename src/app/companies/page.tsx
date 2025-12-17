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
  Minus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { COMPANY_DATA, getAllSectors, hasFinancialData, getTotalCompanyCount, CompanyData } from "@/lib/company-data"

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
  const [boardFilter, setBoardFilter] = useState<string>("all") // "all" | "Main" | "ACE" | "LEAP"
  const [dataFilter, setDataFilter] = useState<string>("all") // "all" | "analyzed" | "pending"
  const [analysisType, setAnalysisType] = useState<"yoy" | "qoq">("yoy")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortField, setSortField] = useState<string>("code")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const sectors = useMemo(() => {
    return getAllSectors()
  }, [])

  const totalCount = getTotalCompanyCount()
  const analyzedCount = COMPANY_DATA.filter(c => hasFinancialData(c)).length

  const filteredCompanies = useMemo(() => {
    return COMPANY_DATA
      .filter(company => {
        const matchesSearch = company.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.name.toLowerCase().includes(searchQuery.toLowerCase())

        // Data availability filter
        const hasData = hasFinancialData(company)
        const matchesDataFilter = dataFilter === "all" ||
          (dataFilter === "analyzed" && hasData) ||
          (dataFilter === "pending" && !hasData)

        // Category filter only applies to companies with data
        const matchesCategory = categoryFilter === "all" || !hasData ||
          (analysisType === "yoy" ? company.yoyCategory : company.qoqCategory) === parseInt(categoryFilter)

        const matchesSector = sectorFilter === "all" || company.sector === sectorFilter

        // Board/Market filter (Main, ACE, LEAP)
        const matchesBoard = boardFilter === "all" || company.market === boardFilter

        return matchesSearch && matchesDataFilter && matchesCategory && matchesSector && matchesBoard
      })
      .sort((a, b) => {
        let aVal: number | string, bVal: number | string
        switch (sortField) {
          case "revenue":
            aVal = analysisType === "yoy" ? (a.revenueYoY ?? -999999) : (a.revenueQoQ ?? -999999)
            bVal = analysisType === "yoy" ? (b.revenueYoY ?? -999999) : (b.revenueQoQ ?? -999999)
            break
          case "profit":
            aVal = analysisType === "yoy" ? (a.profitYoY ?? -999999) : (a.profitQoQ ?? -999999)
            bVal = analysisType === "yoy" ? (b.profitYoY ?? -999999) : (b.profitQoQ ?? -999999)
            break
          case "latestRevenue":
            aVal = a.latestRevenue ?? -999999
            bVal = b.latestRevenue ?? -999999
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
  }, [searchQuery, categoryFilter, sectorFilter, boardFilter, dataFilter, analysisType, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const renderChange = (value: number | undefined) => {
    if (value === undefined || value === null) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="h-3 w-3" />
          N/A
        </div>
      )
    }
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
              Browse {filteredCompanies.length} of {totalCount} Malaysian listed companies ({analyzedCount} with full analysis)
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

                <Select value={boardFilter} onValueChange={setBoardFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Boards</SelectItem>
                    <SelectItem value="Main">Main Market</SelectItem>
                    <SelectItem value="ACE">ACE Market</SelectItem>
                    <SelectItem value="LEAP">LEAP Market</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dataFilter} onValueChange={setDataFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Data Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="analyzed">Analyzed ({analyzedCount})</SelectItem>
                    <SelectItem value="pending">Pending Analysis ({totalCount - analyzedCount})</SelectItem>
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
          <Card className="overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted w-[100px]"
                      onClick={() => handleSort("code")}
                    >
                      <div className="flex items-center gap-1">
                        Code <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[180px]">Name</TableHead>
                    <TableHead className="w-[120px]">Sector</TableHead>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted w-[120px]"
                      onClick={() => handleSort("revenue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Revenue % <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted w-[120px]"
                      onClick={() => handleSort("profit")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Profit % <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted w-[140px]"
                      onClick={() => handleSort("latestRevenue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Revenue (RM M) <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const category = analysisType === "yoy" ? company.yoyCategory : company.qoqCategory
                    const catInfo = category ? CATEGORIES[category as keyof typeof CATEGORIES] : null
                    const hasData = hasFinancialData(company)
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
                        <TableCell className="truncate max-w-[180px]">{company.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.sector}</Badge>
                        </TableCell>
                        <TableCell>
                          {catInfo ? (
                            <Badge className={catInfo.color}>
                              Cat {category}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {renderChange(analysisType === "yoy" ? company.revenueYoY : company.revenueQoQ)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            {renderChange(analysisType === "yoy" ? company.profitYoY : company.profitQoQ)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {company.latestRevenue !== undefined ? company.latestRevenue.toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Cards View */}
        {viewMode === "cards" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[700px] overflow-auto">
            {filteredCompanies.map((company) => {
              const category = analysisType === "yoy" ? company.yoyCategory : company.qoqCategory
              const catInfo = category ? CATEGORIES[category as keyof typeof CATEGORIES] : null
              return (
                <Link key={company.code} href={`/companies/${company.code}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.code}</CardTitle>
                        {catInfo ? (
                          <Badge className={catInfo.color}>Cat {category}</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{company.name}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Revenue %</span>
                        {renderChange(analysisType === "yoy" ? company.revenueYoY : company.revenueQoQ)}
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Profit %</span>
                        {renderChange(analysisType === "yoy" ? company.profitYoY : company.profitQoQ)}
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                        <Badge variant="outline">{company.sector}</Badge>
                        <span className="font-medium tabular-nums">
                          {company.latestRevenue !== undefined ? `RM ${company.latestRevenue.toLocaleString()}M` : "—"}
                        </span>
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
          <Card className="overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-card z-10">
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
                    <th className="border px-3 py-2 text-right font-medium">Revenue (RM M)</th>
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
                      <td className="border px-3 py-2 text-center">{company.yoyCategory ?? "—"}</td>
                      <td className="border px-3 py-2 text-center">{company.qoqCategory ?? "—"}</td>
                      <td className={cn(
                        "border px-3 py-2 text-right tabular-nums",
                        company.revenueYoY !== undefined
                          ? (company.revenueYoY >= 0 ? "text-green-600" : "text-red-600")
                          : "text-muted-foreground"
                      )}>
                        {company.revenueYoY !== undefined
                          ? `${company.revenueYoY >= 0 ? "+" : ""}${company.revenueYoY.toFixed(1)}`
                          : "—"}
                      </td>
                      <td className={cn(
                        "border px-3 py-2 text-right tabular-nums",
                        company.profitYoY !== undefined
                          ? (company.profitYoY >= 0 ? "text-green-600" : "text-red-600")
                          : "text-muted-foreground"
                      )}>
                        {company.profitYoY !== undefined
                          ? `${company.profitYoY >= 0 ? "+" : ""}${company.profitYoY.toFixed(1)}`
                          : "—"}
                      </td>
                      <td className={cn(
                        "border px-3 py-2 text-right tabular-nums",
                        company.revenueQoQ !== undefined
                          ? (company.revenueQoQ >= 0 ? "text-green-600" : "text-red-600")
                          : "text-muted-foreground"
                      )}>
                        {company.revenueQoQ !== undefined
                          ? `${company.revenueQoQ >= 0 ? "+" : ""}${company.revenueQoQ.toFixed(1)}`
                          : "—"}
                      </td>
                      <td className={cn(
                        "border px-3 py-2 text-right tabular-nums",
                        company.profitQoQ !== undefined
                          ? (company.profitQoQ >= 0 ? "text-green-600" : "text-red-600")
                          : "text-muted-foreground"
                      )}>
                        {company.profitQoQ !== undefined
                          ? `${company.profitQoQ >= 0 ? "+" : ""}${company.profitQoQ.toFixed(1)}`
                          : "—"}
                      </td>
                      <td className="border px-3 py-2 text-right tabular-nums">
                        {company.latestRevenue !== undefined ? company.latestRevenue.toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
