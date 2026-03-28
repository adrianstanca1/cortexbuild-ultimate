'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { AlertTriangle, TrendingUp, Shield, Clock, Activity, Users } from 'lucide-react';

interface SafetyStatsProps {
  stats: {
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    daysSinceLastIncident: number;
    safetyScore: number;
    toolboxTalksCompleted: number;
    toolboxTalksTotal: number;
    toolChecksPassed: number;
    toolChecksTotal: number;
    activeWorkers: number;
    incidentsBySeverity?: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
  };
}

const severityColors = {
  LOW: 'success' as const,
  MEDIUM: 'warning' as const,
  HIGH: 'destructive' as const,
  CRITICAL: 'destructive' as const,
};

export function SafetyStats({ stats }: SafetyStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.safetyScore}%</div>
          <Progress value={stats.safetyScore} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.safetyScore >= 90 ? 'Excellent' : stats.safetyScore >= 75 ? 'Good' : 'Needs Improvement'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Days Without Incident</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.daysSinceLastIncident}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.daysSinceLastIncident > 30 ? 'Great safety record!' : 'Keep up the good work'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.openIncidents}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success">{stats.resolvedIncidents} resolved</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            of {stats.totalIncidents} total incidents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeWorkers}</div>
          <p className="text-xs text-muted-foreground mt-2">On site today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Toolbox Talks</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.toolboxTalksCompleted}/{stats.toolboxTalksTotal}
          </div>
          <Progress
            value={(stats.toolboxTalksCompleted / stats.toolboxTalksTotal) * 100}
            className="h-2 mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tool Checks</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.toolChecksPassed}/{stats.toolChecksTotal}
          </div>
          <Progress
            value={(stats.toolChecksPassed / stats.toolChecksTotal) * 100}
            className="h-2 mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {((stats.toolChecksPassed / stats.toolChecksTotal) * 100).toFixed(0)}% pass rate
          </p>
        </CardContent>
      </Card>

      {stats.incidentsBySeverity && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Incidents by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {Object.entries(stats.incidentsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center gap-2">
                  <Badge variant={severityColors[severity as keyof typeof severityColors]}>
                    {severity}
                  </Badge>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
