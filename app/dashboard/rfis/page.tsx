'use client';

import * as React from 'react';
import { useRFIs, useCreateRFI, useDeleteRFI, RFI } from '@/lib/hooks/useRFIs';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { Modal, ModalHeader, ModalFooter } from '@/components/ui/Modal';
import { RFIForm } from '@/components/forms/RFIForm';
import { Search, FileQuestion, MoreVertical, User, Calendar, Trash2 } from 'lucide-react';

const statusConfig = {
  OPEN: { label: 'Open', variant: 'info' as const },
  ANSWERED: { label: 'Answered', variant: 'success' as const },
  OVERDUE: { label: 'Overdue', variant: 'destructive' as const },
  CLOSED: { label: 'Closed', variant: 'secondary' as const },
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';

export default function RFIsPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingRFI, setEditingRFI] = React.useState<RFI | null>(null);
  const [deletingRFI, setDeletingRFI] = React.useState<RFI | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [selectedProject, setSelectedProject] = React.useState('');

  const { data, isLoading, error } = useRFIs({
    search: searchQuery,
    status: statusFilter,
    projectId: selectedProject || undefined,
  });

  const createMutation = useCreateRFI();
  const deleteMutation = useDeleteRFI();

  const rfis = data?.rfis ?? [];
  const stats = {
    open: rfis.filter((r) => r.status === 'OPEN').length,
    answered: rfis.filter((r) => r.status === 'ANSWERED').length,
    overdue: rfis.filter((r) => r.status === 'OVERDUE').length,
    total: rfis.length,
  };

  const uniqueProjects = [...new Set(rfis.map((r) => r.project?.name).filter(Boolean))] as string[];

  const handleCreate = async (formData: Partial<RFI>) => {
    await createMutation.mutateAsync({ ...formData, projectId: '1' });
    setShowCreateModal(false);
  };

  const handleUpdate = async (formData: Partial<RFI>) => {
    if (!editingRFI) return;
    await createMutation.mutateAsync({ ...formData, id: editingRFI.id });
    setEditingRFI(null);
  };

  const handleDelete = async () => {
    if (!deletingRFI) return;
    await deleteMutation.mutateAsync(deletingRFI.id);
    setDeletingRFI(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RFIs</h1>
          <p className="text-muted-foreground">Request for Information</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New RFI
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
            <div className="text-sm text-muted-foreground">Answered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-muted-foreground">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rfi-search"
                placeholder="Search RFIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select id="rfi-status-filter" value={statusFilter} onValueChange={setStatusFilter} className="w-36">
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ANSWERED">Answered</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </Select>
              <Select id="rfi-project-filter" value={selectedProject} onValueChange={setSelectedProject} className="w-40">
                <SelectItem value="">All Projects</SelectItem>
                {uniqueProjects.map((project) => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">Loading RFIs...</div>
          )}
          {error && (
            <div className="text-center py-12 text-destructive">Error loading RFIs</div>
          )}
          {!isLoading && !error && (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">RFI #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Due</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rfis.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No RFIs found. Create your first RFI to get started.
                      </td>
                    </tr>
                  )}
                  {rfis.map((rfi) => (
                    <tr key={rfi.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileQuestion className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-blue-600">{rfi.number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{rfi.title}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{rfi.project?.name}</td>
                      <td className="px-4 py-4">
                        <Badge variant={statusConfig[rfi.status]?.variant ?? 'info'}>
                          {statusConfig[rfi.status]?.label ?? rfi.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {rfi.createdBy?.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {rfi.dueDate ? new Date(rfi.dueDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingRFI(rfi)}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingRFI(rfi)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <RFIForm
          projectId="1"
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingRFI && (
        <RFIForm
          rfi={{
            number: editingRFI.number,
            title: editingRFI.title,
            question: editingRFI.question,
            answer: editingRFI.answer ?? undefined,
            status: editingRFI.status as 'OPEN' | 'ANSWERED' | 'CLOSED',
            dueDate: editingRFI.dueDate ?? undefined,
            assignedToId: editingRFI.assignedToId ?? undefined,
          }}
          projectId={editingRFI.projectId}
          onSubmit={handleUpdate}
          onClose={() => setEditingRFI(null)}
        />
      )}

      <Modal
        open={!!deletingRFI}
        onOpenChange={() => setDeletingRFI(null)}
        title="Delete RFI"
        description={`Are you sure you want to delete RFI ${deletingRFI?.number}? This action cannot be undone.`}
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeletingRFI(null)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
