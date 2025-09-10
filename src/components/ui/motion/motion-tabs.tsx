/**
 * MotionTabs - A reusable animated tab component using Framer Motion
 *
 * Features:
 * - Smooth tab indicator animation using layoutId
 * - Content transitions with fade and slide effects
 * - Fully customizable styling
 * - TypeScript support with proper interfaces
 * - Accessibility features (ARIA attributes, keyboard support)
 * - Callback support for tab changes
 *
 * Usage:
 * ```tsx
 * import MotionTabs from './motion-tabs'
 *
 * const tabs = [
 *   {
 *     id: 'tab1',
 *     label: 'Tab 1',
 *     content: <div>Content for tab 1</div>
 *   },
 *   {
 *     id: 'tab2',
 *     label: 'Tab 2',
 *     content: <div>Content for tab 2</div>
 *   }
 * ]
 *
 * <MotionTabs
 *   tabs={tabs}
 *   defaultSelectedId="tab1"
 *   onTabChange={(tabId) => console.log('Selected:', tabId)}
 *   className="custom-tabs"
 *   showContent={true}
 * />
 * ```
 */

import { motion } from "motion/react"
import { useState, ReactNode } from "react"

interface TabItem {
  id: string
  label: ReactNode
  content?: ReactNode
}

interface MotionTabsProps {
  tabs: TabItem[]
  defaultSelectedId?: string
  onTabChange?: (tabId: string) => void
  className?: string
  tabClassName?: string
  contentClassName?: string
  showContent?: boolean
}

interface TabProps {
  item: TabItem
  isSelected: boolean
  onClick: () => void
  className?: string
}

function Tab({ item, isSelected, onClick, className }: TabProps) {
  return (
    <li
      className={className}
      role="tab"
      aria-selected={isSelected}
    >
      {isSelected ? (
        <motion.div
          layoutId="selected-indicator"
          className="selected-indicator"
        />
      ) : null}
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        whileFocus={{
          backgroundColor: "var(--accent-transparent)",
        }}
        className="tab-button"
      >
        {item.label}
      </motion.button>
    </li>
  )
}

export default function MotionTabs({
  tabs,
  defaultSelectedId,
  onTabChange,
  className = "",
  tabClassName = "",
  contentClassName = "",
  showContent = true
}: MotionTabsProps) {
  const [selectedTabId, setSelectedTabId] = useState<string>(
    defaultSelectedId || tabs[0]?.id || ""
  )

  const handleTabClick = (tabId: string) => {
    setSelectedTabId(tabId)
    onTabChange?.(tabId)
  }

  const selectedTab = tabs.find(tab => tab.id === selectedTabId)

  return (
    <>
      <nav className={`motion-tabs ${className}`}>
        <ul className="tabs-list">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              item={tab}
              isSelected={selectedTabId === tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={tabClassName}
            />
          ))}
        </ul>
      </nav>
      {showContent && selectedTab?.content && (
        <motion.div
          key={selectedTabId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`tab-content ${contentClassName}`}
        >
          {selectedTab.content}
        </motion.div>
      )}
      <StyleSheet />
    </>
  )
}

/**
 * ==============   Styles   ================
 */

function StyleSheet() {
  return (
    <style>{`
        .motion-tabs {
            background-color: var(--card);
            border-radius: 10px;
            border: 1px solid var(--border);
            padding: 5px;
        }

        .motion-tabs .tabs-list {
            display: flex;
            gap: 5px;
            flex-direction: row;
            align-items: center;
            justify-content: start;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .motion-tabs li {
            color: var(--foreground);
            position: relative;
        }

        .motion-tabs .selected-indicator {
            background-color: var(--secondary);
            color: var(--accent-foreground);
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            z-index: 1;
            border-radius: 5px;
        }

        .motion-tabs .tab-button {
            z-index: 2;
            position: relative;
            cursor: pointer;
            padding: 10px 14px;
            border-radius: 5px;
            border: none;
            background: transparent;
            color: inherit;
            font: inherit;
        }

        .motion-tabs .tab-content {
            margin-top: 15px;
            padding: 15px;
            background-color: var(--muted);
            border-radius: 5px;
            min-height: 50px;
        }

    `}</style>
  )
}
