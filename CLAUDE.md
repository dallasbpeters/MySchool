# Claude Code Context: MySchool Performance Optimization

## Project Guidelines
- dont run npm run dev. I most likely have a server already running.
- use the mcp tool to interact with Supabase

## Tech Stack (Updated for Feature 003)
- **Frontend**: Next.js 15.5.2, React 19.1.1, TypeScript 5.9
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **Caching**: React Query v5 (NEW), Browser Cache, Local Storage
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Performance**: Custom metrics collection, loading state system
- **Testing**: Jest + React Testing Library (in implementation)

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

## Performance Optimization (Feature 003) - IN PROGRESS

### Cache Strategy
- **User Profiles**: 30 minutes TTL (rarely changes)
- **Calendar Events**: 5 minutes TTL (moderate updates)
- **Assignment Data**: 10 minutes TTL (occasional updates)
- **Real-time Data**: 30 seconds TTL (frequent updates)

### Performance Targets
- Initial page load: <2 seconds (75th percentile)
- Cached navigation: <500ms (95th percentile)
- Cache hit rate: >70% for repeated visits
- API responses: <200ms (95th percentile)

### Implementation Status
- ✅ Phase 0: Research complete (React Query chosen, testing strategy defined)
- 🔄 Phase 1: Design & Contracts (data model, API contracts, quickstart scenarios)
- ⏳ Phase 2: Task planning approach
- ⏳ Phase 3: Implementation tasks
- ⏳ Phase 4: Testing and validation

### Key Files Being Added/Modified
- `/src/lib/cache/` - Cache utilities and configuration
- `/src/components/loading/` - Loading state components
- `/src/hooks/use-performance.ts` - Performance monitoring hook
- `/api/cache/` - Cache management API endpoints

### Loading State System
- ColourfulText component for animated loading indicators
- Progress indicators for longer operations  
- Error states with retry functionality
- ARIA live regions for accessibility
