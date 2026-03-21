'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

// Status badge using existing Badge component
const getStatusVariant = (status: Project['status']) => {
  switch (status) {
    case 'PLANNING': return 'info';
    case 'ACTIVE': return 'success';
    case 'ON_HOLD': return 'warning';
    case 'COMPLETED': return 'default'; // Using default variant for completed
    case 'CANCELLED': return 'destructive';
    default: return 'secondary';
  }
};

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
                    <Badge variant={getStatusVariant(project.status)} className="px-2 py-1 text-xs rounded-full font-medium">
                      {project.status}
                    </Badge>
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
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
