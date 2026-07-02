import { TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Dashboard({ transactions, categories, user }) {
  // Format currency to IDR
  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Calculations
  const incomeTxs = transactions.filter(t => {
    const cat = categories.find(c => c.id === t.category_id);
    return cat?.type === 'income';
  });

  const expenseTxs = transactions.filter(t => {
    const cat = categories.find(c => c.id === t.category_id);
    return cat?.type === 'expense';
  });

  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpense;

  // Calculate expenses by category for the chart
  const expenseByCategory = {};
  categories.filter(c => c.type === 'expense').forEach(c => {
    expenseByCategory[c.id] = {
      name: c.name,
      amount: 0,
      limit: c.limit || null
    };
  });

  expenseTxs.forEach(t => {
    if (expenseByCategory[t.category_id]) {
      expenseByCategory[t.category_id].amount += Number(t.amount);
    }
  });

  const expenseData = Object.keys(expenseByCategory)
    .map((catId, index) => {
      const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#e2e8f0', '#10b981', '#f59e0b'];
      return {
        id: catId,
        name: expenseByCategory[catId].name,
        amount: expenseByCategory[catId].amount,
        limit: expenseByCategory[catId].limit,
        color: colors[index % colors.length]
      };
    })
    .filter(d => d.amount > 0);

  const totalExpenseForChart = expenseData.reduce((sum, d) => sum + d.amount, 0);

  // SVG Donut Chart calculations
  let currentAngle = 0;
  const donutData = expenseData.map(d => {
    const percentage = totalExpenseForChart > 0 ? (d.amount / totalExpenseForChart) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...d, startAngle, angle, percentage };
  });

  // Describe SVG Arc for a circle
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 3 Metric Cards Grid */}
      <div className="grid-cols-3">
        {/* Income Card */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Total Pemasukan</span>
            <TrendingUp size={20} color="var(--color-success)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--color-success)' }}>
            {formatIDR(totalIncome)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arus masuk bulan berjalan</p>
        </div>

        {/* Expense Card */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Total Pengeluaran</span>
            <TrendingDown size={20} color="var(--color-danger)" />
          </div>
          <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
            {formatIDR(totalExpense)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arus keluar bulan berjalan</p>
        </div>

        {/* Net Balance Card */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="metric-title">Saldo Bersih</span>
            <Wallet size={20} color="var(--color-brand)" />
          </div>
          <div className="metric-value" style={{ color: netBalance >= 0 ? 'var(--text-primary)' : 'var(--color-danger)' }}>
            {formatIDR(netBalance)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Selisih pemasukan - pengeluaran</p>
        </div>
      </div>

      {/* Main Dashboard Panel Split (Donut Chart & Budget Threshold Alert) */}
      <div className="grid-cols-2">
        {/* Expense Donut Chart Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribusi Pengeluaran</h3>
          
          {totalExpenseForChart === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Belum ada data pengeluaran untuk divisualisasikan.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
              {/* Donut Chart SVG */}
              <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {donutData.map((d, index) => {
                    // SVG Path for Circle slice
                    const startPercent = d.startAngle / 360;
                    const endPercent = (d.startAngle + d.angle) / 360;
                    
                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(endPercent);
                    
                    const largeArcFlag = d.percentage > 50 ? 1 : 0;
                    
                    const pathData = [
                      `M ${startX} ${startY}`,
                      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                      `L 0 0`
                    ].join(' ');
                    
                    return <path key={d.id} d={pathData} fill={d.color} />;
                  })}
                  {/* Center cutout for donut effect */}
                  <circle cx="0" cy="0" r="0.65" fill="#0f172a" />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>{formatIDR(totalExpenseForChart)}</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '150px' }}>
                {donutData.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: d.color }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({d.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Budget Limit Warnings Card */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>Limit Anggaran Bulanan</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {categories.filter(c => c.type === 'expense' && c.limit).map(c => {
              const spent = expenseByCategory[c.id]?.amount || 0;
              const limit = c.limit;
              const percent = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;
              const isWarning = spent > limit * 0.8 && spent <= limit;

              let barColor = 'var(--color-brand)';
              if (isOver) barColor = 'var(--color-danger)';
              else if (isWarning) barColor = '#f59e0b'; // orange

              return (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatIDR(spent)} / <strong style={{ color: 'var(--text-primary)' }}>{formatIDR(limit)}</strong>
                    </span>
                  </div>
                  
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${percent}%`, backgroundColor: barColor }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: isOver ? 'var(--color-danger)' : isWarning ? '#fbbf24' : 'var(--text-muted)' }}>
                      {percent.toFixed(0)}% terpakai
                    </span>
                    {isOver && (
                      <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={12} /> Melebihi Limit!
                      </span>
                    )}
                    {isWarning && (
                      <span style={{ color: '#fbbf24', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertTriangle size={12} /> Hampir Habis!
                      </span>
                    )}
                    {!isOver && !isWarning && (
                      <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> Aman
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {categories.filter(c => c.type === 'expense' && c.limit).length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                Belum ada kategori pengeluaran dengan limit anggaran yang dibuat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
