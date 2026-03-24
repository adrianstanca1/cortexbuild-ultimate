'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, Filter, MoreVertical, Building2, Users, DollarSign, TrendingUp } from 'lucide-react'

interface Project {
  id: string
  name: string
  code: string
  type: string
  status: string
  budget: number
  progress: number
  city: string
  startDate?: string
}

interface ProjectsListProps {
  projects: Project[]
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.code.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || p.status.toLowerCase() === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
  }

  const statusColors = {
    ACTIVE: 'bg-green-500/20 text-green-700',
    PLANNING: 'bg-blue-500/20 text-blue-700',
    ON_HOLD: 'bg-yellow-500/20 text-yellow-700',
    COMPLETED: 'bg-gray-500/20 text-gray-700',
    CANCELLED: 'bg-red-500/20 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage construction projects</p>
        </div>
        <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <ProjectForm onClose={() => setNewProjectOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planning</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalBudget / 1000000).toFixed(1)}M
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="planning">Planning</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <TableCell className="font-mono text-sm">{project.code}</TableCell>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.type}</TableCell>
                <TableCell>{project.city}</TableCell>
                <TableCell>
                  <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono">
                  ${(project.budget / 1000).toFixed(0)}K
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function ProjectForm({ onClose }: { onClose: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Create project API call
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Project Name</label>
        <Input required placeholder="e.g., Downtown Office Tower" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Project Code</label>
        <Input required placeholder="e.g., DOT-2024" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Type</label>
        <select className="rounded-md border bg-background px-3 py-2">
          <option>Commercial</option>
          <option>Residential</option>
          <option>Industrial</option>
          <option>Infrastructure</option>
        </select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Budget</label>
        <Input type="number" required placeholder="0" />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">Create Project</Button>
      </div>
    </form>
  )
}
