'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Clock, CheckCircle2, MessageSquare } from 'lucide-react';

interface RFI {
  id: string;
  number: string;
  title: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  dueDate?: string;
  createdAt: string;
  createdBy?: { name: string };
  assignedTo?: { name: string };
  answerCount?: number;
}

interface RFITimelineProps {
  rfis: RFI[];
  onRFIClick?: (rfi: RFI) => void;
}

const statusColors = {
  OPEN: 'warning' as const,
  ANSWERED: 'info' as const,
  CLOSED: 'success' as const,
};

export function RFITimeline({ rfis, onRFIClick }: RFITimelineProps) {
  const sortedRFIs = [...rfis].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">RFI Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {sortedRFIs.map((rfi, index) => (
              <div
                key={rfi.id}
                className="relative pl-10 cursor-pointer group"
                onClick={() => onRFIClick?.(rfi)}
              >
                <div
                  className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                    rfi.status === 'OPEN'
                      ? 'bg-yellow-400 border-yellow-500'
                      : rfi.status === 'ANSWERED'
                      ? 'bg-blue-400 border-blue-500'
                      : 'bg-green-400 border-green-500'
                  }`}
                />
                <div className="group-hover:bg-muted/50 -ml-2 pl-2 pr-3 py-3 rounded-lg transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{rfi.number}</span>
                        <Badge variant={statusColors[rfi.status]}>{rfi.status}</Badge>
                      </div>
                      <p className="font-medium mt-1 group-hover:text-primary transition-colors">{rfi.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {rfi.createdBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {rfi.createdBy.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(rfi.createdAt).toLocaleDateString()}
                    </span>
                    {rfi.dueDate && (
                      <span className="flex items-center gap-1">
                        Due: {new Date(rfi.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {rfi.answerCount !== undefined && rfi.answerCount > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {rfi.answerCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sortedRFIs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No RFIs found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
