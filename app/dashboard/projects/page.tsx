'use client';

import * as React from 'react';
import { useProjects, useCreateProject, useDeleteProject } from '@/lib/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search, MapPin, DollarSign, MoreVertical, Trash2 } from 'lucide-react';

const statusColors = {
  PLANNING: 'info' as const,
  IN_PROGRESS: 'success' as const,
  ON_HOLD: 'warning' as const,
  COMPLETED: 'secondary' as const,
  ARCHIVED: 'secondary' as const,
};

const statusLabels = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const { data, isLoading, error } = useProjects({ search: searchQuery, status: statusFilter });
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const projects = data?.projects ?? [];

  const handleCreateProject = async (formData: any) => {
    try {
      await createProject.mutateAsync(formData);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your construction projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-projects"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full sm:w-48"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">Failed to load projects</div>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tasks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Open RFIs</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{project.name}</div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={statusColors[project.status as keyof typeof statusColors] ?? 'secondary'}>
                          {statusLabels[project.status as keyof typeof statusLabels] ?? project.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {project.startDate ?? '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {project.budget != null ? formatCurrency(project.budget) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">-</td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary">0</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(project.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {projects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No projects found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Project</h3>
            <p className="text-muted-foreground mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteProject(deleteConfirmId)}
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
