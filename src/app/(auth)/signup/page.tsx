"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Password requirements
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", check: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", check: (p: string) => /[0-9]/.test(p) },
]

export default function SignUpPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check password strength
  const passedRequirements = passwordRequirements.filter((req) => req.check(password))
  const isPasswordStrong = passedRequirements.length === passwordRequirements.length
  const passwordsMatch = password === confirmPassword && password.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (!isPasswordStrong) {
      setError("Please meet all password requirements")
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, fullName)

      if (!result.success && result.error?.code !== "confirmation_required") {
        setError(result.error?.message || "Failed to create account")
        setLoading(false)
        return
      }

      // Check if email confirmation is required
      if (result.error?.code === "confirmation_required") {
        setSuccess(true)
        setLoading(false)
        return
      }

      // Email confirmation is disabled - sign out and redirect to login
      // This ensures user goes through proper login flow
      await signOut()
      router.push("/login?message=Account created successfully! Please sign in.")
      router.refresh()
    } catch {
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-border/50">
        <CardHeader className="space-y-1">
          <div className="mx-auto h-12 w-12 rounded-full bg-profit/20 flex items-center justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-profit" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Click the link in the email to verify your account and start using Mad2Stock.
          </p>
          <p className="text-sm text-center text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => {
                setSuccess(false)
                setEmail("")
                setPassword("")
                setConfirmPassword("")
              }}
              className="text-primary hover:underline"
            >
              try again
            </button>
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full" variant="outline">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Get access to trading signals, AI chat, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              autoComplete="name"
              autoFocus
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Password Requirements */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {passwordRequirements.map((req) => {
                  const passed = req.check(password)
                  return (
                    <div key={req.id} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <Check className="h-3 w-3 text-profit" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={cn(passed ? "text-profit" : "text-muted-foreground")}>
                        {req.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className={cn(
                  "pr-10",
                  confirmPassword.length > 0 &&
                    (passwordsMatch ? "border-profit" : "border-loss")
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-loss">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isPasswordStrong || !passwordsMatch}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
        <div className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
