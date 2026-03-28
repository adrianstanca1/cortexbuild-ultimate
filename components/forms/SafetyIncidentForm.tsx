'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const safetyIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED']),
  assignedToId: z.string().optional(),
});

type SafetyIncidentFormData = z.infer<typeof safetyIncidentSchema>;

interface SafetyIncidentFormProps {
  incident?: Partial<SafetyIncidentFormData>;
  projectId: string;
  users?: Array<{ id: string; name: string }>;
  onSubmit: (data: SafetyIncidentFormData) => void;
  onClose: () => void;
}

export function SafetyIncidentForm({ incident, projectId, users = [], onSubmit, onClose }: SafetyIncidentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SafetyIncidentFormData>({
    resolver: zodResolver(safetyIncidentSchema),
    defaultValues: incident,
  });

  return (
    <Modal open onOpenChange={onClose} title="Report Safety Incident">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="incident-title" className="block text-sm font-medium text-foreground mb-1">Incident Title</label>
          <Input id="incident-title" {...register('title')} placeholder="Brief description of incident" />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="incident-description" className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            id="incident-description"
            {...register('description')}
            placeholder="Detailed description of what happened"
            className="w-full h-32 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="incident-severity" className="block text-sm font-medium text-foreground mb-1">Severity</label>
            <Select id="incident-severity" {...register('severity')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
          <div>
            <label htmlFor="incident-status" className="block text-sm font-medium text-foreground mb-1">Status</label>
            <Select id="incident-status" {...register('status')}>
              <option value="REPORTED">Reported</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="incident-assignedToId" className="block text-sm font-medium text-foreground mb-1">Assigned To</label>
          <Select id="incident-assignedToId" {...register('assignedToId')}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? 'Reporting...' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
