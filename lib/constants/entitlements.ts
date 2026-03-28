export type Plan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type EntitlementFeature =
  | 'projects_limit'
  | 'storage_limit_gb'
  | 'team_members'
  | 'api_access'
  | 'ai_assistant'
  | 'advanced_reporting'
  | 'custom_branding'
  | 'priority_support'
  | 'sso'
  | 'audit_logs'
  | 'unlimited_projects'
  | 'unlimited_storage'
  | 'restrictions_removal'
  | 'custom_integrations'
  | 'api_rate_limit'
  | 'data_export'
  | 'multi_org';

export interface PlanEntitlements {
  plan: Plan;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Partial<Record<EntitlementFeature, number | boolean>>;
  limits: {
    projects: number | 'unlimited';
    storageGb: number | 'unlimited';
    teamMembers: number | 'unlimited';
    apiRequestsPerMonth: number | 'unlimited';
  };
}

export const PLAN_ENTITLEMENTS: Record<Plan, PlanEntitlements> = {
  FREE: {
    plan: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: {
      ai_assistant: false,
      advanced_reporting: false,
      custom_branding: false,
      priority_support: false,
      sso: false,
      audit_logs: false,
      unlimited_projects: false,
      unlimited_storage: false,
      restrictions_removal: false,
      custom_integrations: false,
      multi_org: false,
    },
    limits: {
      projects: 1,
      storageGb: 1,
      teamMembers: 2,
      apiRequestsPerMonth: 100,
    },
  },
  STARTER: {
    plan: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    features: {
      ai_assistant: false,
      advanced_reporting: false,
      custom_branding: false,
      priority_support: false,
      sso: false,
      audit_logs: false,
      unlimited_projects: false,
      unlimited_storage: false,
      restrictions_removal: false,
      custom_integrations: false,
      multi_org: false,
    },
    limits: {
      projects: 5,
      storageGb: 10,
      teamMembers: 10,
      apiRequestsPerMonth: 5000,
    },
  },
  PROFESSIONAL: {
    plan: 'PROFESSIONAL',
    displayName: 'Professional',
    monthlyPrice: 149,
    annualPrice: 119,
    features: {
      ai_assistant: true,
      advanced_reporting: true,
      custom_branding: false,
      priority_support: false,
      sso: false,
      audit_logs: false,
      unlimited_projects: true,
      unlimited_storage: false,
      restrictions_removal: false,
      custom_integrations: false,
      multi_org: false,
    },
    limits: {
      projects: 'unlimited',
      storageGb: 100,
      teamMembers: 50,
      apiRequestsPerMonth: 50000,
    },
  },
  ENTERPRISE: {
    plan: 'ENTERPRISE',
    displayName: 'Enterprise',
    monthlyPrice: 499,
    annualPrice: 399,
    features: {
      ai_assistant: true,
      advanced_reporting: true,
      custom_branding: true,
      priority_support: true,
      sso: true,
      audit_logs: true,
      unlimited_projects: true,
      unlimited_storage: true,
      restrictions_removal: true,
      custom_integrations: true,
      multi_org: true,
    },
    limits: {
      projects: 'unlimited',
      storageGb: 'unlimited',
      teamMembers: 'unlimited',
      apiRequestsPerMonth: 'unlimited',
    },
  },
};

export function hasEntitlement(
  plan: Plan,
  feature: EntitlementFeature
): boolean {
  const entitlements = PLAN_ENTITLEMENTS[plan];
  const featureValue = entitlements.features[feature];

  if (typeof featureValue === 'boolean') {
    return featureValue;
  }

  if (typeof featureValue === 'number') {
    return featureValue > 0;
  }

  return false;
}

export function getEntitlementLimit(
  plan: Plan,
  limit: 'projects' | 'storageGb' | 'teamMembers' | 'apiRequestsPerMonth'
): number | 'unlimited' {
  return PLAN_ENTITLEMENTS[plan].limits[limit];
}

export function isWithinLimit(
  plan: Plan,
  limit: 'projects' | 'storageGb' | 'teamMembers' | 'apiRequestsPerMonth',
  currentUsage: number
): boolean {
  const limitValue = getEntitlementLimit(plan, limit);

  if (limitValue === 'unlimited') {
    return true;
  }

  return currentUsage < limitValue;
}

export function getUpgradeMessage(
  currentPlan: Plan,
  feature: EntitlementFeature
): string | null {
  const currentEntitlements = PLAN_ENTITLEMENTS[currentPlan];

  if (hasEntitlement(currentPlan, feature)) {
    return null;
  }

  const plans = Object.keys(PLAN_ENTITLEMENTS) as Plan[];
  const currentIndex = plans.indexOf(currentPlan);

  for (let i = currentIndex + 1; i < plans.length; i++) {
    const planToCheck = plans[i];
    if (hasEntitlement(planToCheck, feature)) {
      return `Upgrade to ${PLAN_ENTITLEMENTS[planToCheck].displayName} to access this feature`;
    }
  }

  return 'Contact sales for enterprise features';
}

export function getAvailablePlans(): Plan[] {
  return Object.keys(PLAN_ENTITLEMENTS) as Plan[];
}

export function getPlanDetails(plan: Plan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan];
}
