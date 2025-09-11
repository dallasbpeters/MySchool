'use client'

import React, { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { LoadingComponentProps } from '@/types/loading'
import ColourfulTextLoading from './colourful-text-loading'

/**
 * LoadingWrapper component for wrapping content with loading states
 */
const LoadingWrapper = React.forwardRef<HTMLDivElement, LoadingComponentProps>(
  ({
    isLoading,
    loadingComponent,
    fallback,
    delay = 0,
    timeout,
    children,
    onTimeout,
    className
  }, ref) => {
    const [showLoading, setShowLoading] = useState(false)
    const [hasTimedOut, setHasTimedOut] = useState(false)
    const delayTimeoutRef = useRef<NodeJS.Timeout>()
    const mainTimeoutRef = useRef<NodeJS.Timeout>()

    // Handle delay before showing loading state
    useEffect(() => {
      if (isLoading) {
        if (delay > 0) {
          delayTimeoutRef.current = setTimeout(() => {
            setShowLoading(true)
          }, delay)
        } else {
          setShowLoading(true)
        }
      } else {
        setShowLoading(false)
        setHasTimedOut(false)
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current)
        }
      }

      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current)
        }
      }
    }, [isLoading, delay])

    // Handle timeout
    useEffect(() => {
      if (isLoading && timeout && timeout > 0) {
        mainTimeoutRef.current = setTimeout(() => {
          setHasTimedOut(true)
          onTimeout?.()
        }, timeout)
      }

      return () => {
        if (mainTimeoutRef.current) {
          clearTimeout(mainTimeoutRef.current)
        }
      }
    }, [isLoading, timeout, onTimeout])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current)
        }
        if (mainTimeoutRef.current) {
          clearTimeout(mainTimeoutRef.current)
        }
      }
    }, [])

    const shouldShowLoading = isLoading && (delay === 0 || showLoading)

    const defaultLoadingComponent = (
      <div className="flex items-center justify-center p-4">
        <ColourfulTextLoading text="Loading..." />
      </div>
    )

    return (
      <div ref={ref} className={className}>
        <AnimatePresence mode="wait">
          {shouldShowLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {hasTimedOut && onTimeout ? (
                <div role="status" aria-live="polite" className="text-center p-4">
                  <p className="text-muted-foreground">
                    This is taking longer than expected...
                  </p>
                </div>
              ) : (
                fallback || loadingComponent || defaultLoadingComponent
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

LoadingWrapper.displayName = 'LoadingWrapper'

export default LoadingWrapper