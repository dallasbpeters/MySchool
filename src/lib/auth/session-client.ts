interface SessionUser {
  id: string
  email: string
  role: string
  parent_id?: string
  first_name?: string
  last_name?: string
}

interface SessionResponse {
  valid: boolean
  user?: SessionUser
  error?: string
}

class SessionManager {
  private user: SessionUser | null = null
  private lastValidation: number = 0
  private validationInterval = 5 * 60 * 1000 // 5 minutes

  async createSession(): Promise<SessionUser | null> {
    try {
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      this.user = data.user
      this.lastValidation = Date.now()
      return this.user
    } catch (error) {
      console.error('Session creation failed:', error)
      return null
    }
  }

  async validateSession(): Promise<SessionUser | null> {
    try {
      // Only validate if enough time has passed or if we don't have a cached user
      const now = Date.now()
      if (this.user && now - this.lastValidation < this.validationInterval) {
        return this.user
      }

      const response = await fetch('/api/sessions/validate', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        this.user = null
        return null
      }

      const data: SessionResponse = await response.json()
      
      if (data.valid && data.user) {
        this.user = data.user
        this.lastValidation = now
        return this.user
      } else {
        this.user = null
        return null
      }
    } catch (error) {
      console.error('Session validation failed:', error)
      this.user = null
      return null
    }
  }

  async destroySession(): Promise<boolean> {
    try {
      const response = await fetch('/api/sessions/destroy', {
        method: 'POST',
        credentials: 'include',
      })

      this.user = null
      this.lastValidation = 0
      return response.ok
    } catch (error) {
      console.error('Session destruction failed:', error)
      return false
    }
  }

  getUser(): SessionUser | null {
    return this.user
  }

  isAuthenticated(): boolean {
    return this.user !== null
  }

  hasRole(role: string): boolean {
    return this.user?.role === role
  }

  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  isParent(): boolean {
    return this.hasRole('parent')
  }

  isStudent(): boolean {
    return this.hasRole('student')
  }

  // Clear cached user data (useful for forcing re-validation)
  clearCache(): void {
    this.user = null
    this.lastValidation = 0
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager()

// Export the types for use in other files
export type { SessionUser, SessionResponse }