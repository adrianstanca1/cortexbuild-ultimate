import React from 'react';

interface SubscriptionBannerProps {
  tier: string;
  onUpgrade: () => void;
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white text-amber-600 hover:bg-white/90 rounded-lg text-sm font-medium transition-colors"
    >
      {children}
    </button>
  );
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
            <p className="text-sm font-medium">You're on the Free tier</p>
            <p className="text-xs opacity-90">Upgrade to unlock unlimited projects, users, and advanced features.</p>
          </div>
        </div>
        <Button onClick={onUpgrade}>
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
