'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { formatCurrency } from '@/lib/utils';
import { Calendar, MapPin, Users, DollarSign, MoreVertical } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string;
    status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
    location?: string;
    clientName?: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
    progress?: number;
    teamSize?: number;
    taskCount?: { total: number; completed: number };
  };
  onClick?: () => void;
  onEdit?: () => void;
}

const statusColors = {
  PLANNING: 'secondary' as const,
  IN_PROGRESS: 'info' as const,
  ON_HOLD: 'warning' as const,
  COMPLETED: 'success' as const,
  ARCHIVED: 'secondary' as const,
};

const statusLabels = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export function ProjectCard({ project, onClick, onEdit }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            {project.description && (
              <CardDescription className="line-clamp-2">{project.description}</CardDescription>
            )}
          </div>
          <Badge variant={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {project.location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>{formatCurrency(project.budget)}</span>
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {project.teamSize !== undefined && (
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              <span>{project.teamSize} team members</span>
            </div>
          )}
        </div>

        {project.taskCount && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-medium">
                {project.taskCount.completed}/{project.taskCount.total} completed
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
