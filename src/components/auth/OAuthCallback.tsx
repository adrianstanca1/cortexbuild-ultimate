import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    const stateParam = searchParams.get('state');

    // SECURITY: Validate OAuth state parameter to prevent CSRF attacks
    if (stateParam) {
      const storedState = sessionStorage.getItem('oauth_state');
      if (!storedState || storedState !== stateParam) {
        setStatus('error');
        setError('Invalid OAuth state. Please try again.');
        console.error('[OAuth] State mismatch - possible CSRF attack');
        return;
      }
      // Clear stored state after validation
      sessionStorage.removeItem('oauth_state');
    }

    if (errorParam) {
      setStatus('error');
      setError('OAuth authentication failed. Please try again.');
      return;
    }

    if (!token) {
      setStatus('error');
      setError('No authentication token received. Please try again.');
      return;
    }

    try {
      // SECURITY: Token is now stored in httpOnly cookie by server
      // Do not store tokens in localStorage - vulnerable to XSS
      // localStorage.setItem('auth_token', token); // REMOVED

      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      setStatus('success');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setError('Failed to process authentication. Please try again.');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #080b12 0%, #0f172a 100%)',
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(30,41,59,0.5)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <Loader2 
              size={48} 
              style={{ 
                color: '#f59e0b',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px',
              }} 
            />
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              color: '#f1f5f9',
              marginBottom: '8px',
            }}>
              Completing Sign-In
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'rgba(148,163,184,0.8)',
            }}>
              Setting up your workspace...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle 
              size={48} 
              style={{ color: '#10b981', marginBottom: '20px' }} 
            />
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              color: '#f1f5f9',
              marginBottom: '8px',
            }}>
              Sign-In Successful
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'rgba(148,163,184,0.8)',
            }}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle 
              size={48} 
              style={{ color: '#ef4444', marginBottom: '20px' }} 
            />
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '20px',
              color: '#f1f5f9',
              marginBottom: '8px',
            }}>
              Sign-In Failed
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'rgba(148,163,184,0.8)',
              marginBottom: '20px',
            }}>
              {error}
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                color: '#080b12',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default OAuthCallback;
