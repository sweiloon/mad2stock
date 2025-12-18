import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  membershipTier: 'free' | 'premium' | 'pro'
  watchlist: string[]
  createdAt: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResult {
  success: boolean
  error?: AuthError
  user?: User
}

// ============================================================================
// CLIENT-SIDE AUTH FUNCTIONS
// ============================================================================

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      },
    },
  })

  if (error) {
    return {
      success: false,
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  // Check if email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      error: {
        message: 'Please check your email to confirm your account.',
        code: 'confirmation_required',
      },
    }
  }

  return {
    success: true,
    user: data.user ? transformUser(data.user) : undefined,
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return {
    success: true,
    user: data.user ? transformUser(data.user) : undefined,
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResult> {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return { success: true }
}

/**
 * Request password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return { success: true }
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return {
      success: false,
      error: {
        message: getAuthErrorMessage(error.message),
        code: error.code,
      },
    }
  }

  return {
    success: true,
    user: data.user ? transformUser(data.user) : undefined,
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return transformUser(user)
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    fullName?: string
    avatarUrl?: string
    watchlist?: string[]
    preferences?: Record<string, unknown>
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl,
      watchlist: updates.watchlist,
      preferences: updates.preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

/**
 * Add stock to watchlist
 */
export async function addToWatchlist(userId: string, stockCode: string) {
  const supabase = createClient()

  // First get current watchlist
  const { data: profile } = await supabase
    .from('profiles')
    .select('watchlist')
    .eq('id', userId)
    .single()

  const currentWatchlist = profile?.watchlist || []

  if (currentWatchlist.includes(stockCode)) {
    return { success: true, message: 'Already in watchlist' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      watchlist: [...currentWatchlist, stockCode],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

/**
 * Remove stock from watchlist
 */
export async function removeFromWatchlist(userId: string, stockCode: string) {
  const supabase = createClient()

  // First get current watchlist
  const { data: profile } = await supabase
    .from('profiles')
    .select('watchlist')
    .eq('id', userId)
    .single()

  const currentWatchlist = profile?.watchlist || []
  const newWatchlist = currentWatchlist.filter((code: string) => code !== stockCode)

  const { error } = await supabase
    .from('profiles')
    .update({
      watchlist: newWatchlist,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform Supabase user to our User type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformUser(supabaseUser: Record<string, any>): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.full_name || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url || '',
    membershipTier: supabaseUser.user_metadata?.membership_tier || 'free',
    watchlist: supabaseUser.user_metadata?.watchlist || [],
    createdAt: supabaseUser.created_at,
  }
}

/**
 * Get user-friendly error messages
 */
function getAuthErrorMessage(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please confirm your email address before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Email rate limit exceeded': 'Too many attempts. Please try again later.',
    'Invalid email': 'Please enter a valid email address.',
    'Signup requires a valid password': 'Please enter a valid password.',
  }

  return errorMap[message] || message
}

// ============================================================================
// ROUTE PROTECTION
// ============================================================================

/**
 * Routes that require authentication
 */
export const protectedRoutes = [
  '/signals',
  '/chat',
  '/content',
  '/profile',
  '/settings',
  '/watchlist',
]

/**
 * Routes that should redirect authenticated users away
 */
export const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

/**
 * Check if a path requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(route => path.startsWith(route))
}

/**
 * Check if a path is an auth route
 */
export function isAuthRoute(path: string): boolean {
  return authRoutes.some(route => path.startsWith(route))
}
