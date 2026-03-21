import { useState, useEffect, useRef } from 'react';
import { Building2, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, ShieldCheck, Zap, Users, TrendingUp, HardHat, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Animated counter hook ─────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, startDelay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(t);
  }, [target, duration, startDelay]);
  return val;
}

// ─── Blueprint SVG structure ───────────────────────────────────────────────
function BlueprintStructure() {
  return (
    <svg viewBox="0 0 440 520" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <defs>
        <style>{`
          @keyframes drawLine { from { stroke-dashoffset: 1200; } to { stroke-dashoffset: 0; } }
          @keyframes drawShort { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
          .line-1 { animation: drawLine 2.8s ease forwards; stroke-dasharray: 1200; stroke-dashoffset: 1200; }
          .line-2 { animation: drawLine 2.4s ease 0.3s forwards; stroke-dasharray: 1200; stroke-dashoffset: 1200; }
          .line-3 { animation: drawShort 1.8s ease 0.8s forwards; stroke-dasharray: 600; stroke-dashoffset: 600; }
          .line-4 { animation: drawShort 1.6s ease 1.0s forwards; stroke-dasharray: 600; stroke-dashoffset: 600; }
          .line-5 { animation: drawShort 1.4s ease 1.2s forwards; stroke-dasharray: 600; stroke-dashoffset: 600; }
          .dot { animation: fadeIn 0.4s ease forwards; opacity: 0; }
          .dot-1 { animation-delay: 2.0s; }
          .dot-2 { animation-delay: 2.2s; }
          .dot-3 { animation-delay: 2.4s; }
          .dot-4 { animation-delay: 2.6s; }
          .label { animation: fadeIn 0.6s ease forwards; opacity: 0; }
          .label-1 { animation-delay: 1.8s; }
          .label-2 { animation-delay: 2.1s; }
          .label-3 { animation-delay: 2.5s; }
          .crosshair { animation: pulse 3s ease infinite; }
        `}</style>
      </defs>

      {/* Main column left */}
      <line className="line-1" x1="80" y1="60" x2="80" y2="460" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5" />
      {/* Main column right */}
      <line className="line-1" x1="360" y1="60" x2="360" y2="460" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5" />
      {/* Foundation base */}
      <line className="line-2" x1="60" y1="460" x2="380" y2="460" stroke="rgba(245,158,11,0.5)" strokeWidth="2" />
      {/* Roof beam */}
      <line className="line-2" x1="60" y1="60" x2="380" y2="60" stroke="rgba(245,158,11,0.5)" strokeWidth="2" />

      {/* Floor plates */}
      {[145, 230, 315].map((y, i) => (
        <line key={i} className="line-3" x1="80" y1={y} x2="360" y2={y} stroke="rgba(245,158,11,0.2)" strokeWidth="1" strokeDasharray="6 4" />
      ))}

      {/* Cross bracing left bay */}
      <line className="line-4" x1="80" y1="60" x2="220" y2="460" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
      <line className="line-4" x1="220" y1="60" x2="80" y2="460" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
      {/* Cross bracing right bay */}
      <line className="line-5" x1="220" y1="60" x2="360" y2="460" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
      <line className="line-5" x1="360" y1="60" x2="220" y2="460" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />

      {/* Centre column */}
      <line className="line-3" x1="220" y1="60" x2="220" y2="460" stroke="rgba(245,158,11,0.2)" strokeWidth="1" />

      {/* Connection nodes */}
      {[[80,60],[360,60],[80,460],[360,460],[220,60],[220,460],[80,145],[360,145],[80,230],[360,230],[80,315],[360,315]].map(([cx,cy],i) => (
        <circle key={i} className={`dot dot-${(i%4)+1}`} cx={cx} cy={cy} r="4" fill="none" stroke="rgba(245,158,11,0.7)" strokeWidth="1.5" />
      ))}
      {[[80,60],[360,60],[80,460],[360,460]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="1.5" fill="rgba(245,158,11,0.9)" className={`dot dot-${i+1}`} />
      ))}

      {/* Dimension lines */}
      <g className="label label-1">
        <line x1="30" y1="60" x2="30" y2="460" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <line x1="26" y1="60" x2="34" y2="60" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <line x1="26" y1="460" x2="34" y2="460" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <text x="18" y="265" fill="rgba(245,158,11,0.4)" fontSize="8" fontFamily="monospace" textAnchor="middle" transform="rotate(-90,18,265)">24,500mm</text>
      </g>
      <g className="label label-2">
        <line x1="80" y1="500" x2="360" y2="500" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <line x1="80" y1="496" x2="80" y2="504" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <line x1="360" y1="496" x2="360" y2="504" stroke="rgba(245,158,11,0.25)" strokeWidth="0.75" />
        <text x="220" y="515" fill="rgba(245,158,11,0.4)" fontSize="8" fontFamily="monospace" textAnchor="middle">14,000mm</text>
      </g>

      {/* Callout labels */}
      <g className="label label-3">
        <line x1="360" y1="145" x2="400" y2="120" stroke="rgba(245,158,11,0.3)" strokeWidth="0.75" />
        <text x="403" y="119" fill="rgba(245,158,11,0.5)" fontSize="7.5" fontFamily="monospace">FL 01 +3,600</text>
      </g>
      <g className="label label-3">
        <line x1="360" y1="230" x2="400" y2="210" stroke="rgba(245,158,11,0.3)" strokeWidth="0.75" />
        <text x="403" y="209" fill="rgba(245,158,11,0.5)" fontSize="7.5" fontFamily="monospace">FL 02 +7,200</text>
      </g>
      <g className="label label-3">
        <line x1="360" y1="315" x2="400" y2="295" stroke="rgba(245,158,11,0.3)" strokeWidth="0.75" />
        <text x="403" y="294" fill="rgba(245,158,11,0.5)" fontSize="7.5" fontFamily="monospace">FL 03 +10,800</text>
      </g>

      {/* Crosshair at roof level centre */}
      <g className="crosshair">
        <line x1="210" y1="60" x2="230" y2="60" stroke="rgba(245,158,11,0.6)" strokeWidth="1" />
        <line x1="220" y1="50" x2="220" y2="70" stroke="rgba(245,158,11,0.6)" strokeWidth="1" />
      </g>
    </svg>
  );
}

// ─── Stat block ──────────────────────────────────────────────────────────
function StatBlock({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const count = useCounter(value, 2000, delay);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
        color: '#f59e0b',
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        color: 'rgba(138,155,181,0.8)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginTop: '5px',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Feature pill ─────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, text, delay }: { icon: LucideIcon; text: string; delay: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '7px 14px',
      background: 'rgba(245,158,11,0.07)',
      border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: '100px',
      animation: `slideUp 0.6s ease ${delay} both`,
    }}>
      <Icon size={13} style={{ color: '#f59e0b' }} />
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '12px',
        fontWeight: 500,
        color: 'rgba(226,232,240,0.85)',
        letterSpacing: '0.01em',
      }}>{text}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#080b12',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scanLine {
          0%   { transform: translateY(0);    opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(520px); opacity: 0; }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes borderGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.3), 0 0 12px rgba(245,158,11,0.08); }
          50%       { box-shadow: 0 0 0 1px rgba(245,158,11,0.6), 0 0 24px rgba(245,158,11,0.15); }
        }

        .auth-input {
          width: 100%;
          background: rgba(13,17,23,0.8);
          border: 1px solid rgba(30,41,59,0.9);
          border-radius: 10px;
          padding: 12px 16px;
          color: #f1f5f9;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(90,106,130,0.7); }
        .auth-input:focus {
          border-color: rgba(245,158,11,0.6);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.08);
        }
        .auth-input-icon { padding-left: 42px; }

        .submit-btn {
          width: 100%;
          padding: 13px 20px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none;
          border-radius: 10px;
          color: #080b12;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 20px rgba(245,158,11,0.25);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(245,158,11,0.35);
        }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .mode-link {
          background: none;
          border: none;
          cursor: pointer;
          color: #f59e0b;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          padding: 0;
          transition: color 0.2s;
        }
        .mode-link:hover { color: #fbbf24; }

        .ticker-track {
          display: flex;
          gap: 0;
          animation: ticker 28s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      {/* ─── LEFT HERO PANEL ──────────────────────────────────────── */}
      <div style={{
        display: 'none',
        flex: '0 0 58%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #090e1a 0%, #0d1117 50%, #080b12 100%)',
        ...(typeof window !== 'undefined' && window.innerWidth > 900 ? { display: 'flex' } : {}),
      }} className="hero-panel">

        {/* Blueprint micro-grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(59,83,120,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,83,120,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }} />

        {/* Large grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(59,83,120,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,83,120,0.12) 1px, transparent 1px)
          `,
          backgroundSize: '160px 160px',
        }} />

        {/* Scan line effect */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '2px', top: 0,
          background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)',
          animation: 'scanLine 7s ease-in-out 2s infinite',
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Radial amber glow — centre-left */}
        <div style={{
          position: 'absolute', top: '30%', left: '35%',
          width: '500px', height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.06) 0%, transparent 65%)',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Blueprint structure SVG — positioned right */}
        <div style={{
          position: 'absolute',
          right: '-30px', top: '50%',
          width: '460px', height: '520px',
          transform: 'translateY(-50%)',
          opacity: 0.6, zIndex: 1, pointerEvents: 'none',
        }}>
          <BlueprintStructure />
        </div>

        {/* ── Content ── */}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '0 56px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          maxWidth: '520px',
        }}>

          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '52px',
            animation: 'slideUp 0.6s ease 0.1s both',
          }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            }}>
              <HardHat size={20} style={{ color: '#080b12' }} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '18px',
                color: '#f1f5f9',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>CortexBuild</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                fontWeight: 500,
                color: '#f59e0b',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginTop: '3px',
              }}>ULTIMATE // v2.0</div>
            </div>
          </div>

          {/* Hero headline */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
              lineHeight: 1.0,
              letterSpacing: '-0.04em',
              color: '#f1f5f9',
              animation: 'slideUp 0.7s ease 0.2s both',
            }}>
              COMMAND<br />
              <span style={{
                WebkitTextStroke: '1px rgba(245,158,11,0.6)',
                color: 'transparent',
              }}>YOUR SITE.</span><br />
              DELIVER<br />
              ON TIME.
            </div>
          </div>

          {/* Sub-headline */}
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'rgba(138,155,181,0.9)',
            maxWidth: '380px',
            marginBottom: '32px',
            animation: 'slideUp 0.7s ease 0.35s both',
          }}>
            The full-stack construction management platform built for UK contractors —
            from groundworks to sign-off. Projects, CIS, RAMS, invoicing and site
            intelligence, unified.
          </p>

          {/* Feature pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '44px',
          }}>
            <FeaturePill icon={ShieldCheck}    text="CIS Compliance"       delay="0.45s" />
            <FeaturePill icon={Zap}            text="Live Site Dashboard"  delay="0.55s" />
            <FeaturePill icon={Users}          text="Team & Subcontractors" delay="0.65s" />
            <FeaturePill icon={TrendingUp}     text="Financial Reporting"  delay="0.75s" />
            <FeaturePill icon={CheckCircle}    text="RAMS & Inspections"   delay="0.85s" />
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'rgba(30,41,59,0.5)',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid rgba(30,41,59,0.8)',
            animation: 'slideUp 0.7s ease 0.9s both',
          }}>
            {[
              { value: 2800, suffix: '+', label: 'projects managed' },
              { value: 47,   suffix: 'K', label: 'workers tracked' },
              { value: 99,   suffix: '%', label: 'uptime SLA' },
            ].map(({ value, suffix, label }, i) => (
              <div key={i} style={{
                padding: '20px 12px',
                background: 'rgba(13,17,23,0.7)',
                position: 'relative',
              }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '1px',
                    background: 'rgba(30,41,59,0.8)',
                  }} />
                )}
                <StatBlock value={value} suffix={suffix} label={label} delay={1100 + i * 200} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ticker */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid rgba(30,41,59,0.6)',
          background: 'rgba(8,11,18,0.85)',
          padding: '10px 0',
          overflow: 'hidden',
          zIndex: 3,
        }}>
          <div className="ticker-track">
            {Array(2).fill(null).map((_, j) => (
              <span key={j} style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: 'rgba(90,106,130,0.6)',
                letterSpacing: '0.08em',
              }}>
                {['PROJECTS', 'CIS RETURNS', 'RAMS', 'INVOICING', 'TIMESHEETS', 'SAFETY', 'DRAWINGS', 'PROCUREMENT', 'TENDERS', 'PLANT & EQUIPMENT', 'SITE DIARY', 'RISK REGISTER'].map(m => (
                  <span key={m} style={{ marginRight: '48px' }}>
                    <span style={{ color: 'rgba(245,158,11,0.4)', marginRight: '8px' }}>◆</span>{m}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT AUTH PANEL ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 36px',
        background: '#0d1117',
        borderLeft: '1px solid rgba(30,41,59,0.6)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', pointerEvents: 'none' }}>
          {[72, 48, 28].map((w, i) => (
            <div key={i} style={{
              height: '1px',
              marginBottom: '5px',
              background: `linear-gradient(90deg, rgba(245,158,11,${0.25 - i * 0.06}), transparent)`,
              width: `${w}px`,
            }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', pointerEvents: 'none' }}>
          {[28, 48, 72].map((w, i) => (
            <div key={i} style={{
              height: '1px',
              marginBottom: '5px',
              background: `linear-gradient(90deg, transparent, rgba(245,158,11,${0.25 - (2 - i) * 0.06}))`,
              width: `${w}px`,
              marginLeft: 'auto',
            }} />
          ))}
        </div>

        {/* Mobile-only logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '36px',
        }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
            <Building2 size={18} style={{ color: '#080b12' }} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: '17px',
              color: '#f1f5f9', lineHeight: 1,
            }}>CortexBuild</div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px', color: '#f59e0b',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '3px',
            }}>ULTIMATE</div>
          </div>
        </div>

        {/* Form card */}
        <div ref={formRef} style={{
          width: '100%',
          maxWidth: '380px',
          animation: 'slideUp 0.6s ease 0.2s both',
        }}>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              color: '#f1f5f9',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {mode === 'login' ? 'Welcome back' : 'Start building'}
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'rgba(90,106,130,0.9)',
              margin: '6px 0 0',
            }}>
              {mode === 'login'
                ? 'Sign in to your construction workspace'
                : 'Create your CortexBuild account — free to start'}
            </p>
          </div>

          {/* Divider with label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(30,41,59,0.9)' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: 'rgba(90,106,130,0.6)',
              letterSpacing: '0.1em',
            }}>{mode === 'login' ? 'SIGN_IN' : 'REGISTER'}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(30,41,59,0.9)' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {mode === 'signup' && (
              <>
                <div>
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px', fontWeight: 600,
                    color: 'rgba(184,196,212,0.8)', marginBottom: '6px',
                    letterSpacing: '0.01em',
                  }}>Full name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    required placeholder="Your full name"
                    className="auth-input"
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block', fontFamily: "'DM Sans', sans-serif",
                    fontSize: '12px', fontWeight: 600,
                    color: 'rgba(184,196,212,0.8)', marginBottom: '6px',
                  }}>Company name</label>
                  <input
                    type="text" value={company} onChange={e => setCompany(e.target.value)}
                    required placeholder="Your company"
                    className="auth-input"
                    onFocus={() => setFocusedField('company')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label style={{
                display: 'block', fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px', fontWeight: 600,
                color: 'rgba(184,196,212,0.8)', marginBottom: '6px',
              }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'email' ? '#f59e0b' : 'rgba(90,106,130,0.6)',
                  transition: 'color 0.2s', pointerEvents: 'none',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '13px',
                }}>@</span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@company.co.uk"
                  className="auth-input auth-input-icon"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px', fontWeight: 600,
                  color: 'rgba(184,196,212,0.8)',
                }}>Password</label>
                {mode === 'login' && (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: 'rgba(90,106,130,0.5)',
                    letterSpacing: '0.06em',
                  }}>MIN 8 CHARS</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: focusedField === 'password' ? '#f59e0b' : 'rgba(90,106,130,0.6)',
                  transition: 'color 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="auth-input auth-input-icon"
                  style={{ paddingRight: '42px' }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(90,106,130,0.6)', padding: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  {showPass
                    ? <EyeOff size={14} />
                    : <Eye size={14} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(248,113,113,0.07)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12.5px',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '16px' }}>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: '4px' }}>
              {loading && <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Mode toggle */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'rgba(90,106,130,0.8)',
          }}>
            {mode === 'login' ? (
              <>No account?{' '}
                <button className="mode-link" onClick={() => { setMode('signup'); setError(''); }}>
                  Sign up free
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="mode-link" onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(30,41,59,0.6)',
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
          }}>
            {[
              { icon: ShieldCheck, text: 'GDPR Compliant' },
              { icon: Building2,   text: 'UK Construction' },
              { icon: Zap,         text: 'Instant Setup' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              }}>
                <Icon size={14} style={{ color: 'rgba(245,158,11,0.45)' }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '8px',
                  color: 'rgba(90,106,130,0.5)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute', bottom: '20px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: 'rgba(61,79,102,0.6)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          © 2026 CortexBuild Ltd · All rights reserved
        </p>
      </div>

      {/* Global responsive style for hero panel */}
      <style>{`
        @media (min-width: 900px) {
          .hero-panel { display: flex !important; }
        }
        @media (max-width: 899px) {
          .hero-panel { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
