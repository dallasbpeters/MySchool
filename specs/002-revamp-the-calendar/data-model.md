# Data Model: Calendar and Assignment Display

## Core Entities

### CalendarItem (Unified Display Entity)
```typescript
interface CalendarItem {
  id: string
  type: 'event' | 'assignment'
  title: string
  startDate: string
  endDate: string
  isAllDay: boolean
  color: TEventColor
  description?: string
  
  // Event-specific fields
  user?: IUser
  
  // Assignment-specific fields
  isAssignment?: boolean
  assignedStudents?: StudentInitial[]
  completionStatus?: AssignmentStatus
  assignmentId?: string
  dueDate?: string
}
```

**Purpose**: Unified interface for calendar rendering that handles both events and assignments.

**Validation Rules**:
- `type` determines which optional fields are required
- `isAllDay` must be true for assignments
- `assignedStudents` required when `type === 'assignment'`
- `user` required when `type === 'event'`

### StudentInitial (Name to Initials Conversion)
```typescript
interface StudentInitial {
  studentId: string
  fullName: string
  initials: string
  displayName: string // For tooltips and aria-labels
}

interface InitialGenerationResult {
  initials: StudentInitial[]
  hasOverflow: boolean
  overflowCount: number
  displayInitials: StudentInitial[] // First 3 for display
}
```

**Purpose**: Manages student name to initial conversion with conflict resolution.

**Validation Rules**:
- `initials` must be 2-3 characters (JD, JMD, JD2)
- `initials` must be unique within assignment scope
- `fullName` required for tooltip display
- `displayName` must match fullName for accessibility

### AssignmentDisplay (Assignment-Specific Rendering)
```typescript
interface AssignmentDisplay {
  assignmentId: string
  title: string
  dueDate: string
  assignedStudents: StudentInitial[]
  completionStatus: AssignmentCompletionStatus
  isOverdue: boolean
  category?: string
  parentId: string // Creator of assignment
}

type AssignmentCompletionStatus = {
  allCompleted: boolean
  completedCount: number
  totalCount: number
  completions: Array<{
    studentId: string
    completed: boolean
    completedAt?: string
  }>
}
```

**Purpose**: Assignment-specific data structure for calendar display.

**Validation Rules**:
- `dueDate` must be valid ISO date string
- `completedCount` must be ≤ `totalCount`
- `isOverdue` calculated based on dueDate vs current date
- `assignedStudents` length must equal `totalCount`

### RolePermissions (Access Control)
```typescript
interface RolePermissions {
  userId: string
  role: 'student' | 'parent' | 'admin'
  canViewKanban: boolean
  canCreateAssignments: boolean
  canEditAssignments: boolean
  canEditOwnEvents: boolean
  canEditAllEvents: boolean
  
  // Student-specific
  studentIds?: string[] // For parent role
  
  // Filtering
  visibleAssignments: string[]
  visibleEvents: string[]
}
```

**Purpose**: Defines what each user role can see and modify.

**Validation Rules**:
- `role` determines default permission values
- `studentIds` required for parent role
- `visibleAssignments` filtered based on role and student relationships
- Students can only see their own assigned assignments

## State Relationships

### Calendar State Integration
```typescript
interface CalendarState {
  events: CalendarItem[]
  assignments: CalendarItem[]
  allItems: CalendarItem[] // Merged and filtered
  loading: boolean
  error?: string
  
  // View state
  selectedDate: Date
  viewMode: 'day' | 'week' | 'month' | 'year' | 'agenda'
  selectedUserId: string | 'all'
  
  // Permissions
  userPermissions: RolePermissions
}
```

**State Transitions**:
1. Load user permissions
2. Fetch events and assignments based on permissions
3. Transform assignments to CalendarItem format
4. Generate student initials for assignments
5. Apply role-based filtering
6. Merge events and assignments into allItems
7. Apply date/user filters for display

### Assignment-Calendar Synchronization
```typescript
interface AssignmentCalendarSync {
  lastSyncTimestamp: number
  pendingUpdates: AssignmentUpdate[]
  optimisticUpdates: Map<string, CalendarItem>
  
  // Real-time sync
  subscriptions: {
    assignments: SupabaseSubscription
    events: SupabaseSubscription
  }
}

interface AssignmentUpdate {
  assignmentId: string
  type: 'completion' | 'assignment' | 'deletion'
  studentId?: string
  completed?: boolean
  optimistic: boolean
}
```

**Purpose**: Manages real-time synchronization between assignment changes and calendar display.

## Initial Generation Algorithm

### Conflict Resolution Strategy
```typescript
class InitialGenerator {
  private usedInitials = new Set<string>()
  
  generateInitials(students: Array<{id: string, firstName: string, lastName: string, middleName?: string}>): StudentInitial[] {
    const results: StudentInitial[] = []
    
    for (const student of students) {
      let initials = this.tryGenerate(student)
      let attempt = 1
      
      while (this.usedInitials.has(initials) && attempt < 10) {
        initials = this.generateWithConflictResolution(student, attempt)
        attempt++
      }
      
      this.usedInitials.add(initials)
      results.push({
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        initials,
        displayName: `${student.firstName} ${student.lastName}`
      })
    }
    
    return results
  }
  
  private tryGenerate(student: StudentInfo): string {
    return student.firstName[0].toUpperCase() + student.lastName[0].toUpperCase()
  }
  
  private generateWithConflictResolution(student: StudentInfo, attempt: number): string {
    if (attempt === 1 && student.middleName) {
      return student.firstName[0].toUpperCase() + 
             student.middleName[0].toUpperCase() + 
             student.lastName[0].toUpperCase()
    }
    
    const base = this.tryGenerate(student)
    return base + (attempt + 1)
  }
}
```

## Database Schema Considerations

### No Schema Changes Required
The current database schema supports all requirements:

- `assignments` table: Contains assignment data
- `student_assignments` table: Links students to assignments with completion status
- `profiles` table: Contains student/parent information for initial generation
- `events` table: Contains calendar events

### Data Transformation Layer
```typescript
// Transform assignment to calendar item
function assignmentToCalendarItem(
  assignment: Assignment,
  studentAssignments: StudentAssignment[],
  students: Profile[]
): CalendarItem {
  const assignedStudents = generateStudentInitials(students)
  const completionStatus = calculateCompletionStatus(studentAssignments)
  
  return {
    id: `assignment-${assignment.id}`,
    type: 'assignment',
    title: assignment.title,
    startDate: assignment.due_date,
    endDate: assignment.due_date,
    isAllDay: true,
    color: getAssignmentColor(completionStatus, assignment.due_date),
    isAssignment: true,
    assignedStudents,
    completionStatus,
    assignmentId: assignment.id,
    dueDate: assignment.due_date
  }
}
```

**Purpose**: Bridges existing database schema with new calendar display requirements without requiring migrations.