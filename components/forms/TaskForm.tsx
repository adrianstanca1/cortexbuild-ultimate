'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETE', 'BLOCKED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Partial<TaskFormData>;
  projectId?: string;
  projects?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; name: string }>;
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
}

export function TaskForm({ task, projectId, projects = [], users = [], onSubmit, onClose }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...task,
      projectId: task?.projectId || projectId || '',
    },
  });

  return (
    <Modal open onOpenChange={onClose} title={task?.title ? 'Edit Task' : 'Create Task'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-foreground mb-1">Title</label>
          <Input id="task-title" {...register('title')} placeholder="Enter task title" />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            id="task-description"
            {...register('description')}
            placeholder="Enter description"
            className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label htmlFor="task-project" className="block text-sm font-medium text-foreground mb-1">Project</label>
          <Select id="task-project" {...register('projectId')}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </Select>
          {errors.projectId && <p className="text-sm text-destructive mt-1">{errors.projectId.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-status" className="block text-sm font-medium text-foreground mb-1">Status</label>
            <Select id="task-status" {...register('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETE">Complete</option>
              <option value="BLOCKED">Blocked</option>
            </Select>
          </div>
          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium text-foreground mb-1">Priority</label>
            <Select id="task-priority" {...register('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="task-dueDate" className="block text-sm font-medium text-foreground mb-1">Due Date</label>
          <Input id="task-dueDate" {...register('dueDate')} type="date" />
        </div>

        <div>
          <label htmlFor="task-assignee" className="block text-sm font-medium text-foreground mb-1">Assignee</label>
          <Select id="task-assignee" {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : task?.title ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
