import { prisma } from '@/lib/db';

export interface SubscriptionEntitlements {
  projects: number;
  users: number;
  storage: number;
  apiAccess: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  advancedSecurity: boolean;
}

const ENTITLEMENTS: Record<string, SubscriptionEntitlements> = {
  FREE: {
    projects: 1,
    users: 2,
    storage: 1,
    apiAccess: false,
    analytics: false,
    prioritySupport: false,
    customBranding: false,
    advancedSecurity: false,
  },
  STARTER: {
    projects: 5,
    users: 10,
    storage: 10,
    apiAccess: true,
    analytics: false,
    prioritySupport: false,
    customBranding: false,
    advancedSecurity: false,
  },
  PROFESSIONAL: {
    projects: -1,
    users: 50,
    storage: 100,
    apiAccess: true,
    analytics: true,
    prioritySupport: true,
    customBranding: true,
    advancedSecurity: false,
  },
  ENTERPRISE: {
    projects: -1,
    users: -1,
    storage: 1000,
    apiAccess: true,
    analytics: true,
    prioritySupport: true,
    customBranding: true,
    advancedSecurity: true,
  },
};

export async function getSubscriptionStatus(organizationId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { organizationId },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!subscription) {
    return {
      subscription: null,
      entitlements: ENTITLEMENTS.FREE,
      isActive: false,
      isTrial: false,
    };
  }

  const now = new Date();
  const isTrial = subscription.status === 'TRIALING';
  const isActive = subscription.status === 'ACTIVE' && subscription.currentPeriodEnd > now;
  const isPastDue = subscription.status === 'PAST_DUE';

  return {
    subscription,
    entitlements: ENTITLEMENTS[subscription.plan] || ENTITLEMENTS.FREE,
    isActive,
    isTrial,
    isPastDue,
  };
}

export async function validateEntitlements(
  organizationId: string,
  requiredEntitlement: keyof SubscriptionEntitlements
): Promise<{ allowed: boolean; current: SubscriptionEntitlements | null }> {
  const { entitlements } = await getSubscriptionStatus(organizationId);

  if (!entitlements) {
    return { allowed: false, current: null };
  }

  const allowed = entitlements[requiredEntitlement] !== false;

  return { allowed, current: entitlements };
}

export async function validateProjectLimit(organizationId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const { entitlements } = await getSubscriptionStatus(organizationId);

  const projectCount = await prisma.project.count({
    where: { organizationId },
  });

  const limit = entitlements.projects;

  if (limit === -1) {
    return { allowed: true, count: projectCount, limit };
  }

  return {
    allowed: projectCount < limit,
    count: projectCount,
    limit,
  };
}

export async function validateUserLimit(organizationId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const { entitlements } = await getSubscriptionStatus(organizationId);

  const userCount = await prisma.user.count({
    where: { organizationId },
  });

  const limit = entitlements.users;

  if (limit === -1) {
    return { allowed: true, count: userCount, limit };
  }

  return {
    allowed: userCount < limit,
    count: userCount,
    limit,
  };
}

export function canAccessFeature(tier: string, feature: keyof SubscriptionEntitlements): boolean {
  const entitlements = ENTITLEMENTS[tier];
  if (!entitlements) return false;
  return entitlements[feature] === true;
}

export function getUpgradeMessage(currentTier: string): string | null {
  const tierOrder = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return null;
  }

  const nextTier = tierOrder[currentIndex + 1];
  return `Upgrade to ${nextTier} to access more features`;
}
