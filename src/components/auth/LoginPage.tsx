import { useState } from 'react';
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, company);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--slate-950)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Blueprint grid background */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(59,83,120,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,83,120,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial fade from centre */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.04) 0%, transparent 70%)',
      }} />

      {/* Corner decoration — top left */}
      <div style={{
        position: 'absolute', top: '32px', left: '32px',
        display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none',
      }}>
        {[80, 60, 40].map((w, i) => (
          <div key={i} style={{
            height: '1px',
            background: `linear-gradient(90deg, rgba(245,158,11,${0.3 - i * 0.08}), transparent)`,
            width: `${w}px`,
          }} />
        ))}
      </div>

      {/* Corner decoration — bottom right */}
      <div style={{
        position: 'absolute', bottom: '32px', right: '32px',
        display: 'flex', flexDirection: 'column', gap: '6px', pointerEvents: 'none',
        alignItems: 'flex-end',
      }}>
        {[40, 60, 80].map((w, i) => (
          <div key={i} style={{
            height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(245,158,11,${0.3 - i * 0.08}))`,
            width: `${w}px`,
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            {/* Logo mark */}
            <div style={{
              width: '48px', height: '48px',
              background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(245,158,11,0.3), 0 0 0 1px rgba(245,158,11,0.2) inset',
            }}>
              <Building2 style={{ width: '26px', height: '26px', color: 'var(--slate-950)' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--slate-50)', lineHeight: 1 }}>CortexBuild</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, color: 'var(--amber-400)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px' }}>Ultimate</div>
            </div>
          </div>
          {/* Tag line */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-400)', letterSpacing: '0.02em' }}>
            {mode === 'login'
              ? 'Sign in to your construction workspace'
              : 'Create your CortexBuild account'
            }
          </p>
          {/* Blueprint rule */}
          <div style={{
            marginTop: '16px', height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--slate-700), transparent)',
          }} />
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: '32px',
            boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 0 1px var(--slate-800)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Adrian Stanca"
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                    Company
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                    placeholder="CortexBuild Ltd"
                    className="input"
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--slate-500)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@company.co.uk"
                  className="input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-300)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--slate-500)', pointerEvents: 'none' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--slate-500)', padding: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  {showPass ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '8px',
                fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--red-400)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '4px' }}
            >
              {loading && <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 0.7s linear infinite' }} />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--slate-500)',
          }}>
            {mode === 'login' ? (
              <>No account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--amber-400)', fontWeight: 600, transition: 'color 0.2s' }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>Already registered?{' '}
                <button
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--amber-400)', fontWeight: 600, transition: 'color 0.2s' }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--slate-600)',
          marginTop: '32px', letterSpacing: '0.05em',
        }}>
          © 2026 CORTEXBUILD LTD · UK CONSTRUCTION MANAGEMENT PLATFORM
        </p>
      </div>
    </div>
  );
}
