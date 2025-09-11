# Research: Calendar and Kanban Integration Patterns

## Overview
Research findings for implementing improved calendar assignment display and role-based kanban access controls.

## Multi-User Display Patterns for Calendar Items

### Decision: Initial Badges with Overflow Tooltip
**What was chosen**: Display up to 3 student initials as compact badges (e.g., "JD", "MS", "AB") with "+2" overflow indicator and tooltip showing all names.

**Rationale**: 
- Maximizes scannable information in limited calendar cell space
- Provides immediate visual identification of responsibility
- Gracefully handles both few and many assignees
- Maintains calendar grid layout integrity

**Alternatives considered**:
- Avatars: Too space-consuming, requires image management
- Full names: Causes text overflow and layout breaks
- Single "Multiple Students" label: Loses individual accountability
- Scrollable list: Poor UX on mobile, complex interaction

### Implementation Pattern
```
┌─────────────────────┐
│ Assignment Title    │
│ [JD] [MS] [AB] +2   │ ← Initials with overflow
│ Due: Oct 15         │
└─────────────────────┘
```

## Initial Generation from Names

### Decision: Smart Initial Algorithm with Conflict Resolution
**What was chosen**: Two-letter initials (first + last) with automatic conflict resolution using middle names or incremental suffixes.

**Rationale**:
- More unique than single letters
- Follows common convention (email signatures, business cards)
- Automatic conflict resolution prevents duplication
- Deterministic algorithm ensures consistency

**Algorithm**:
1. Generate: FirstName[0] + LastName[0] (e.g., "John Doe" → "JD")
2. If conflict exists: Try FirstName[0] + MiddleName[0] + LastName[0] (e.g., "John M. Doe" → "JMD")
3. If still conflict: Add numeric suffix (e.g., "JD2", "JD3")
4. Cache results for consistent display

**Alternatives considered**:
- Single letter: High collision rate (multiple "J" students)
- Full first name: Too long for compact display
- Random assignment: Not deterministic, confusing for users
- UUID-based: Not human-readable

## Calendar Event vs Assignment Visual Differentiation

### Decision: Typography and Color-Based Distinction
**What was chosen**: Use distinct visual treatment for events vs assignments while maintaining accessibility.

**Visual Differences**:
- **Events**: Show time prominently, solid border, clock icon
- **Assignments**: Hide time, show initials prominently, dashed border, assignment icon
- **Color coding**: Status-based (red=overdue, yellow=due soon, green=completed, gray=all completed)

**Rationale**:
- Clear visual hierarchy prevents time confusion
- Icon + border patterns provide redundant visual cues
- Color remains functional (status) rather than decorative
- Accessible to colorblind users via pattern differences

**Alternatives considered**:
- Shape-based: Calendar limitations on custom shapes
- Size-based: Breaks grid layout consistency
- Position-based: Confusing for users expecting chronological order
- Animation-based: Distracting, poor performance on mobile

## Role-Based Access Patterns

### Decision: Component-Level Permission Guards
**What was chosen**: Implement permission checks at component level with clear access control boundaries.

**Access Model**:
- **Students**: Calendar view only, can edit own events, read-only on assignments
- **Parents**: Calendar + Kanban views, can create/edit assignments for their children
- **Admins**: Full access to all views and all data

**Implementation Pattern**:
```typescript
const KanbanBoard = () => {
  const { user, role } = useAuth()
  
  if (role === 'student') {
    return <AccessDenied message="Assignment creation requires parent access" />
  }
  
  return <AssignmentKanbanView />
}
```

**Rationale**:
- Clear separation of concerns
- Explicit permission failures (not hidden features)
- Maintainable permission logic
- Testable access control

## State Management for Calendar/Assignment Integration

### Decision: Unified Calendar State with Assignment Transformation
**What was chosen**: Single calendar state that transforms assignments into calendar events for display purposes.

**Data Flow**:
1. Fetch assignments and events separately
2. Transform assignments to calendar event format
3. Merge into unified calendar state
4. Apply role-based filtering
5. Render with appropriate visual treatment

**Rationale**:
- Leverages existing calendar rendering logic
- Maintains data source separation
- Enables independent caching strategies
- Simplifies component props interface

## Performance Considerations

### Decision: Optimistic Updates with Background Sync
**What was chosen**: Immediate UI updates with background API calls and rollback on failure.

**Pattern**:
- Assignment completion toggles update UI immediately
- Background API call confirms change
- On failure, revert UI and show error
- On success, update cache timestamp

**Rationale**:
- Perceived performance improvement
- Better user experience on slow connections
- Handles offline scenarios gracefully
- Maintains data consistency

## Accessibility Considerations

### Decision: ARIA Labels and Semantic HTML
**What was chosen**: Comprehensive accessibility support for calendar navigation and assignment identification.

**Implementation**:
- Student initials include full names in aria-label
- Assignment vs event distinction in screen reader text
- Keyboard navigation for calendar items
- High contrast mode support

**Rationale**:
- Meets WCAG 2.1 AA standards
- Improves usability for all users
- Required for educational institution compliance
- Future-proofs against accessibility audits

---

**Research Complete**: All design decisions documented with rationale and alternatives considered.