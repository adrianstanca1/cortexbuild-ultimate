import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db';

export type Module =
  | 'projects'
  | 'tasks'
  | 'rfis'
  | 'daily_reports'
  | 'safety'
  | 'documents'
  | 'submittals'
  | 'change_orders'
  | 'equipment'
  | 'inspections'
  | 'meetings'
  | 'costs'
  | 'materials'
  | 'milestones'
  | 'time_tracking'
  | 'toolbox_talks'
  | 'mewp_checks'
  | 'risk_assessments'
  | 'permits'
  | 'drawings';

export interface EntitlementCheck {
  module: Module;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
}

export async function checkEntitlement(
  organizationId: string,
  module: Module,
  action: EntitlementCheck['action']
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { entitlements: true, plan: true },
  });

  if (!org) return false;

  const entitlements = org.entitlements as Record<string, Record<string, boolean>>;

  const planLimits: Record<string, Record<Module, string>> = {
    starter: {
      projects: 'read',
      tasks: 'read',
      rfis: 'read',
      daily_reports: 'read',
      safety: 'read',
      documents: 'none',
      submittals: 'none',
      change_orders: 'none',
      equipment: 'none',
      inspections: 'none',
      meetings: 'none',
      costs: 'none',
      materials: 'none',
      milestones: 'none',
      time_tracking: 'none',
      toolbox_talks: 'none',
      mewp_checks: 'none',
      risk_assessments: 'none',
      permits: 'none',
      drawings: 'none',
    },
    pro: {
      projects: 'full',
      tasks: 'full',
      rfis: 'full',
      daily_reports: 'full',
      safety: 'full',
      documents: 'full',
      submittals: 'full',
      change_orders: 'full',
      equipment: 'full',
      inspections: 'full',
      meetings: 'full',
      costs: 'full',
      materials: 'full',
      milestones: 'full',
      time_tracking: 'full',
      toolbox_talks: 'none',
      mewp_checks: 'none',
      risk_assessments: 'none',
      permits: 'none',
      drawings: 'none',
    },
    enterprise: {
      projects: 'full',
      tasks: 'full',
      rfis: 'full',
      daily_reports: 'full',
      safety: 'full',
      documents: 'full',
      submittals: 'full',
      change_orders: 'full',
      equipment: 'full',
      inspections: 'full',
      meetings: 'full',
      costs: 'full',
      materials: 'full',
      milestones: 'full',
      time_tracking: 'full',
      toolbox_talks: 'full',
      mewp_checks: 'full',
      risk_assessments: 'full',
      permits: 'full',
      drawings: 'full',
    },
  };

  const modulePlanLimit = planLimits[org.plan]?.[module] || 'none';

  if (modulePlanLimit === 'none') return false;
  if (modulePlanLimit === 'full') return true;
  if (modulePlanLimit === 'read' && action === 'read') return true;

  return false;
}

export function requireEntitlement(module: Module, action: EntitlementCheck['action']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasEntitlement = await checkEntitlement(req.user.organizationId, module, action);

    if (!hasEntitlement) {
      return res.status(403).json({
        error: 'Module not available',
        module,
        action,
      });
    }

    next();
  };
}

export async function getOrganizationEntitlements(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { entitlements: true, plan: true },
  });

  if (!org) return null;

  return {
    plan: org.plan,
    entitlements: org.entitlements as Record<string, Record<string, boolean>>,
  };
}
