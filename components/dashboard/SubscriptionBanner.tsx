'use client';

import { Button } from '@/components/ui/Button';

interface SubscriptionBannerProps {
  tier: string;
  onUpgrade: () => void;
}

export function SubscriptionBanner({ tier, onUpgrade }: SubscriptionBannerProps) {
  if (tier !== 'FREE') return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">You&apos;re on the Free tier</p>
            <p className="text-xs opacity-90">Upgrade to unlock unlimited projects, users, and advanced features.</p>
          </div>
        </div>
        <Button
          onClick={onUpgrade}
          variant="secondary"
          size="sm"
          className="ml-4 bg-white text-amber-600 hover:bg-white/90"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
