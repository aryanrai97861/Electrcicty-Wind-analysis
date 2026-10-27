import React from 'react';
import { Wind, Zap, Clock, Calendar, RefreshCw, Presentation, Code2, AlertTriangle } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  dateRange,
  setDateRange,
  cutoffTime,
  setCutoffTime,
  health,
  onOpenPitch,
  onOpenTechLead,
  onSync,
  isSyncing
}) {
  const quickDatePresets = [
    { label: 'Jan 2026 Delivery Days (Jan 1 - 31)', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Jan Purchase Decisions (Delivery Jan 2 - Feb 1)', start: '2026-01-02', end: '2026-02-01' },
    { label: 'Jan 1 - 7 (Week 1)', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Jan 8 - 14 (Week 2)', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Jan 15 - 21 (Week 3)', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Jan 22 - 31 (Week 4)', start: '2026-01-22', end: '2026-01-31' },
  ];

  return (
    <header className="app-header">
      {/* Top Brand & Metadata Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 50%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <Wind size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                AURA <span style={{ color: '#38bdf8' }}>PowerDesk UK</span>
              </h1>
              <span className="badge badge-cyan">Day-Ahead Wholesale Suite</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              UK Renewable Generation Forecasting & Day-Ahead Thermal Procurement Decision Support
            </p>
          </div>
        </div>

        {/* Right Status & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {/* Live Data Status Indicator */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.78rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>Elexon BMRS:</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>
              {health?.actuals_count ? `${health.actuals_count.toLocaleString()} Actuals | ${health.forecasts_count?.toLocaleString()} Forecasts` : 'Connecting...'}
            </span>
          </div>

          <button 
            className="btn-secondary" 
            onClick={onSync}
            disabled={isSyncing}
            title="Sync latest live data from Elexon BMRS"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Live Sync'}
          </button>

          <button 
            className="btn-primary" 
            onClick={onOpenPitch}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            <Presentation size={15} />
            Client Pitch Deck
          </button>

          <button 
            className="btn-secondary" 
            onClick={onOpenTechLead}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            <Code2 size={15} />
            Tech Lead Review
          </button>
        </div>
      </div>

      {/* Control Bar: Date Range, Cutoff, and Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button 
            className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Wind size={16} />
            Executive Overview & Error Metrics
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'procurement' ? 'active' : ''}`}
            onClick={() => setActiveTab('procurement')}
          >
            <Zap size={16} />
            Thermal Procurement Workbench
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'diurnal' ? 'active' : ''}`}
            onClick={() => setActiveTab('diurnal')}
          >
            <Clock size={16} />
            Settlement Period Profile (SP 1-48)
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === 'leadtime' ? 'active' : ''}`}
            onClick={() => setActiveTab('leadtime')}
          >
            <Calendar size={16} />
            Lead-Time Evolution (D-2 to D-0)
          </button>
        </div>

        {/* Global Controls: Date Selection & Cutoff Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Date Presets Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={14} color="#94a3b8" />
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
              value={`${dateRange.start}:${dateRange.end}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split(':');
                setDateRange({ start, end });
              }}
            >
              {quickDatePresets.map((p) => (
                <option key={p.label} value={`${p.start}:${p.end}`} style={{ background: '#0f172a', color: '#fff' }}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Decision Cut-Off Time Selector (Day-Ahead Gate Closure) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Clock size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>D-1 Cutoff:</span>
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 700,
                outline: 'none',
                cursor: 'pointer'
              }}
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
            >
              <option value="09:00" style={{ background: '#0f172a', color: '#fff' }}>09:00 UTC (Early Auction Prep)</option>
              <option value="11:00" style={{ background: '#0f172a', color: '#fff' }}>11:00 UTC (GB Gate Closure)</option>
              <option value="12:00" style={{ background: '#0f172a', color: '#fff' }}>12:00 UTC (Post-Auction Fix)</option>
              <option value="14:00" style={{ background: '#0f172a', color: '#fff' }}>14:00 UTC (Afternoon Re-bid)</option>
              <option value="17:00" style={{ background: '#0f172a', color: '#fff' }}>17:00 UTC (Late Day-Ahead)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
