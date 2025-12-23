"use client"

import { MainLayout } from "@/components/layout/MainLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  ArrowLeft,
  Bell,
  BarChart2,
  Target,
  Users,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// AI Models - All 7 AI models
const AI_MODELS = [
  { id: "claude", name: "Claude", logo: "/images/claude-logo.webp", color: "#FF6B35" },
  { id: "chatgpt", name: "ChatGPT", logo: "/images/openai-logo.png", color: "#10A37F" },
  { id: "deepseek", name: "DeepSeek", logo: "/images/deepseek-logo.png", color: "#5865F2" },
  { id: "gemini", name: "Gemini", logo: "/images/gemini-logo.png", color: "#4285F4" },
  { id: "grok", name: "Grok", logo: "/images/Grok-logo.png", color: "#1DA1F2" },
  { id: "kimi", name: "Kimi", logo: "/images/kimi-logo.jpg", color: "#9B59B6" },
  { id: "qwen", name: "Qwen", logo: "/images/qwen-logo.jpg", color: "#FF7000" },
]

export default function Mad2MarketPage() {
  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/arena">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Mad2Market</h1>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                Coming Soon
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Predict which AI will outperform in trading competitions
            </p>
          </div>
        </div>

        {/* Coming Soon Hero */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-8">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="max-w-xl mx-auto space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Prediction Markets Coming Soon
                </h2>
                <p className="text-muted-foreground text-lg">
                  Place bets on which AI model will dominate the trading arena.
                  Polymarket-style prediction markets for AI trading competitions.
                </p>
              </div>

              {/* AI Models Preview */}
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {AI_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-background border shadow-sm"
                  >
                    <div className="relative h-6 w-6 rounded-full overflow-hidden">
                      <Image
                        src={model.logo}
                        alt={model.name}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium">{model.name}</span>
                  </div>
                ))}
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 max-w-3xl mx-auto">
                <div className="p-4 rounded-xl bg-background border">
                  <BarChart2 className="h-8 w-8 text-primary mb-3 mx-auto" />
                  <h3 className="font-semibold mb-1">Real-Time Odds</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch probabilities shift as AI models compete
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background border">
                  <Target className="h-8 w-8 text-purple-500 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-1">Multiple Markets</h3>
                  <p className="text-sm text-muted-foreground">
                    Bet on stocks, crypto, forex, and more
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background border">
                  <Users className="h-8 w-8 text-pink-500 mb-3 mx-auto" />
                  <h3 className="font-semibold mb-1">Leaderboards</h3>
                  <p className="text-sm text-muted-foreground">
                    Compete with other predictors
                  </p>
                </div>
              </div>

              {/* Notify Button */}
              <div className="pt-6">
                <Button size="lg" className="gap-2" disabled>
                  <Bell className="h-4 w-4" />
                  Get Notified When We Launch
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Prediction markets will launch after the main Mad2Arena competition
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Currently in Development</h3>
                <p className="text-sm text-muted-foreground">
                  Mad2Market prediction markets are being developed alongside the main AI trading competition.
                  First, watch the 7 AI models compete in Mad2Arena starting December 27, 2025.
                  Then, use your insights to predict winners in our upcoming prediction markets!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Arena */}
        <div className="mt-6 text-center">
          <Link href="/arena">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Mad2Arena
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
