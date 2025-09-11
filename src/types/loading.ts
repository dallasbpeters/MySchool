/**
 * Loading state type definitions for the performance optimization system
 */

export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error'

export interface LoadingState {
  /** Unique identifier for the operation */
  id: string
  /** Current state of the operation */
  status: LoadingStatus
  /** Completion percentage (0-100) */
  progress?: number
  /** When operation began */
  startTime: Date
  /** When operation completed */
  endTime?: Date
  /** Error details if status is 'error' */
  errorMessage?: string
  /** Number of retry attempts */
  retryCount: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

export interface LoadingStateTransition {
  /** Previous state */
  from: LoadingStatus
  /** New state */
  to: LoadingStatus
  /** Transition timestamp */
  timestamp: Date
  /** Operation ID */
  operationId: string
  /** Duration in previous state */
  duration?: number
}

export interface LoadingComponentProps {
  /** Whether component is in loading state */
  isLoading: boolean
  /** Custom loading component */
  loadingComponent?: React.ReactNode
  /** Fallback content during loading */
  fallback?: React.ReactNode
  /** Delay before showing loading state */
  delay?: number
  /** Timeout for loading operations */
  timeout?: number
  /** Content to show when not loading */
  children: React.ReactNode
  /** Callback when timeout occurs */
  onTimeout?: () => void
  /** Custom className */
  className?: string
}

export interface ColourfulTextLoadingProps {
  /** Loading text to display with animation */
  text?: string
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Custom className */
  className?: string
  /** Whether to animate the text */
  animate?: boolean
  /** Test ID for testing */
  testId?: string
  /** Accessibility label */
  ariaLabel?: string
}

export interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Color variant */
  color?: 'primary' | 'secondary' | 'accent' | 'muted'
  /** Custom className */
  className?: string
  /** Accessible label for screen readers */
  label?: string
  /** Test ID for testing */
  testId?: string
}

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number
  /** Whether to show percentage text */
  showPercentage?: boolean
  /** Progress label */
  label?: string
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error'
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Custom className */
  className?: string
  /** Test ID for testing */
  testId?: string
}

export interface LoadingStateHookOptions {
  /** Initial state */
  initialState?: LoadingStatus
  /** Delay before showing loading state */
  delay?: number
  /** Timeout for operations */
  timeout?: number
  /** Callback when timeout occurs */
  onTimeout?: () => void
  /** Callback when state changes */
  onStateChange?: (state: LoadingStatus) => void
}

export interface LoadingStateHookResult {
  /** Current loading state */
  state: LoadingStatus
  /** Whether currently loading */
  isLoading: boolean
  /** Whether in success state */
  isSuccess: boolean
  /** Whether in error state */
  isError: boolean
  /** Whether in idle state */
  isIdle: boolean
  /** Error message if in error state */
  error?: string
  /** Set loading state */
  setLoading: () => void
  /** Set success state */
  setSuccess: () => void
  /** Set error state */
  setError: (error?: string) => void
  /** Reset to idle state */
  reset: () => void
  /** Start an async operation */
  run: <T>(operation: () => Promise<T>) => Promise<T>
}

export interface AccessibilityConfig {
  /** Screen reader label */
  label?: string
  /** Use ARIA live region for updates */
  liveRegion?: boolean
  /** Message when loading starts */
  announceStart?: string
  /** Message when loading completes */
  announceEnd?: string
  /** Respect reduced motion preferences */
  respectReducedMotion?: boolean
}

export interface LoadingAnimationConfig {
  /** Animation duration in milliseconds */
  duration?: number
  /** Animation delay in milliseconds */
  delay?: number
  /** Animation easing function */
  easing?: string
  /** Whether to loop the animation */
  loop?: boolean
  /** Number of animation iterations */
  iterations?: number
}

export interface LoadingMetrics {
  /** Loading operation ID */
  operationId: string
  /** Total loading duration */
  duration: number
  /** Whether operation was successful */
  success: boolean
  /** Error message if failed */
  error?: string
  /** Route where loading occurred */
  route?: string
  /** User ID if available */
  userId?: string
  /** Additional context */
  context?: Record<string, unknown>
}