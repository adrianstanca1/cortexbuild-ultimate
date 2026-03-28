'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { RFITimeline } from '@/components/dashboard/RFITimeline';
import { AIAvatar } from '@/components/dashboard/AIAvatar';
import { SafetyStats } from '@/components/dashboard/SafetyStats';
import { 
  FolderKanban, 
  CheckSquare, 
  FileQuestion, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  ArrowRight
} from 'lucide-react';

const mockProjects = [
  {
    id: '1',
    name: 'Downtown Office Tower',
    description: '25-story commercial building with underground parking',
    status: 'IN_PROGRESS' as const,
    location: '123 Main St',
    progress: 65,
    budget: 15000000,
    teamSize: 45,
    taskCount: { total: 24, completed: 16 },
  },
  {
    id: '2',
    name: 'Highway 101 Expansion',
    description: 'Highway widening and bridge construction',
    status: 'IN_PROGRESS' as const,
    location: 'Highway 101',
    progress: 42,
    budget: 25000000,
    teamSize: 78,
    taskCount: { total: 56, completed: 24 },
  },
  {
    id: '3',
    name: 'Medical Center Renovation',
    description: 'Complete interior renovation of existing facility',
    status: 'PLANNING' as const,
    location: '456 Health Ave',
    progress: 15,
    budget: 8500000,
    teamSize: 23,
    taskCount: { total: 12, completed: 2 },
  },
];

const mockTasks = [
  { id: '1', title: 'Review structural drawings', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, dueDate: '2026-03-20', assignee: { name: 'John Smith' } },
  { id: '2', title: 'Submit RFI for foundation', status: 'TODO' as const, priority: 'CRITICAL' as const, dueDate: '2026-03-21', assignee: { name: 'Sarah Connor' } },
  { id: '3', title: 'Complete concrete pour', status: 'REVIEW' as const, priority: 'HIGH' as const, dueDate: '2026-03-19', assignee: { name: 'Mike Ross' } },
  { id: '4', title: 'Safety inspection', status: 'TODO' as const, priority: 'MEDIUM' as const, dueDate: '2026-03-22', assignee: { name: 'Emily Chen' } },
  { id: '5', title: 'Install rebar', status: 'IN_PROGRESS' as const, priority: 'HIGH' as const, dueDate: '2026-03-18', assignee: { name: 'Tom Wilson' } },
];

const mockRFIs = [
  { id: '1', number: 'RFI-001', title: 'Foundation detail clarification', status: 'OPEN' as const, createdAt: '2026-03-15', dueDate: '2026-03-20', createdBy: { name: 'John Smith' }, answerCount: 2 },
  { id: '2', number: 'RFI-002', title: 'Steel connection specification', status: 'ANSWERED' as const, createdAt: '2026-03-10', createdBy: { name: 'Sarah Connor' }, answerCount: 5 },
  { id: '3', number: 'RFI-003', title: 'HVAC routing coordination', status: 'CLOSED' as const, createdAt: '2026-03-05', createdBy: { name: 'Mike Ross' }, answerCount: 8 },
];

const mockSafetyStats = {
  totalIncidents: 3,
  openIncidents: 1,
  resolvedIncidents: 2,
  daysSinceLastIncident: 28,
  safetyScore: 94,
  toolboxTalksCompleted: 18,
  toolboxTalksTotal: 20,
  toolChecksPassed: 145,
  toolChecksTotal: 150,
  activeWorkers: 156,
  incidentsBySeverity: { LOW: 1, MEDIUM: 1, HIGH: 1, CRITICAL: 0 },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Construction Management Overview</p>
        </div>
        <Button>Generate Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +2 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +5 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RFIs Pending</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3" /> -3 resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Safety Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +1% improvement
            </p>
          </CardContent>
        </Card>
      </div>

      <SafetyStats stats={mockSafetyStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <TaskList tasks={mockTasks} onViewAll={() => {}} />
          <RFITimeline rfis={mockRFIs} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIAvatar />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FolderKanban className="h-4 w-4 mr-2" /> New Project
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CheckSquare className="h-4 w-4 mr-2" /> Create Task
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileQuestion className="h-4 w-4 mr-2" /> Submit RFI
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="h-4 w-4 mr-2" /> Safety Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" /> Daily Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
