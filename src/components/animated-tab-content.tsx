'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TabsContent } from '@/components/ui/tabs'

// Tab transition variants
const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

const tabTransition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1]
}

interface AnimatedTabContentProps {
  value: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function AnimatedTabContent({
  value,
  activeTab,
  children,
  className = "relative"
}: AnimatedTabContentProps) {
  return (
    <TabsContent value={value} className={className}>
      <AnimatePresence mode="wait">
        {activeTab === value && (
          <motion.div
            key={value}
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={tabTransition}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </TabsContent>
  )
}
