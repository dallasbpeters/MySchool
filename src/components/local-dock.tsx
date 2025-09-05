import {
  NotebookText,
  BookA,
  History,
} from 'lucide-react';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';

export type TabValue = 'assignments' | 'timeline' | 'notes';

const data = [
  {
    title: 'Assignments',
    icon: (
      <BookA className='h-full w-full text-foreground dark:text-neutral-300' />
    ),
    value: 'assignments' as TabValue,
  },
  {
    title: 'Timeline',
    icon: (
      <History className='h-full w-full text-foreground dark:text-neutral-300' />
    ),
    value: 'timeline' as TabValue,
  },
  {
    title: 'Notes',
    icon: (
      <NotebookText className='h-full w-full text-foreground dark:text-neutral-300' />
    ),
    value: 'notes' as TabValue,
  },
];

interface LocalDockProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

export function LocalDock({ activeTab, onTabChange }: LocalDockProps) {
  return (
    <div className='z-1000 fixed bottom-2 left-1/2 max-w-full -translate-x-1/2'>
      <Dock className='items-end pb-3 bg-foreground'>
        {data.map((item, idx) => (
          <DockItem
            key={idx}
            className={`aspect-square rounded-full transition-colors ${activeTab === item.value
              ? 'bg-chart-4 text-primary-foreground'
              : 'bg-gray-200 dark:bg-neutral-800'
              }`}
            onClick={() => onTabChange(item.value)}
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}
