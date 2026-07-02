import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import LoginRegister from './features/auth/LoginRegister';
import Dashboard from './features/dashboard/Dashboard';
import TransactionManager from './features/transactions/TransactionManager';
import { LogOut, User, LayoutDashboard, History, Layers, ShieldCheck, Activity } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'transactions'
  
  // Data State
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // 1. Authenticate check on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error("Error getting session:", err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchData(session.user.id);
        } else {
          setCategories([]);
          setTransactions([]);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Fetch User-Isolated Data
  const fetchData = async (userId) => {
    setDataLoading(true);
    try {
      // Fetch categories isolated for user
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);
      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch transactions isolated for user ordered by date desc
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });
      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // 3. Add Category Callback
  const handleAddCategory = async (newCat) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          ...newCat,
          user_id: session.user.id
        });
      if (error) throw error;
      fetchData(session.user.id);
    } catch (err) {
      alert("Gagal menambahkan kategori: " + err.message);
    }
  };

  // 4. Add Transaction Callback
  const handleAddTransaction = async (newTx) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...newTx,
          user_id: session.user.id
        });
      if (error) throw error;
      fetchData(session.user.id);
    } catch (err) {
      alert("Gagal mencatat transaksi: " + err.message);
    }
  };

  // 5. Delete Transaction Callback
  const handleDeleteTransaction = async (txId) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', txId);
      if (error) throw error;
      fetchData(session.user.id);
    } catch (err) {
      alert("Gagal menghapus transaksi: " + err.message);
    }
  };

  // 6. Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-brand)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mengecek status sesi tenant...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {session ? (
        <>
          {/* Authenticated Header/Navbar */}
          <header className="navbar">
            <div className="navbar-brand">
              <Layers size={22} style={{ color: 'var(--color-brand)' }} />
              <span>SaaS Budgeting</span>
              {supabase.isMock && (
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  Mock Mode
                </span>
              )}
            </div>

            <div className="navbar-actions">
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.25rem', borderRadius: '8px' }}>
                <button
                  className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={14} /> Ringkasan
                </button>
                <button
                  className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none' }}
                  onClick={() => setActiveTab('transactions')}
                >
                  <History size={14} /> Transaksi
                </button>
              </div>

              <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <User size={16} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={session.user.email}>
                  {session.user.user_metadata?.full_name || session.user.email}
                </span>
              </div>

              <button
                className="btn btn-danger"
                style={{ padding: '0.5rem', borderRadius: '8px', border: 'none' }}
                onClick={handleSignOut}
                title="Keluar Sesi"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>

          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Multi-Tenant RLS Info Alert */}
            <section className="alert alert-success" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: 0 }}>
              <ShieldCheck size={32} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Enkapsulasi Tenant Aktif: {session.user.id}</h4>
                <p style={{ fontSize: '0.8rem', color: '#a7f3d0', margin: 0 }}>
                  Kebijakan PostgreSQL Row-Level Security (RLS) diaktifkan. Kueri data hanya mengembalikan transaksi yang memiliki <code>user_id = '{session.user.id}'</code>.
                </p>
              </div>
            </section>

            {dataLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Memuat data workspace...
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' ? (
                  <Dashboard
                    transactions={transactions}
                    categories={categories}
                    user={session.user}
                  />
                ) : (
                  <TransactionManager
                    transactions={transactions}
                    categories={categories}
                    onAddTransaction={handleAddTransaction}
                    onAddCategory={handleAddCategory}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                )}
              </>
            )}
          </main>
        </>
      ) : (
        <LoginRegister onAuthSuccess={(sess) => setSession(sess)} />
      )}

      <footer style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 0' }}>
        &copy; {new Date().getFullYear()} SaaS Personal Budgeting. Disiapkan oleh Senior Cloud Engineer.
      </footer>
    </div>
  );
}

export default App;
