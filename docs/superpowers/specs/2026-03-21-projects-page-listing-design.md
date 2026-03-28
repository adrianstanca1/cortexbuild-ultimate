# Projects Page Listing Design

**Date**: 2026-03-21
**Feature**: Projects Page - Listing View
**Approach**: Simple Static Component (Approach 1)

## Overview

This document describes the design for a new Projects page listing feature in the CortexBuild Ultimate platform. The page will display a table of projects with key information and action buttons.

## Requirements

- Create a new Projects page from scratch
- Focus on Project Listing feature (view list of projects)
- Use existing UI components from `components/ui/`
- Follow existing code patterns and conventions

## Design Details

### File Location
`app/projects/page.tsx`

### Component Architecture

The Projects page consists of:
1. Header with page title and action buttons
2. Card container for the projects table
3. Table displaying project data with actions
4. Footer with project count and pagination controls

### Technical Implementation

#### Dependencies
- Next.js App Router (`'use client'` directive)
- UI components from `@/components/ui/`:
  - Card, CardHeader, CardTitle, CardContent, CardFooter
  - Table, TableHeader, TableBody, TableRow, TableCell, TableHead
  - Button (various variants: default, outline, ghost, destructive)

#### Data Structure
```typescript
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
```

#### Mock Data
Similar to the existing Dashboard implementation, the page will use mock data for initial implementation:
```typescript
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
  // Additional projects follow same structure
]
```

#### UI Components

**StatusBadge**: Custom component for displaying project status with color coding:
- PLANNING: Blue background
- ACTIVE: Green background
- ON_HOLD: Yellow background
- COMPLETED: Purple background
- CANCELLED: Red background

**Table Columns**:
1. Project (name + code)
2. Type
3. Status (with badge)
4. Budget (formatted currency)
5. Progress (visual progress bar + percentage)
6. Location (city)
7. Start Date (formatted)
8. Actions (View, Edit, Delete buttons)

#### Styling & Layout
- Responsive design using Tailwind CSS utilities
- Hover states on table rows
- Proper spacing and typography following existing patterns
- Visual hierarchy with clear section separation

### Implementation Notes

#### Compliance
- TypeScript strict mode compliant
- Follows existing codebase conventions from AGENTS.md
- Uses same UI component patterns as other pages

#### Extensibility
Designed to be easily refactored to:
- Replace mock data with real data fetching hooks
- Add filtering, search, and sorting capabilities
- Implement actual CRUD operations for edit/delete
- Add pagination when dataset grows

### Approval
This design was reviewed and approved through the brainstorming process following the superpowers:brainstorming skill guidelines.

### Next Steps
Upon approval of this design document:
1. Create the file `app/projects/page.tsx`
2. Implement the component as specified
3. Run TypeScript compilation to verify compliance
4. Prepare for implementation planning phase