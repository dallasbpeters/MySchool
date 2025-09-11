'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { LoadingStateHookOptions, LoadingStateHookResult, LoadingStatus } from '@/types/loading'

/**
 * Hook for managing loading states with timeout and delay support
 */
export function useLoadingState(options: LoadingStateHookOptions = {}): LoadingStateHookResult {
  const {
    initialState = 'idle',
    delay = 0,
    timeout,
    onTimeout,
    onStateChange
  } = options

  const [state, setState] = useState<LoadingStatus>(initialState)
  const [error, setError] = useState<string | undefined>()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const delayRef = useRef<NodeJS.Timeout>()

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (delayRef.current) {
        clearTimeout(delayRef.current)
      }
    }
  }, [])

  // Handle state changes
  const handleStateChange = useCallback((newState: LoadingStatus, errorMessage?: string) => {
    setState(newState)
    setError(errorMessage)
    onStateChange?.(newState)
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current)
    }

    // Set timeout for loading operations
    if (newState === 'loading' && timeout && timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        handleStateChange('error', 'Operation timed out')
        onTimeout?.()
      }, timeout)
    }
  }, [timeout, onTimeout, onStateChange])

  const setLoading = useCallback(() => {
    if (delay > 0) {
      delayRef.current = setTimeout(() => {
        handleStateChange('loading')
      }, delay)
    } else {
      handleStateChange('loading')
    }
  }, [delay, handleStateChange])

  const setSuccess = useCallback(() => {
    handleStateChange('success')
  }, [handleStateChange])

  const setErrorState = useCallback((errorMessage?: string) => {
    handleStateChange('error', errorMessage)
  }, [handleStateChange])

  const reset = useCallback(() => {
    handleStateChange('idle')
  }, [handleStateChange])

  const run = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      setLoading()
      const result = await operation()
      setSuccess()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setErrorState(errorMessage)
      throw err
    }
  }, [setLoading, setSuccess, setErrorState])

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    error,
    setLoading,
    setSuccess,
    setError: setErrorState,
    reset,
    run
  }
}