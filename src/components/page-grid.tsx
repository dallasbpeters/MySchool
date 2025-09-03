import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const pageGridVariants = cva(
  "fixed inset-0 z-0",
  {
    variants: {
      variant: {
        default: "",
        grid: "opacity-100",
        color: "opacity-100"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export default function PageGrid({ variant }: { variant: VariantProps<typeof pageGridVariants>["variant"] }) {
  const gridStyle = variant === "grid" ? {
    backgroundImage:
      'linear-gradient(to right, var(--muted) 1px, transparent 1px), linear-gradient(to bottom, var(--muted) 1px, transparent 1px)',
    backgroundSize: '20px 30px',
    WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)',
    maskImage: 'radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)'
  }
    : variant === "color" ? {
      backgroundImage: `
        radial-gradient(125% 125% at 50% 10%, var(--color-background) 60%, var(--color-primary) 100%)
      `,
      backgroundSize: "100% 100%",
    } : {}

  return (
    <div
      className={pageGridVariants({ variant })}
      style={gridStyle}
    />
  )
}
