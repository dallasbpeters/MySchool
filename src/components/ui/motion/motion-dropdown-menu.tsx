'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

const highlight = {
  backgroundColor: 'var(--primary)',
  color: 'var(--primary-foreground)',
}

function DropdownItem({
  children,
  onClick,
  className = '',
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDragStart' | 'onDrop' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>) {
  return (
    <DropdownMenu.Item asChild>
      <motion.button
        className={`item ${className}`}
        whileHover={highlight}
        whileFocus={highlight}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.button>
    </DropdownMenu.Item>
  )
}

function RadixDropdown({
  triggerText = 'Options  ▾',
  children,
  className = '',
}: {
  triggerText?: string | React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`dropdown-container ${className}`}>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            className="trigger"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {triggerText}
          </motion.button>
        </DropdownMenu.Trigger>

        <AnimatePresence>
          {open && (
            <DropdownMenu.Portal forceMount>
              <DropdownMenu.Content asChild sideOffset={10}>
                <motion.div
                  className="content"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  {children}
                </motion.div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          )}
        </AnimatePresence>
      </DropdownMenu.Root>
      <StyleSheet />
    </div>
  )
}

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>{`
    @layer components {
            .dropdown-container {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: fit-content;
                gap: 4px;
                position: relative;
                z-index: 9999;
            }

            .trigger {
                @apply border-input;
                padding: 6px 16px;
                border-radius: var(--radius);
                background-color: var(--background);
                color: var(--foreground);
                border: 1px solid var(--input);
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                z-index: 9999;
                height: calc(var(--spacing) * 9);
                font-size: var(--text-sm);
            }

            .content {
                width: fit-content;
                max-width: 200px;
                min-width: 120px;
                background-color: var(--background);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 4px;
                transform-origin: var(--radix-dropdown-menu-content-transform-origin);
                box-sizing: border-box;
                z-index: 9999;
                overflow: hidden;
            }

            .item {
                width: 100%;
                padding: 8px 12px;
                border: none;
                background: none;
                color: var(--foreground);
                text-align: left;
                border-radius: var(--radius);
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                @apply text-sm;
                text-overflow: ellipsis;
                box-sizing: border-box;
            }

            .separator {
                height: 1px;
                background-color: var(--border);
                margin: 4px 0;
            }
            }
        `}</style>
  )
}

export default RadixDropdown
export { RadixDropdown, DropdownItem }
