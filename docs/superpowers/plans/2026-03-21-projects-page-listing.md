# Projects Page Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new Projects page that displays a listing of projects with key information and action buttons using existing UI components.

**Architecture:** Following Next.js App Router conventions, create a new page at `app/projects/page.tsx` that uses static mock data to display projects in a table format with status badges, progress bars, and action buttons. The implementation will use existing UI components from `@/components/ui/` and follow established code patterns from the codebase.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui components

---

### Task 1: Create Projects Page File Structure

**Files:**
- Create: `app/projects/page.tsx`

- [ ] **Step 1: Create basic file structure with client directive and imports**

```typescript
'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
```

- [ ] **Step 2: Add Project type definition and mock data**

```typescript
// Project type definition
type Project = {
  id: string
  name: string
  code: string
  type: 'Commercial' | 'Residential' | 'Industrial'
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  budget: number
  progress: number  // 0-100
  city: string
  startDate: string  // ISO date string
}

// Mock data (similar to current Dashboard)
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Downtown Office Tower',
    code: 'DOT-2024',
    type: 'Commercial',
    status: 'ACTIVE',
    budget: 5000000,
    progress: 45,
    city: 'San Francisco',
    startDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Residential Complex Phase 1',
    code: 'RCP-2024',
    type: 'Residential',
    status: 'PLANNING',
    budget: 2500000,
    progress: 10,
    city: 'Oakland',
    startDate: '2024-03-01',
  },
  {
    id: '3',
    name: 'Warehouse Expansion',
    code: 'WEX-2024',
    type: 'Industrial',
    status: 'ACTIVE',
    budget: 1200000,
    progress: 60,
    city: 'San Jose',
    startDate: '2024-02-01',
  },
]
```

- [ ] **Step 3: Add StatusBadge component for status visualization**

```typescript
// Status badge component
const StatusBadge = ({ status }: { status: Project['status'] }) => {
  const variants = {
    PLANNING: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ON_HOLD: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-purple-100 text-purple-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${variants[status]}`}>
      {status}
    </span>
  )
}
```

- [ ] **Step 4: Implement main ProjectsPage component structure**

```typescript
// Main ProjectsPage component
export default function ProjectsPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="sm">
            New Project
          </Button>
          <Button variant="default" size="sm">
            Import
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-20">Project</TableCell>
                <TableCell className="w-16">Type</TableCell>
                <TableCell className="w-16">Status</TableCell>
                <TableCell className="w-16">Budget</TableCell>
                <TableCell className="w-16">Progress</TableCell>
                <TableCell className="w-16">Location</TableCell>
                <TableCell className="w-16">Start Date</TableCell>
                <TableCell className="w-16">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 bg-muted rounded">
                        {/* Project icon placeholder */}
                      </div>
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">{project.code}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{project.type}</TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>${project.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="w-24 bg-muted rounded">
                      <div
                        className="h-2 bg-green-600 rounded"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground block mt-1">
                      {project.progress}%
                    </span>
                  </TableCell>
                  <TableCell>{project.city}</TableCell>
                  <TableCell>
                    {new Date(project.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex justify-end items-center gap-2">
                    <Button variant="ghost" size="xs">
                      View
                    </Button>
                    <Button variant="ghost" size="xs">
                      Edit
                    </Button>
                    <Button variant="destructive" ghost size="xs">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Table>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {mockProjects.length} projects
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
```

- [ ] **Step 5: Verify file saves correctly and basic structure is in place**

Run: `ls -la app/projects/page.tsx`
Expected: File exists with correct content

- [ ] **Step 6: Commit initial file creation**

```bash
git add app/projects/page.tsx
git commit -m "feat: create projects page with static listing"
```

### Task 2: Validate TypeScript Compliance

**Files:**
- Modify: `app/projects/page.tsx` (if needed)
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Run TypeScript compilation to check for errors**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 2: If errors found, fix them and retest**

If errors exist:
1. Identify TypeScript errors in the output
2. Fix the errors in `app/projects/page.tsx`
3. Re-run `npx tsc --noEmit` to verify fixes

- [ ] **Step 3: Commit any fixes made for TypeScript compliance**

```bash
git add app/projects/page.tsx
git commit -m "fix: resolve typescript errors in projects page"
```

### Task 3: Verify UI Component Usage and Styling

**Files:**
- Modify: `app/projects/page.tsx` (if needed)

- [ ] **Step 1: Check that all UI components are imported correctly**

Verify imports from `@/components/ui/` match available components:
- Card components exist in `@/components/ui/card`
- Table components exist in `@/components/ui/table`
- Button component exists in `@/components/ui/button`

- [ ] **Step 2: Validate class names follow Tailwind CSS conventions**

Check that:
- Spacing utilities (m-, p-, space-, gap-) are used appropriately
- Typography classes (text-, font-) follow existing patterns
- Color variants (bg-, text-) use semantic naming
- Interactive states (hover-, focus-) are implemented where appropriate

- [ ] **Step 3: Ensure responsive design considerations are present**

Verify the layout will work on different screen sizes by checking:
- Container widths use appropriate max-width or flex utilities
- Text sizes scale reasonably
- Button sizes are appropriate for touch targets

- [ ] **Step 4: Commit any styling or component usage improvements**

```bash
git add app/projects/page.tsx
git commit -m "style: improve projects page ui consistency"
```

### Task 4: Final Verification and Preparation for Next Features

**Files:**
- Test: Browser verification
- Read: Related files for pattern consistency

- [ ] **Step 1: Verify the page follows existing codebase patterns**

Check similar files for comparison:
- `app/page.tsx` (existing dashboard) for header and layout patterns
- Other pages in `app/` for consistent structure
- Component usage in `components/` directories

- [ ] **Step 2: Confirm mock data matches expected project structure**

Verify the Project type and mock data align with:
- Database schema in `prisma/schema.prisma` (if available)
- Existing mock data patterns in codebase
- Expected fields for construction projects

- [ ] **Step 3: Ensure file is ready for future enhancement with real data**

Confirm the structure allows easy replacement of:
- Mock data with hook-based data fetching
- Static actions with real CRUD operations
- Placeholders with actual functionality

- [ ] **Step 4: Final commit marking completion of listing feature**

```bash
git add app/projects/page.tsx
git commit -m "feat: complete projects page listing feature"
```

<system-reminder>
Whenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.
</system-reminder>