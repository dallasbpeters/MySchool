import * as React from 'react'

type PageGridVariant =
  | 'default'
  | 'grid'
  | 'gridTight'
  | 'gradient'
  | 'color'
  | 'none'

interface PageGridProps {
  variant?: PageGridVariant
}

const getPageGridStyles = (variant: PageGridVariant): string => {
  switch (variant) {
    case 'default':
      return `
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          isolation: isolate;
          pointer-events: none;
          background-image: linear-gradient(to right, var(--border) 1px, transparent 1px),
                           linear-gradient(to bottom, var(--border) 1px, transparent 1px);
          background-size: 20px 30px;
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%);
          opacity: 0.3;
        }
      `

    case 'grid':
      return `
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          isolation: isolate;
          pointer-events: none;
          background-image: linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px);
          background-size: 10px 10px;
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%);
          opacity: 0.5;
        }
      `

    case 'gridTight':
      return `
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          isolation: isolate;
          pointer-events: none;
          background-image: linear-gradient(to right, var(--border) 1px, transparent 1px),
                           linear-gradient(to bottom, var(--border) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.4;
        }
      `

    case 'gradient':
      return `
        body::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          isolation: isolate;
          pointer-events: none;
          background-image: linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px), radial-gradient(circle 800px at 0% 100%, color-mix(in srgb, var(--color-primary) 50%, transparent), transparent), radial-gradient(circle 500px at 100% 0%, color-mix(in srgb, var(--color-primary) 50%, transparent), transparent) ;
          background-size: 8px 8px, 8px 8px, 100% 100%, 100% 100%;
          -webkit-mask-image: radial-gradient(ellipse 100% 60% at 50% 100%, #fff 60%, transparent 100%);
          mask-image: radial-gradient(ellipse 100% 60% at 50% 100%, #fff 60%, transparent 100%);

        }
      `

    case 'color':
      return `
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 0;
          isolation: isolate;
          pointer-events: none;
          background: radial-gradient(125% 125% at 50% 10%, var(--color-background) 60%, var(--color-primary) 100%);
        }
      `

    case 'none':
      return ''

    default:
      return getPageGridStyles('default')
  }
}

export default function PageGrid({ variant = 'default' }: PageGridProps) {
  if (variant === 'none') return null

  return <style>{getPageGridStyles(variant)}</style>
}

// Export types for use in other components
export type { PageGridVariant }
