import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Mail, Lock, User, TrendingUp, DollarSign, PieChart } from 'lucide-react';

export default function LoginRegister({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDemoFill = () => {
    setEmail('demo@budgeting.saas');
    setPassword('password123');
    setIsLogin(true);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMsg('Berhasil masuk! Membuka dashboard...');
        setTimeout(() => onAuthSuccess(data.session), 800);
      } else {
        if (!fullName.trim()) throw new Error('Nama lengkap wajib diisi');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });
        if (error) throw error;
        setSuccessMsg('Akun Anda berhasil didaftarkan! Masuk otomatis...');
        setTimeout(() => onAuthSuccess(data.session), 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--color-brand-gradient)', padding: '0.5rem', borderRadius: '10px' }}>
              <TrendingUp size={28} color="white" />
            </div>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, background: 'var(--color-brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SaaS Budgeting
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', lineHeight: '1.2', fontWeight: 800, marginBottom: '1.5rem', color: '#fff' }}>
            Kelola Keuangan Pribadi dengan <span style={{ color: 'var(--color-brand)' }}>Isolasi Sempurna</span>.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Platform multi-tenant premium dengan enkapsulasi data Row-Level Security (RLS) 100% aman untuk privasi finansial Anda.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <DollarSign size={20} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Pencatatan Arus Kas Cepat</strong>
                <p style={{ fontSize: '0.85rem' }}>Pantau pemasukan dan pengeluaran harian instan.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <PieChart size={20} style={{ color: '#a855f7' }} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Grafik Distribusi Kategori</strong>
                <p style={{ fontSize: '0.85rem' }}>Visualisasi konsumsi bulanan dalam pie chart interaktif.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Enkapsulasi Data PostgreSQL</strong>
                <p style={{ fontSize: '0.85rem' }}>Isolasi database multi-tenant berbasis RLS.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Masuk Akun
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Daftar Tenant Baru
          </button>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {isLogin ? 'Selamat Datang Kembali' : 'Buat Tenant Workspace'}
        </h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          {isLogin ? 'Masukkan kredensial tenant untuk masuk ke dashboard Anda.' : 'Registrasi cepat dan siapkan database isolated Anda.'}
        </p>

        {errorMsg && (
          <div className="alert alert-warning" style={{ margin: '0 0 1.5rem 0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Gagal Autentikasi</h3>
            <p style={{ fontSize: '0.85rem' }}>{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" style={{ margin: '0 0 1.5rem 0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Sukses</h3>
            <p style={{ fontSize: '0.85rem' }}>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nama Lengkap</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Klaudia Lete"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Tenant</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Kata Sandi</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : isLogin ? 'Masuk ke Workspace' : 'Buat Tenant'}
          </button>
        </form>

        {supabase.isMock && (
          <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
              💡 Menjalankan <strong>Mock Mode</strong> (Supabase belum di-setup)
            </p>
            <button
              onClick={handleDemoFill}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}
            >
              🚀 Masuk Cepat dengan Akun Demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
