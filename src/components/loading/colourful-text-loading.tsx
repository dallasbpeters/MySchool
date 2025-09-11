'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { ColourfulTextLoadingProps } from '@/types/loading'

/**
 * Enhanced ColourfulText component for loading states with accessibility
 */
export default function ColourfulTextLoading({
  text = 'Loading...',
  size = 'medium',
  className,
  animate = true,
  testId,
  ariaLabel
}: ColourfulTextLoadingProps) {
  const colors = useMemo(
    () => [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
    ],
    []
  )

  const [currentColors, setCurrentColors] = useState(colors)
  const [count, setCount] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Color animation effect
  useEffect(() => {
    if (!animate || reducedMotion) return

    const interval = setInterval(() => {
      const shuffled = [...colors].sort(() => Math.random() - 0.5)
      setCurrentColors(shuffled)
      setCount((prev) => prev + 1)
    }, 5000)

    return () => clearInterval(interval)
  }, [colors, animate, reducedMotion])

  // Size classes
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  // Handle empty text
  const displayText = text || 'Loading...'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || displayText}
      aria-busy="true"
      data-testid={testId}
      data-animate={animate.toString()}
      data-reduced-motion={reducedMotion.toString()}
      className={cn(
        'inline-flex items-center',
        sizeClasses[size],
        'font-sans font-medium tracking-normal',
        'word-break-break-word', // Handle long text
        className
      )}
    >
      {displayText.split('').map((char, index) => (
        <motion.span
          key={`${char}-${count}-${index}`}
          initial={{
            y: 0,
            opacity: 1,
            scale: 1,
          }}
          animate={animate && !reducedMotion ? {
            color: currentColors[index % currentColors.length],
            y: [0, -3, 0],
            scale: [1, 1.01, 1],
            filter: ['blur(0px)', 'blur(5px)', 'blur(0px)'],
            opacity: [1, 0.8, 1],
          } : {
            color: currentColors[index % currentColors.length],
          }}
          transition={{
            duration: reducedMotion ? 0 : 0.5,
            delay: reducedMotion ? 0 : index * 0.05,
          }}
          className="inline-block whitespace-pre text-inherit"
        >
          {char}
        </motion.span>
      ))}
      
      {/* Hidden text for screen readers */}
      <span className="sr-only">
        {displayText}
      </span>
    </div>
  )
}