'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const dailyReportSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weather: z.string().optional(),
  temperature: z.string().optional(),
  workforceCount: z.coerce.number().int().positive().optional(),
  workPerformed: z.string().min(1, 'Work performed is required'),
  notes: z.string().optional(),
});

type DailyReportFormData = z.infer<typeof dailyReportSchema>;

interface DailyReportFormProps {
  report?: Partial<DailyReportFormData>;
  projectId: string;
  onSubmit: (data: DailyReportFormData) => void;
  onClose: () => void;
}

export function DailyReportForm({ report, projectId, onSubmit, onClose }: DailyReportFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DailyReportFormData>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: report,
  });

  return (
    <Modal open onOpenChange={onClose} title={report?.date ? 'Edit Daily Report' : 'Submit Daily Report'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date</label>
            <Input {...register('date')} type="date" />
            {errors.date && <p className="text-sm text-destructive mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Weather</label>
            <Select {...register('weather')}>
              <option value="">Select...</option>
              <option value="SUNNY">Sunny</option>
              <option value="CLOUDY">Cloudy</option>
              <option value="RAINY">Rainy</option>
              <option value="WINDY">Windy</option>
              <option value="STORMY">Stormy</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Temperature</label>
            <Input {...register('temperature')} placeholder="e.g., 72°F" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Workforce Count</label>
          <Input {...register('workforceCount', { valueAsNumber: true })} type="number" placeholder="0" />
          {errors.workforceCount && <p className="text-sm text-destructive mt-1">{errors.workforceCount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Work Performed</label>
          <textarea
            {...register('workPerformed')}
            placeholder="Describe work completed today"
            className="w-full h-32 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.workPerformed && <p className="text-sm text-destructive mt-1">{errors.workPerformed.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Additional Notes</label>
          <textarea
            {...register('notes')}
            placeholder="Any additional notes or observations"
            className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : report?.date ? 'Update' : 'Submit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
