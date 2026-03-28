'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, User, ChevronRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate?: string;
  assignee?: { name: string; avatarUrl?: string };
}

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onViewAll?: () => void;
}

const statusColors = {
  TODO: 'secondary' as const,
  IN_PROGRESS: 'info' as const,
  REVIEW: 'warning' as const,
  COMPLETE: 'success' as const,
  BLOCKED: 'destructive' as const,
};

const priorityColors = {
  LOW: 'secondary' as const,
  MEDIUM: 'info' as const,
  HIGH: 'warning' as const,
  CRITICAL: 'destructive' as const,
};

export function TaskList({ tasks, onTaskClick, onViewAll }: TaskListProps) {
  const groupedTasks = React.useMemo(() => {
    const groups: Record<Task['status'], Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      COMPLETE: [],
      BLOCKED: [],
    };
    tasks.forEach((task) => groups[task.status].push(task));
    return groups;
  }, [tasks]);

  const statusOrder: Task['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE', 'BLOCKED'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tasks</CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusOrder.map((status) => {
            const statusTasks = groupedTasks[status];
            if (statusTasks.length === 0) return null;
            return (
              <div key={status}>
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  {status.replace('_', ' ')}
                  <Badge variant="secondary" className="text-xs">{statusTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {statusTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-background rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
                        <Badge variant={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tasks found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
