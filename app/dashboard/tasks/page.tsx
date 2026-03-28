'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { TaskForm } from '@/components/forms/TaskForm';
import { useTasks, useCreateTask, useDeleteTask, type Task } from '@/lib/hooks/useTasks';
import { useProjects } from '@/lib/hooks/useProjects';
import { Search, Filter, MoreVertical, Calendar, User, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

const statusConfig = {
  TODO: { label: 'To Do', variant: 'secondary' as const },
  IN_PROGRESS: { label: 'In Progress', variant: 'info' as const },
  REVIEW: { label: 'Review', variant: 'warning' as const },
  COMPLETE: { label: 'Complete', variant: 'success' as const },
  BLOCKED: { label: 'Blocked', variant: 'destructive' as const },
};

const priorityConfig = {
  LOW: { label: 'Low' },
  MEDIUM: { label: 'Medium' },
  HIGH: { label: 'High' },
  CRITICAL: { label: 'Critical' },
};

export default function TasksPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');
  const [deleteTaskId, setDeleteTaskId] = React.useState<string | null>(null);

  const { data, isLoading } = useTasks();
  const { data: projectsData } = useProjects();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  const tasks: Task[] = data?.tasks || [];
  const projects = projectsData?.projects || [];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesProject = !selectedProject || task.projectId === selectedProject;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const handleCreateTask = (formData: Partial<Task>) => {
    createTask.mutate(formData, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask.mutate(id, {
      onSuccess: () => setDeleteTaskId(null),
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">Manage tasks across all projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter} className="w-36">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="COMPLETE">Complete</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter} className="w-36">
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </Select>
              <Select value={selectedProject} onValueChange={setSelectedProject} className="w-40">
                <SelectItem value="">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Due</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{task.title}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{task.project?.name || '-'}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusConfig[task.status as keyof typeof statusConfig]?.variant || 'secondary'}>
                          {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {task.assignee?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTaskId(task.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No tasks found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <TaskForm
          projects={projects}
          onSubmit={handleCreateTask}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {deleteTaskId && (
        <Modal open onOpenChange={() => setDeleteTaskId(null)} title="Delete Task">
          <div className="space-y-4">
            <p className="text-muted-foreground">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setDeleteTaskId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteTask(deleteTaskId)}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
