import { NotebookText, BookA, History, ThumbsUp } from 'lucide-react'

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock'

export type TabValue = 'assignments' | 'timeline' | 'notes'

const data = [
  {
    title: 'Assignments',
    icon: <BookA className="h-full w-full" />,
    value: 'assignments' as TabValue,
  },
  {
    title: 'Timeline',
    icon: <History className="h-full w-full" />,
    value: 'timeline' as TabValue,
  },
  {
    title: 'Notes',
    icon: <NotebookText className="h-full w-full " />,
    value: 'notes' as TabValue,
  },
  {
    title: 'Recommendations',
    icon: <ThumbsUp className="h-full w-full" />,
    value: 'recommendations' as TabValue,
  },
]

interface LocalDockProps {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
}

export function LocalDock({ activeTab, onTabChange }: LocalDockProps) {
  return (
    <div className="z-50 fixed bottom-10 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3 bg-foreground/80">
        {data.map((item, idx) => (
          <DockItem
            key={idx}
            className={`cursor-pointer aspect-square rounded-full transition-colors ${
              activeTab === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground dark:bg-neutral-800'
            }`}
            onClick={() => onTabChange(item.value)}
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon className="text-inherit">{item.icon}</DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  )
}
