import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = !supabaseUrl || !supabaseAnonKey || 
                      supabaseUrl.includes('your-project-id') || 
                      supabaseAnonKey.includes('your-anon-key-here');

// Helper to manage mock session & data via localStorage
const getMockSession = () => {
  const session = localStorage.getItem('saas_budget_session');
  return session ? JSON.parse(session) : null;
};

const setMockSession = (session) => {
  if (session) {
    localStorage.setItem('saas_budget_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('saas_budget_session');
  }
};

// Seed initial mock data if not exists
const seedMockData = (userId) => {
  const categoriesKey = `saas_budget_categories_${userId}`;
  const transactionsKey = `saas_budget_transactions_${userId}`;

  if (!localStorage.getItem(categoriesKey)) {
    const initialCategories = [
      { id: 'cat-1', user_id: userId, name: 'Gaji & Pendapatan', type: 'income' },
      { id: 'cat-2', user_id: userId, name: 'Makanan & Minum', type: 'expense', limit: 1500000 },
      { id: 'cat-3', user_id: userId, name: 'Transportasi', type: 'expense', limit: 500000 },
      { id: 'cat-4', user_id: userId, name: 'Hiburan & Hobi', type: 'expense', limit: 400000 },
      { id: 'cat-5', user_id: userId, name: 'Utilitas & Bulanan', type: 'expense', limit: 1000000 }
    ];
    localStorage.setItem(categoriesKey, JSON.stringify(initialCategories));
  }

  if (!localStorage.getItem(transactionsKey)) {
    const initialTransactions = [
      { id: 'tx-1', user_id: userId, category_id: 'cat-1', amount: 5000000, transaction_date: '2026-06-01T08:00:00Z', description: 'Gaji Bulanan Utama' },
      { id: 'tx-2', user_id: userId, category_id: 'cat-2', amount: 150000, transaction_date: '2026-06-03T12:30:00Z', description: 'Makan siang di restoran' },
      { id: 'tx-3', user_id: userId, category_id: 'cat-3', amount: 50000, transaction_date: '2026-06-05T09:00:00Z', description: 'Bensin mingguan' },
      { id: 'tx-4', user_id: userId, category_id: 'cat-4', amount: 120000, transaction_date: '2026-06-08T19:00:00Z', description: 'Tiket bioskop & popcorn' },
      { id: 'tx-5', user_id: userId, category_id: 'cat-5', amount: 450000, transaction_date: '2026-06-10T10:15:00Z', description: 'Tagihan internet rumah' }
    ];
    localStorage.setItem(transactionsKey, JSON.stringify(initialTransactions));
  }
};

let mockListeners = [];

// Create Mock Client API
const mockSupabase = {
  isMock: true,
  auth: {
    getSession: async () => {
      const session = getMockSession();
      if (session) {
        seedMockData(session.user.id);
      }
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      if (email === 'demo@budgeting.saas' && password === 'password123') {
        const session = {
          access_token: 'mock-jwt-token-12345',
          user: {
            id: 'demo-tenant-uuid-5555',
            email: 'demo@budgeting.saas',
            user_metadata: { full_name: 'Demo Tenant' }
          }
        };
        setMockSession(session);
        seedMockData(session.user.id);
        mockListeners.forEach(listener => listener('SIGNED_IN', session));
        return { data: { session, user: session.user }, error: null };
      }
      return { data: { session: null }, error: { message: 'Kredensial tidak valid. Silakan gunakan email demo@budgeting.saas dan sandi password123.' } };
    },
    signUp: async ({ email, password, options }) => {
      const name = options?.data?.full_name || 'New Tenant';
      const session = {
        access_token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
        user: {
          id: 'tenant-uuid-' + Math.random().toString(36).substring(2),
          email,
          user_metadata: { full_name: name }
        }
      };
      setMockSession(session);
      seedMockData(session.user.id);
      mockListeners.forEach(listener => listener('SIGNED_IN', session));
      return { data: { session, user: session.user }, error: null };
    },
    signOut: async () => {
      setMockSession(null);
      mockListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },
    onAuthStateChange: (callback) => {
      mockListeners.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              mockListeners = mockListeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  },
  from: (table) => {
    const session = getMockSession();
    const userId = session?.user?.id || 'anonymous';
    const storageKey = `saas_budget_${table}_${userId}`;
    
    // Get local storage arrays
    const getItems = () => {
      const items = localStorage.getItem(storageKey);
      return items ? JSON.parse(items) : [];
    };
    
    const setItems = (items) => {
      localStorage.setItem(storageKey, JSON.stringify(items));
    };

    let data = getItems();
    let filteredData = [...data];

    const chain = {
      select: () => chain,
      insert: async (newData) => {
        const rows = Array.isArray(newData) ? newData : [newData];
        const rowsWithMeta = rows.map(r => ({
          id: r.id || 'id-' + Math.random().toString(36).substring(2),
          user_id: userId,
          created_at: new Date().toISOString(),
          ...r
        }));
        
        const allItems = [...getItems(), ...rowsWithMeta];
        setItems(allItems);
        return { data: rowsWithMeta, error: null };
      },
      delete: () => {
        // Prepare delete filter action
        return {
          eq: async (field, val) => {
            const currentItems = getItems();
            const updatedItems = currentItems.filter(item => item[field] !== val);
            setItems(updatedItems);
            return { error: null };
          }
        };
      },
      eq: (field, value) => {
        filteredData = filteredData.filter(item => item[field] === value);
        return chain;
      },
      order: (field, { ascending = true } = {}) => {
        filteredData.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
        return chain;
      },
      // Terminal execution method for supabase builders
      then: (onfulfilled) => {
        return Promise.resolve({ data: filteredData, error: null }).then(onfulfilled);
      }
    };

    return chain;
  }
};

if (isPlaceholder) {
  console.warn(
    "Supabase credentials are not configured yet. " +
    "Running in Local Mock Mode automatically using localStorage database."
  );
}

export const supabase = isPlaceholder ? mockSupabase : createClient(supabaseUrl, supabaseAnonKey);
