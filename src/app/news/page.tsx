"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  DEMO_NEWS,
  NEWS_CATEGORIES,
  getNewsByCategory,
  getRelatedNews,
  type NewsItem,
  type NewsCategory,
} from "@/lib/demo-news"
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ExternalLink,
  Zap,
  Search,
  ChevronRight,
  X,
  Share2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Sentiment badge component
function SentimentBadge({ sentiment }: { sentiment?: "bullish" | "bearish" | "neutral" }) {
  if (!sentiment) return null

  const config = {
    bullish: { icon: TrendingUp, color: "text-profit bg-profit/10 border-profit/20", label: "Bullish" },
    bearish: { icon: TrendingDown, color: "text-loss bg-loss/10 border-loss/20", label: "Bearish" },
    neutral: { icon: Minus, color: "text-muted-foreground bg-muted border-border", label: "Neutral" },
  }

  const { icon: Icon, color, label } = config[sentiment]

  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-medium", color)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

// News card component
function NewsCard({
  news,
  variant = "default",
  onClick,
}: {
  news: NewsItem
  variant?: "default" | "featured" | "compact"
  onClick: () => void
}) {
  const isFeatured = variant === "featured"
  const isCompact = variant === "compact"

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30",
        isFeatured && "md:col-span-2 md:row-span-2",
        isCompact && "flex flex-row"
      )}
      onClick={onClick}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          isFeatured ? "h-64 md:h-80" : isCompact ? "w-24 h-24 flex-shrink-0" : "h-40"
        )}
      >
        <Image
          src={news.imageUrl}
          alt={news.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={isFeatured ? "800px" : isCompact ? "96px" : "400px"}
        />
        {/* Gradient overlay */}
        {!isCompact && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}

        {/* Breaking badge */}
        {news.isBreaking && !isCompact && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-500 text-white animate-pulse gap-1.5 shadow-lg">
              <Zap className="h-3 w-3" />
              BREAKING
            </Badge>
          </div>
        )}

        {/* Category badge on image */}
        {!isCompact && (
          <div className="absolute bottom-3 left-3">
            <Badge
              className={cn(
                "text-white shadow-lg",
                NEWS_CATEGORIES.find((c) => c.value === news.category)?.color || "bg-gray-500"
              )}
            >
              {NEWS_CATEGORIES.find((c) => c.value === news.category)?.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className={cn("p-4", isCompact && "flex-1 py-2")}>
        {/* Source and time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="font-medium text-foreground/80">{news.source}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(news.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-semibold line-clamp-2 group-hover:text-primary transition-colors",
            isFeatured ? "text-xl md:text-2xl" : isCompact ? "text-sm" : "text-base"
          )}
        >
          {news.title}
        </h3>

        {/* Summary - only for non-compact */}
        {!isCompact && (
          <p className={cn("text-muted-foreground line-clamp-2 mt-2", isFeatured ? "text-base" : "text-sm")}>
            {news.summary}
          </p>
        )}

        {/* Footer - only for default/featured */}
        {!isCompact && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <SentimentBadge sentiment={news.sentiment} />
            {news.relatedStocks && news.relatedStocks.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {news.relatedStocks.slice(0, 3).map((stock) => (
                  <Badge key={stock} variant="secondary" className="text-xs px-1.5 py-0">
                    {stock}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// News detail modal
function NewsDetailModal({
  news,
  open,
  onClose,
}: {
  news: NewsItem | null
  open: boolean
  onClose: () => void
}) {
  const [saved, setSaved] = useState(false)
  const relatedNews = news ? getRelatedNews(news.id, 4) : []

  if (!news) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[90vh]">
          {/* Header image */}
          <div className="relative h-64 md:h-80 w-full">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              sizes="800px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Category and breaking badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {news.isBreaking && (
                <Badge className="bg-red-500 text-white animate-pulse gap-1.5">
                  <Zap className="h-3 w-3" />
                  BREAKING
                </Badge>
              )}
              <Badge
                className={cn(
                  "text-white",
                  NEWS_CATEGORIES.find((c) => c.value === news.category)?.color || "bg-gray-500"
                )}
              >
                {NEWS_CATEGORIES.find((c) => c.value === news.category)?.label}
              </Badge>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {news.title}
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{news.source}</span>
                {news.author && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">by {news.author}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatRelativeTime(news.publishedAt)}
              </div>
              <SentimentBadge sentiment={news.sentiment} />

              {/* Action buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setSaved(!saved)}
                >
                  {saved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                  <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Source
                  </a>
                </Button>
              </div>
            </div>

            {/* Summary */}
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{news.summary}</p>

            {/* Full content */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {news.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 text-foreground/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Related stocks */}
            {news.relatedStocks && news.relatedStocks.length > 0 && (
              <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Related Stocks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {news.relatedStocks.map((stock) => (
                    <Badge
                      key={stock}
                      variant="secondary"
                      className="text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {stock}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related news */}
            {relatedNews.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Related News</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedNews.map((related) => (
                    <Card
                      key={related.id}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        // This would update the modal content in a real app
                      }}
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={related.imageUrl}
                          alt={related.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{related.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(related.publishedAt)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Filter news by category and search
  const filteredNews = useMemo(() => {
    let news = getNewsByCategory(selectedCategory)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      news = news.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.summary.toLowerCase().includes(query) ||
          item.source.toLowerCase().includes(query) ||
          item.relatedStocks?.some((stock) => stock.toLowerCase().includes(query))
      )
    }

    return news
  }, [selectedCategory, searchQuery])

  // Get breaking news for banner
  const breakingNews = DEMO_NEWS.filter((n) => n.isBreaking).slice(0, 3)

  // Get featured news (first 3 for hero section)
  const featuredNews = filteredNews.slice(0, 1)
  const regularNews = filteredNews.slice(1)

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="bg-red-500 text-white overflow-hidden">
          <div className="flex items-center py-2 px-4">
            <div className="flex items-center gap-2 flex-shrink-0 pr-4 border-r border-white/20">
              <Zap className="h-4 w-4" />
              <span className="font-bold text-sm">BREAKING</span>
            </div>
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap">
                {breakingNews.map((news, i) => (
                  <span key={news.id} className="mx-8 text-sm">
                    {news.title}
                    {i < breakingNews.length - 1 && (
                      <span className="mx-4 text-white/50">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Newspaper className="h-7 w-7 text-primary" />
              </div>
              Market News
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with the latest market news and analysis
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news, stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <div className="flex gap-2 pb-2">
            {NEWS_CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.value
              const count =
                category.value === "all"
                  ? DEMO_NEWS.length
                  : category.value === "breaking"
                  ? DEMO_NEWS.filter((n) => n.isBreaking).length
                  : DEMO_NEWS.filter((n) => n.category === category.value).length

              return (
                <Button
                  key={category.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 flex-shrink-0 transition-all",
                    isActive && category.value === "breaking" && "bg-red-500 hover:bg-red-600"
                  )}
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.value === "breaking" && <Zap className="h-3.5 w-3.5" />}
                  {category.label}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-1 h-5 px-1.5 text-xs",
                      isActive && "bg-white/20 text-white"
                    )}
                  >
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <Card className="p-12 text-center">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No news found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured news - larger card */}
            {featuredNews.map((news) => (
              <div key={news.id} className="md:col-span-2 lg:col-span-2">
                <NewsCard news={news} variant="featured" onClick={() => handleNewsClick(news)} />
              </div>
            ))}

            {/* Latest news sidebar on desktop */}
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Latest Updates
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {regularNews.slice(0, 5).map((news) => (
                  <div
                    key={news.id}
                    className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleNewsClick(news)}
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={news.imageUrl}
                        alt={news.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 leading-tight">
                        {news.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(news.publishedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Regular news cards */}
            {regularNews.slice(5).map((news) => (
              <NewsCard key={news.id} news={news} onClick={() => handleNewsClick(news)} />
            ))}
          </div>
        )}

        {/* Load more button */}
        {filteredNews.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button variant="outline" size="lg" className="gap-2">
              Load More News
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      <NewsDetailModal
        news={selectedNews}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Marquee animation style */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
