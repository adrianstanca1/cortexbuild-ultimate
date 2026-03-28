'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const rfiSchema = z.object({
  number: z.string().min(1, 'RFI number is required'),
  title: z.string().min(1, 'Title is required'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().optional(),
  status: z.enum(['OPEN', 'ANSWERED', 'CLOSED', 'OVERDUE']),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

type RFIFormData = z.infer<typeof rfiSchema>;

interface RFIFormProps {
  rfi?: Partial<RFIFormData>;
  projectId: string;
  users?: Array<{ id: string; name: string }>;
  onSubmit: (data: RFIFormData) => void;
  onClose: () => void;
}

export function RFIForm({ rfi, projectId, users = [], onSubmit, onClose }: RFIFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RFIFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: rfi,
  });

  return (
    <Modal open onOpenChange={onClose} title={rfi?.number ? 'Edit RFI' : 'Create RFI'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">RFI Number</label>
            <Input {...register('number')} placeholder="RFI-001" />
            {errors.number && <p className="text-sm text-destructive mt-1">{errors.number.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <Select {...register('status')}>
              <option value="OPEN">Open</option>
              <option value="ANSWERED">Answered</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Title</label>
          <Input {...register('title')} placeholder="Enter RFI title" />
          {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Question</label>
          <textarea
            {...register('question')}
            placeholder="Enter your question"
            className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.question && <p className="text-sm text-destructive mt-1">{errors.question.message}</p>}
        </div>

        {rfi?.status !== 'OPEN' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Answer</label>
            <textarea
              {...register('answer')}
              placeholder="Enter the answer"
              className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
            <Input {...register('dueDate')} type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Assigned To</label>
            <Select {...register('assignedToId')}>
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : rfi?.number ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
