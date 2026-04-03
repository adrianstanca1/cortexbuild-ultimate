import React from 'react';

interface OAuthButtonProps {
  provider: 'google' | 'microsoft';
  onClick?: () => void;
  className?: string;
}

export function OAuthButton({ provider, onClick, className = '' }: OAuthButtonProps) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  const handleOAuthClick = () => {
    // SECURITY: Generate and store state parameter for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    
    // Redirect to OAuth provider with state parameter
    window.location.href = `${baseUrl}/api/auth/${provider}?state=${state}`;
    onClick?.();
  };

  if (provider === 'google') {
    return (
      <button
        type="button"
        onClick={handleOAuthClick}
        className={`oauth-button google ${className}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: '#ffffff',
          border: '1px solid rgba(30,41,59,0.9)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          color: '#1e293b',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = 'rgba(30,41,59,0.9)';
        }}
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
    );
  }

  if (provider === 'microsoft') {
    return (
      <button
        type="button"
        onClick={handleOAuthClick}
        className={`oauth-button microsoft ${className}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: '#2F2F2F',
          border: '1px solid rgba(30,41,59,0.9)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          color: '#ffffff',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3A3A3A';
          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#2F2F2F';
          e.currentTarget.style.borderColor = 'rgba(30,41,59,0.9)';
        }}
      >
        <MicrosoftIcon />
        <span>Continue with Microsoft</span>
      </button>
    );
  }

  return null;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.125 8.125H10V11.875H14.6875C14.125 14.375 12.125 16.25 9.375 16.25C6.5625 16.25 4.375 13.9375 4.375 11.125C4.375 8.3125 6.5625 6 9.375 6C10.8125 6 12.0625 6.5 13 7.3125L15.6875 4.625C13.9375 3 11.75 2 9.375 2C5.3125 2 2 5.3125 2 9.375C2 13.4375 5.3125 16.75 9.375 16.75C13.875 16.75 17.5 13.125 17.5 8.75C17.5 8.5625 17.5 8.3125 17.5 8.125H18.125Z" fill="currentColor"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.875 1.875H9.375V9.375H1.875V1.875Z" fill="#F25022"/>
      <path d="M10.625 1.875H18.125V9.375H10.625V1.875Z" fill="#7FBA00"/>
      <path d="M1.875 10.625H9.375V18.125H1.875V10.625Z" fill="#00A4EF"/>
      <path d="M10.625 10.625H18.125V18.125H10.625V10.625Z" fill="#FFB900"/>
    </svg>
  );
}

export default OAuthButton;
