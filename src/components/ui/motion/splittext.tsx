"use client"

import { animate, keyframes, stagger } from 'motion/react'
import { splitText } from 'motion-plus'
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SplitTextProps {
  text?: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
}

export default function SplitText({
  text = "Level up your animations with the all-in membership",
  className,
  as: Component = 'h1'
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.fonts.ready.then(() => {
      if (!containerRef.current) return

      // Show the container when fonts are loaded
      containerRef.current.style.visibility = "visible"

      const textElement = containerRef.current.querySelector('[data-split-text]')
      if (!textElement) return

      const { chars } = splitText(textElement as HTMLElement)

      // Animate the characters
      animate(
        chars,
        {
          opacity: [0, 1], y: [10, 0],
          filter: ['blur(10px)', 'blur(0px)'],
        },
        {
          type: "spring",
          duration: 0.3,
          bounce: 0,
          delay: stagger(0.02), // Much faster stagger - 0.02s between each character
        },

      )
    })
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex justify-center items-center w-full max-w-md text-left invisible",
        className
      )}
      style={{ willChange: 'visibility' }}
    >
      <Component
        data-split-text
        className="split-text-element font-bold"
        style={{ willChange: 'transform, opacity' }}
      >
        {text}
      </Component>
    </div>
  )
}
