import { useState } from 'react';
import { PlusCircle, Search, Trash2, Calendar, DollarSign, Filter, Tag } from 'lucide-react';

export default function TransactionManager({ transactions, categories, onAddTransaction, onAddCategory, onDeleteTransaction }) {
  // Category Form State
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('expense');
  const [catLimit, setCatLimit] = useState('');

  // Transaction Form State
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCatId, setTxCatId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Format currency to IDR
  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    onAddCategory({
      name: catName,
      type: catType,
      limit: catType === 'expense' && catLimit ? Number(catLimit) : null
    });

    setCatName('');
    setCatLimit('');
  };

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    if (!txDesc.trim() || !txAmount || !txCatId) return;

    onAddTransaction({
      description: txDesc,
      amount: Number(txAmount),
      category_id: txCatId,
      transaction_date: new Date(txDate).toISOString()
    });

    setTxDesc('');
    setTxAmount('');
  };

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === '' || t.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Upper Grid: Forms */}
      <div className="grid-cols-2">
        {/* Add Category Form Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Tag size={20} color="var(--color-brand)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambah Kategori Kustom</h3>
          </div>

          <form onSubmit={handleCategorySubmit}>
            <div className="form-group">
              <label>Nama Kategori</label>
              <input
                type="text"
                className="input-control"
                placeholder="mis: Belanja Bulanan, Transport, Gaji Sampingan"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tipe Kategori</label>
                <select
                  className="input-control"
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                >
                  <option value="expense">Pengeluaran (Expense)</option>
                  <option value="income">Pemasukan (Income)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Limit Anggaran (IDR - Khusus Pengeluaran)</label>
                <input
                  type="number"
                  className="input-control"
                  placeholder="mis: 1000000"
                  disabled={catType !== 'expense'}
                  value={catLimit}
                  onChange={(e) => setCatLimit(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <PlusCircle size={16} /> Buat Kategori
            </button>
          </form>
        </div>

        {/* Add Transaction Form Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <PlusCircle size={20} color="var(--color-brand)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Catat Transaksi Baru</h3>
          </div>

          <form onSubmit={handleTransactionSubmit}>
            <div className="form-group">
              <label>Deskripsi Transaksi</label>
              <input
                type="text"
                className="input-control"
                placeholder="mis: Beli Buku Pemrograman, Makan Malam"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nominal (IDR)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '13px', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    className="input-control"
                    style={{ paddingLeft: '2.2rem' }}
                    placeholder="50000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select
                  className="input-control"
                  value={txCatId}
                  onChange={(e) => setTxCatId(e.target.value)}
                  required
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tanggal Transaksi</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  className="input-control"
                  style={{ paddingLeft: '2.2rem' }}
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Simpan Transaksi
            </button>
          </form>
        </div>
      </div>

      {/* Lower Block: History Table with Search & Filters */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Riwayat Transaksi</h3>
          
          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                placeholder="Cari deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <select
                className="input-control"
                style={{ padding: '0.5rem 1rem 0.5rem 2.2rem', fontSize: '0.85rem', minWidth: '150px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredTxs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Tidak ada transaksi yang cocok dengan kriteria filter.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Tipe</th>
                  <th>Jumlah</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map(t => {
                  const cat = categories.find(c => c.id === t.category_id);
                  const isIncome = cat?.type === 'income';

                  return (
                    <tr key={t.id}>
                      <td>{new Date(t.transaction_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td style={{ fontWeight: 500 }}>{t.description}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                          <Tag size={12} /> {cat ? cat.name : 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isIncome ? 'badge-success' : 'badge-danger'}`}>
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isIncome ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isIncome ? '+' : '-'}{formatIDR(t.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem', borderRadius: '6px' }}
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
