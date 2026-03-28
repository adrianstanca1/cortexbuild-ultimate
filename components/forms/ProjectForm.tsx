'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  location: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onClose: () => void;
}

export function ProjectForm({ project, onSubmit, onClose }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project,
  });

  return (
    <Modal open onOpenChange={onClose} title={project?.name ? 'Edit Project' : 'Create Project'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Project Name</label>
          <Input {...register('name')} placeholder="Enter project name" />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            {...register('description')}
            placeholder="Enter description"
            className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <Select {...register('status')}>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <Input {...register('location')} placeholder="Enter location" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Client Name</label>
            <Input {...register('clientName')} placeholder="Client name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Client Email</label>
            <Input {...register('clientEmail')} type="email" placeholder="client@email.com" />
            {errors.clientEmail && <p className="text-sm text-destructive mt-1">{errors.clientEmail.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Budget ($)</label>
          <Input {...register('budget', { valueAsNumber: true })} type="number" placeholder="0.00" />
          {errors.budget && <p className="text-sm text-destructive mt-1">{errors.budget.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
            <Input {...register('startDate')} type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
            <Input {...register('endDate')} type="date" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : project?.name ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
