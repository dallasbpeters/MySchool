export type TTheme = 'light' | 'dark' | 'system';

// Assignment type definition
export interface Assignment {
  id: string
  title: string
  content: string | null
  links: Array<{ title: string; url: string; type?: 'link' | 'video' }>
  due_date: string
  completed?: boolean
  completed_at?: string
  category?: string
  is_recurring?: boolean
  recurrence_pattern?: {
    days: string[]
    frequency?: 'weekly' | 'daily'
  }
  recurrence_end_date?: string
  next_due_date?: string
  instance_completions?: Record<string, { completed: boolean; completed_at?: string; instance_date: string }>
}

// Note type definition
export interface Note {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  assignment_id?: string
}
