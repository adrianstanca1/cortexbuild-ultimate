import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IncidentCategory = 
  | 'fall' 
  | 'struck_by' 
  | 'caught_in' 
  | 'electrical' 
  | 'chemical' 
  | 'vehicle' 
  | 'fire' 
  | 'other';

export interface SafetyMetrics {
  totalIncidents: number;
  openIncidents: number;
  closedIncidents: number;
  incidentsBySeverity: Record<SeverityLevel, number>;
  incidentsByCategory: Record<IncidentCategory, number>;
  averageResolutionDays: number;
  nearMisses: number;
  firstAidCases: number;
  lostTimeIncidents: number;
  recordableIncidents: number;
  trir: number;
  severityRate: number;
}

export interface SafetyTrend {
  date: string;
  incidents: number;
  nearMisses: number;
  injuries: number;
}

export async function getSafetyMetrics(projectId?: string): Promise<SafetyMetrics> {
  const whereClause = projectId ? { projectId } : {};

  const incidents = await prisma.safetyIncident.findMany({
    where: whereClause,
    include: { project: true },
  });

  const closedIncidents = incidents.filter((i: any) => i.status === 'CLOSED');
  const openIncidents = incidents.filter((i: any) => i.status !== 'CLOSED');

  const incidentsBySeverity: Record<SeverityLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const incidentsByCategory: Record<IncidentCategory, number> = {
    fall: 0,
    struck_by: 0,
    caught_in: 0,
    electrical: 0,
    chemical: 0,
    vehicle: 0,
    fire: 0,
    other: 0,
  };

  incidents.forEach((incident: any) => {
    const severity = incident.severity as SeverityLevel || 'low';
    const category = incident.incidentType as IncidentCategory || 'other';

    if (severity in incidentsBySeverity) {
      incidentsBySeverity[severity]++;
    }
    if (category in incidentsByCategory) {
      incidentsByCategory[category]++;
    }
  });

  let totalResolutionDays = 0;
  let resolvedCount = 0;

  closedIncidents.forEach((incident: any) => {
    if (incident.createdAt && incident.resolvedAt) {
      const reported = new Date(incident.createdAt);
      const resolved = new Date(incident.resolvedAt);
      totalResolutionDays += (resolved.getTime() - reported.getTime()) / (1000 * 60 * 60 * 24);
      resolvedCount++;
    }
  });

  const averageResolutionDays = resolvedCount > 0 ? totalResolutionDays / resolvedCount : 0;

  const nearMisses = 0;
  const firstAidCases = 0;
  const lostTimeIncidents = 0;
  const recordableIncidents = 0;

  const totalHoursWorked = await prisma.dailyReport.aggregate({
    where: whereClause,
    _sum: { workforceCount: true },
  });

  const hoursWorked = totalHoursWorked._sum.workforceCount || 0;
  const yearStart = startOfDay(subDays(new Date(), 365));
  const yearIncidents = await prisma.safetyIncident.count({
    where: {
      ...whereClause,
      createdAt: { gte: yearStart },
    },
  });

  const trir = hoursWorked > 0 ? (yearIncidents * 200000) / hoursWorked : 0;
  const severityRate = hoursWorked > 0 ? (recordableIncidents * 200000) / hoursWorked : 0;

  return {
    totalIncidents: incidents.length,
    openIncidents: openIncidents.length,
    closedIncidents: closedIncidents.length,
    incidentsBySeverity,
    incidentsByCategory,
    averageResolutionDays,
    nearMisses,
    firstAidCases,
    lostTimeIncidents,
    recordableIncidents,
    trir,
    severityRate,
  };
}

export async function getSafetyTrends(
  projectId?: string,
  days: number = 90
): Promise<SafetyTrend[]> {
  const whereClause = projectId ? { projectId } : {};
  const startDate = startOfDay(subDays(new Date(), days));

  const incidents = await prisma.safetyIncident.findMany({
    where: {
      ...whereClause,
      createdAt: { gte: startDate },
    },
    select: { createdAt: true, severity: true, status: true },
  });

  const dailyStats: Record<string, SafetyTrend> = {};

  for (let i = 0; i <= days; i++) {
    const date = format(subDays(new Date(), days - i), 'yyyy-MM-dd');
    dailyStats[date] = { date, incidents: 0, nearMisses: 0, injuries: 0 };
  }

  incidents.forEach((incident: any) => {
    const date = format(new Date(incident.createdAt), 'yyyy-MM-dd');
    if (dailyStats[date]) {
      dailyStats[date].incidents++;
      if (incident.status === 'CLOSED') {
        dailyStats[date].nearMisses++;
      }
      if (incident.status === 'RESOLVED') {
        dailyStats[date].injuries++;
      }
    }
  });

  return Object.values(dailyStats);
}

export async function getTopSafetyConcerns(
  projectId?: string,
  limit: number = 5
): Promise<{ concern: string; count: number; severity: SeverityLevel }[]> {
  const whereClause = projectId ? { projectId } : {};

  const incidents = await prisma.safetyIncident.findMany({
    where: whereClause,
    select: { severity: true, status: true },
  });

  const concernCounts: Record<string, { count: number; severity: SeverityLevel }> = {};

  incidents.forEach((incident: any) => {
    const type = incident.incidentType || 'other';
    if (!concernCounts[type]) {
      concernCounts[type] = { count: 0, severity: incident.severity as SeverityLevel || 'low' };
    }
    concernCounts[type].count++;

    const severityOrder: Record<SeverityLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    if (severityOrder[incident.severity as SeverityLevel] > severityOrder[concernCounts[type].severity]) {
      concernCounts[type].severity = incident.severity as SeverityLevel;
    }
  });

  return Object.entries(concernCounts)
    .map(([concern, data]) => ({ concern, count: data.count, severity: data.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getOSHAComplianceStatus(
  projectId: string
): Promise<{
  compliant: boolean;
  violations: string[];
  lastInspection: Date | null;
  nextInspection: Date | null;
}> {
  const incidents = await prisma.safetyIncident.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  const violations: string[] = [];

  const seriousIncidents = incidents.filter((i: any) => i.severity === 'critical' || i.severity === 'high');
  if (seriousIncidents.length > 0) {
    violations.push('Recent serious incidents require attention');
  }

  const unresolvedOlderThan30 = incidents.filter((i: any) => {
    if (i.status !== 'CLOSED') {
      const daysSinceReport = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReport > 30;
    }
    return false;
  });

  if (unresolvedOlderThan30.length > 0) {
    violations.push(`${unresolvedOlderThan30.length} incidents unresolved for over 30 days`);
  }

  const lastInspection = incidents.length > 0 ? new Date(incidents[0].createdAt) : null;
  const nextInspection = lastInspection
    ? new Date(lastInspection.getTime() + 90 * 24 * 60 * 60 * 1000)
    : null;

  return {
    compliant: violations.length === 0,
    violations,
    lastInspection,
    nextInspection,
  };
}
