export interface Note {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  assignment_id?: string
}

export interface GroupedNotes {
  [category: string]: Note[]
}

export class NoteService {
  static groupByCategory(notes: Note[]): GroupedNotes {
    return notes.reduce((groups, note) => {
      const category = note.category || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(note)
      return groups
    }, {} as GroupedNotes)
  }

  static async fetchNotes(): Promise<Note[]> {
    try {
      const response = await fetch('/api/notes')
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      const data = await response.json()
      return data.notes || []
    } catch (error) {
      console.error('Error fetching notes:', error)
      return []
    }
  }

  static async createNote(noteData: {
    title: string
    content: string
    category: string
    assignment_id?: string
  }): Promise<{ success: boolean; note?: Note; error?: string }> {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note')
      }

      return { success: true, note: data.note }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create note'
      }
    }
  }

  static async updateNote(
    noteId: string,
    updates: { title?: string; content?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, ...updates })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update note')
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update note'
      }
    }
  }

  static async deleteNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete note')
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete note'
      }
    }
  }
}
