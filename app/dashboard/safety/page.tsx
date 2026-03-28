'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SafetyStats } from '@/components/dashboard/SafetyStats';
import { SafetyIncidentForm } from '@/components/forms/SafetyIncidentForm';
import { useSafetyIncidents, useCreateSafetyIncident, useDeleteSafetyIncident, SafetyIncident } from '@/lib/hooks/useSafetyIncidents';
import { Shield, FileText, Flame, Wrench, Scroll, Users, Calendar, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const severityColors = {
  LOW: 'success' as const,
  MEDIUM: 'warning' as const,
  HIGH: 'destructive' as const,
  CRITICAL: 'destructive' as const,
};

const statusColors = {
  REPORTED: 'warning' as const,
  OPEN: 'warning' as const,
  INVESTIGATING: 'info' as const,
  RESOLVED: 'success' as const,
  CLOSED: 'secondary' as const,
};

export default function SafetyPage() {
  const [showIncidentModal, setShowIncidentModal] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const { data, isLoading } = useSafetyIncidents({ pageSize: 100 });
  const createIncident = useCreateSafetyIncident();
  const deleteIncident = useDeleteSafetyIncident();

  const incidents = data?.incidents ?? [];

  const stats = React.useMemo(() => {
    if (!incidents.length) return null;
    return {
      totalIncidents: incidents.length,
      openIncidents: incidents.filter(i => i.status === 'REPORTED').length,
      resolvedIncidents: incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
    };
  }, [incidents]);

  const handleCreateIncident = async (formData: Partial<SafetyIncident>) => {
    await createIncident.mutateAsync({
      ...formData,
      status: 'REPORTED',
      projectId: '1',
      incidentDate: new Date().toISOString(),
    } as Partial<SafetyIncident>);
    setShowIncidentModal(false);
  };

  const handleDeleteIncident = async (id: string) => {
    await deleteIncident.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Safety Center</h1>
        <p className="text-muted-foreground">UK Compliance: RAMS, MEWP, Tool Checks, Hot Work Permits</p>
      </div>

      {stats && <SafetyStats stats={{
        ...stats,
        daysSinceLastIncident: 28,
        safetyScore: 94,
        toolboxTalksCompleted: 18,
        toolboxTalksTotal: 20,
        toolChecksPassed: 145,
        toolChecksTotal: 150,
        activeWorkers: 156,
        incidentsBySeverity: {
          LOW: incidents.filter(i => i.severity === 'LOW').length,
          MEDIUM: incidents.filter(i => i.severity === 'MEDIUM').length,
          HIGH: incidents.filter(i => i.severity === 'HIGH').length,
          CRITICAL: incidents.filter(i => i.severity === 'CRITICAL').length,
        },
      }} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Incidents</CardTitle>
            <Button size="sm" onClick={() => setShowIncidentModal(true)}>+ Report Incident</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No incidents reported</div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        incident.status === 'RESOLVED' || incident.status === 'CLOSED' ? 'bg-green-500' :
                        incident.status === 'INVESTIGATING' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <div className="font-medium text-foreground">{incident.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {incident.incidentDate ? new Date(incident.incidentDate).toLocaleDateString() : 'No date'}
                          {incident.location && ` • ${incident.location}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColors[incident.severity] ?? 'secondary'}>{incident.severity}</Badge>
                      <Badge variant={statusColors[incident.status] ?? 'secondary'}>{incident.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(incident.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>MEWP Daily Checks</CardTitle>
            <Button variant="outline" size="sm">+ New Check</Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">No checks recorded today</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Toolbox Talks</CardTitle>
            <Button variant="outline" size="sm">+ Schedule Talk</Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">No toolbox talks scheduled</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <div className="font-medium">RAMS</div>
            <div className="text-sm text-muted-foreground">Risk Assessments</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Flame className="h-8 w-8 text-orange-500 mb-2" />
            <div className="font-medium">Hot Work</div>
            <div className="text-sm text-muted-foreground">Permits</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Wrench className="h-8 w-8 text-blue-500 mb-2" />
            <div className="font-medium">Tool Checks</div>
            <div className="text-sm text-muted-foreground">PAT Testing</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Scroll className="h-8 w-8 text-purple-500 mb-2" />
            <div className="font-medium">Confined Space</div>
            <div className="text-sm text-muted-foreground">Permits</div>
          </CardContent>
        </Card>
      </div>

      {showIncidentModal && (
        <SafetyIncidentForm
          projectId="1"
          onSubmit={handleCreateIncident}
          onClose={() => setShowIncidentModal(false)}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Are you sure you want to delete this incident? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteIncident(deleteConfirmId)}
                  disabled={deleteIncident.isPending}
                >
                  {deleteIncident.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}