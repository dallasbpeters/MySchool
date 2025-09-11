- dont run npm run dev. I most likely have a server already running.
- use the mcp tool to interact with Supabase

## Calendar and Assignment Integration Context

### Role-Based Access Control
- **Students**: Calendar view only, can edit own events, read-only on assignments, cannot edit assignment dates
- **Parents**: Calendar + Kanban views, can create/edit assignments for their children, kanban is for assignment creation only
- **Admins**: Full access to all views and data

### Assignment Display Rules
- Assignments show student initials instead of times (e.g., "JD, MS, AB")
- Hide time display completely for assignments (misleading)
- Visual differentiation: events show times, assignments show initials
- Color coding: red=overdue, yellow=due soon, green=completed, gray=all completed

### Student Initial Generation
- Format: 2-letter initials (FirstName[0] + LastName[0])
- Conflict resolution: Use middle name or numeric suffix (JD2, JD3)
- Display up to 3 initials with "+N" overflow indicator
- Tooltip shows full names for accessibility

### Key Files for Calendar/Assignment Integration
- `/src/app/api/events/route.ts` - Events API with assignment integration
- `/src/calendar/components/client-container.tsx` - Main calendar view
- `/src/components/kanban-assignment-board.tsx` - Kanban for assignment creation
- `/src/services/assignment-service.ts` - Assignment business logic
- `/src/types/index.ts` - Shared type definitions

### Recent Changes (Feature 002-revamp-the-calendar)
- Enhanced calendar display to show student initials for assignments
- Implemented role-based kanban access (parents/admins only)
- Added visual differentiation between events and assignments
- Created unified CalendarItem interface for display consistency
