import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { api } from '../lib/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      if (res?.token) localStorage.setItem('zenya-auth-token', res.token);
      onLogin && onLogin(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputBox = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    height: 46,
    padding: '0 14px',
    background: 'var(--surface-card)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-md)',
  };
  const inputEl = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-base)',
    color: 'var(--text-body)',
    minWidth: 0,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-page)',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 36px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          <img
            src="/zenya-mark-rose.png"
            alt="Zenya"
            style={{ height: 52, width: 'auto', marginBottom: 12 }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-3xl)',
              fontWeight: 600,
              color: 'var(--text-display)',
              lineHeight: 1,
              letterSpacing: 'var(--ls-tight)',
            }}
          >
            zenya
          </div>
          <div
            style={{
              fontFamily: 'var(--font-label)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: 'var(--ls-label)',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginTop: 8,
            }}
          >
            Nails &amp; Spa · Panel de administración
          </div>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-heading)',
              }}
            >
              Correo electrónico
            </span>
            <div style={inputBox}>
              <Mail size={17} strokeWidth={1.7} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputEl}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-heading)',
              }}
            >
              Contraseña
            </span>
            <div style={inputBox}>
              <Lock size={17} strokeWidth={1.7} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type={show ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                style={inputEl}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                {show ? <EyeOff size={18} strokeWidth={1.7} /> : <Eye size={18} strokeWidth={1.7} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 48,
              width: '100%',
              marginTop: 4,
              background: loading ? 'var(--ink-300)' : 'var(--brand-primary)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--fw-semibold)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background var(--dur-fast) var(--ease-soft)',
            }}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                alignSelf: 'center',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--negative-soft)',
                color: 'var(--negative)',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
              }}
            >
              Credenciales incorrectas
            </div>
          )}
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 28,
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-2xs)',
            color: 'var(--text-muted)',
          }}
        >
          © 2026 Zenya Nails &amp; Spa
        </div>
      </div>
    </div>
  );
};

export default Login;
