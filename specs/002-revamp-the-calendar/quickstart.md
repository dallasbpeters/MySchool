# Quickstart: Calendar and Assignment Integration Testing

## Overview
This quickstart guide validates the calendar and assignment integration feature implementation. Follow these steps to verify that the enhanced calendar display meets all functional requirements.

## Prerequisites
- Development environment running with test database
- Test users created with different roles (student, parent, admin)
- Sample assignments and events in the database

## Test Data Setup

### Create Test Users
```sql
-- Parent user
INSERT INTO profiles (id, first_name, last_name, role, email) VALUES 
('parent1', 'Sarah', 'Johnson', 'parent', 'sarah@example.com');

-- Student users (children of Sarah)
INSERT INTO profiles (id, first_name, last_name, role, email, parent_id) VALUES 
('student1', 'John', 'Johnson', 'student', 'john@example.com', 'parent1'),
('student2', 'Mary', 'Johnson', 'student', 'mary@example.com', 'parent1'),
('student3', 'James', 'Davis', 'student', 'james@example.com', 'parent1');

-- Admin user
INSERT INTO profiles (id, first_name, last_name, role, email) VALUES 
('admin1', 'Mike', 'Administrator', 'admin', 'admin@example.com');
```

### Create Test Assignments
```sql
-- Math assignment due tomorrow
INSERT INTO assignments (id, title, content, due_date, category, parent_id) VALUES 
('assign1', 'Math Homework Ch. 5', 'Complete exercises 1-20', '2025-09-11', 'Math', 'parent1');

-- Science assignment due next week
INSERT INTO assignments (id, title, content, due_date, category, parent_id) VALUES 
('assign2', 'Science Lab Report', 'Write lab report on chemical reactions', '2025-09-17', 'Science', 'parent1');

-- Overdue assignment
INSERT INTO assignments (id, title, content, due_date, category, parent_id) VALUES 
('assign3', 'History Essay', 'Write essay on American Revolution', '2025-09-08', 'History', 'parent1');
```

### Create Student Assignment Links
```sql
-- Assign Math homework to John and Mary
INSERT INTO student_assignments (assignment_id, student_id, completed) VALUES 
('assign1', 'student1', false),
('assign1', 'student2', true);

-- Assign Science lab to all three students
INSERT INTO student_assignments (assignment_id, student_id, completed) VALUES 
('assign2', 'student1', false),
('assign2', 'student2', false),
('assign2', 'student3', false);

-- Assign History essay to James only
INSERT INTO student_assignments (assignment_id, student_id, completed) VALUES 
('assign3', 'student3', false);
```

### Create Test Events
```sql
-- Regular calendar event
INSERT INTO events (id, title, start_date, end_date, description, user_id) VALUES 
('event1', 'Parent-Teacher Conference', '2025-09-12 14:00:00', '2025-09-12 15:00:00', 'Meeting with teacher', 'parent1');
```

## Validation Steps

### 1. Student Initial Generation Test

**Expected Behavior**: Student initials should be unique and follow naming convention.

**Test Steps**:
1. Navigate to calendar view as parent
2. Look at assignment items
3. Verify initials display:
   - John Johnson → "JJ"
   - Mary Johnson → "MJ" (conflict resolved)
   - James Davis → "JD"

**Pass Criteria**:
- [ ] All students have unique 2-letter initials
- [ ] Conflict resolution works (different initials for same first letter)
- [ ] Initials are readable and make sense

### 2. Assignment Time Hiding Test

**Expected Behavior**: Assignments should not show times, only student initials.

**Test Steps**:
1. View calendar in month or week view
2. Compare event vs assignment display
3. Check assignment format

**Pass Criteria**:
- [ ] Events show time (e.g., "2:00 PM - 3:00 PM")
- [ ] Assignments show NO time
- [ ] Assignments show student initials (e.g., "JJ, MJ")
- [ ] Clear visual distinction between events and assignments

### 3. Role-Based Access Test

**Expected Behavior**: Different user roles see appropriate content and features.

**Student Role Test**:
1. Login as student1 (John)
2. Navigate to calendar
3. Check kanban access

**Pass Criteria (Student)**:
- [ ] Can see calendar with only their assignments
- [ ] Cannot access kanban view (should show access denied or hidden)
- [ ] Can toggle completion status on their assignments
- [ ] Cannot edit assignment due dates
- [ ] Can create and edit their own events

**Parent Role Test**:
1. Login as parent1 (Sarah)
2. Navigate to calendar
3. Check kanban access

**Pass Criteria (Parent)**:
- [ ] Can see calendar with all children's assignments
- [ ] CAN access kanban view for creating assignments
- [ ] Can filter calendar by specific child
- [ ] Can see completion status for all children
- [ ] Can create/edit assignments in kanban

**Admin Role Test**:
1. Login as admin1
2. Navigate to calendar and kanban

**Pass Criteria (Admin)**:
- [ ] Can see all assignments and events
- [ ] CAN access kanban view
- [ ] Can see parent context for assignments
- [ ] Full editing permissions

### 4. Multiple Assignee Display Test

**Expected Behavior**: Assignments with multiple students show all responsible parties clearly.

**Test Steps**:
1. Look at Math assignment (assigned to John and Mary)
2. Check display format
3. Verify completion status affects display

**Pass Criteria**:
- [ ] Shows "JJ, MJ" or similar initials
- [ ] Completion status visible (Mary completed, John not)
- [ ] Color coding reflects mixed completion (yellow/orange)
- [ ] Tooltip shows full names on hover

### 5. Overdue Assignment Visual Test

**Expected Behavior**: Overdue assignments have distinct visual treatment.

**Test Steps**:
1. Look at History assignment (due 2025-09-08, should be overdue)
2. Check visual indicators

**Pass Criteria**:
- [ ] Assignment has red color or overdue styling
- [ ] Still shows student initial "JD"
- [ ] Clear overdue indicator (text or icon)
- [ ] No time displayed (still hidden)

### 6. Assignment Status Color Coding Test

**Expected Behavior**: Assignment colors reflect completion status.

**Test Steps**:
1. Review all three test assignments
2. Verify color coding

**Pass Criteria**:
- [ ] All completed: Gray color
- [ ] None completed + not overdue: Yellow color
- [ ] None completed + overdue: Red color
- [ ] Partially completed: Orange/amber color

### 7. Calendar Filtering Test

**Expected Behavior**: Parents can filter calendar by specific child.

**Test Steps**:
1. Login as parent
2. Use calendar filter to select "John" only
3. Verify only John's assignments show

**Pass Criteria**:
- [ ] Filter dropdown shows all children's names
- [ ] Selecting child filters assignments correctly
- [ ] Parent's own events still show
- [ ] Assignment initials update to show only selected child

### 8. Kanban Integration Test

**Expected Behavior**: Kanban is separate for assignment creation, no visual connection needed.

**Test Steps**:
1. Access kanban as parent
2. Create new assignment
3. Verify it appears in calendar

**Pass Criteria**:
- [ ] Kanban accessible only to parents/admins
- [ ] Can create assignments in kanban
- [ ] New assignments appear in calendar view
- [ ] Assignment creation updates calendar in real-time

## Performance Validation

### Load Time Test
**Target**: Calendar renders in < 200ms

**Test Steps**:
1. Open browser developer tools
2. Navigate to calendar page
3. Check Network and Performance tabs

**Pass Criteria**:
- [ ] Initial calendar load < 200ms
- [ ] Assignment data fetching < 100ms
- [ ] Student initial generation < 50ms

### Responsive Design Test
**Test Steps**:
1. Test calendar on mobile viewport
2. Check assignment initial display
3. Verify touch interactions

**Pass Criteria**:
- [ ] Student initials readable on mobile
- [ ] Assignment cards don't overflow
- [ ] Touch events work for completion toggle

## Accessibility Validation

### Screen Reader Test
**Test Steps**:
1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate calendar with keyboard only
3. Check assignment announcements

**Pass Criteria**:
- [ ] Assignment titles announced correctly
- [ ] Student names announced (not just initials)
- [ ] Completion status announced
- [ ] Due dates announced clearly

### Keyboard Navigation Test
**Test Steps**:
1. Navigate calendar using only Tab/Arrow keys
2. Try to complete assignments via keyboard

**Pass Criteria**:
- [ ] All calendar items reachable via keyboard
- [ ] Assignment completion toggle via keyboard
- [ ] Focus indicators visible
- [ ] Logical tab order

## Error Handling Test

### Assignment Access Test
**Test Steps**:
1. Login as student
2. Try to access assignment not assigned to them
3. Check error handling

**Pass Criteria**:
- [ ] Graceful error messages
- [ ] No sensitive data leaked
- [ ] Appropriate HTTP status codes
- [ ] User redirected appropriately

## Final Validation Checklist

- [ ] All functional requirements (FR-001 through FR-015) validated
- [ ] Role-based access working correctly
- [ ] Student initials display properly
- [ ] Time hiding for assignments works
- [ ] Performance targets met
- [ ] Accessibility requirements met
- [ ] Error handling robust
- [ ] Mobile responsiveness confirmed

## Cleanup

After testing, clean up test data:
```sql
DELETE FROM student_assignments WHERE assignment_id IN ('assign1', 'assign2', 'assign3');
DELETE FROM assignments WHERE id IN ('assign1', 'assign2', 'assign3');
DELETE FROM events WHERE id = 'event1';
DELETE FROM profiles WHERE id IN ('parent1', 'student1', 'student2', 'student3', 'admin1');
```

---

**Success Criteria**: All checkboxes above must be marked as passed for the feature to be considered complete and ready for production deployment.