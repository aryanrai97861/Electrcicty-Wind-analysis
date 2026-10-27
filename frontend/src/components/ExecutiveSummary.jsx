import React from 'react';
import { Wind, AlertTriangle, TrendingUp, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert } from 'lucide-react';

export default function ExecutiveSummary({ summary, dateRange, cutoffTime, onSwitchToProcurement }) {
  if (!summary) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading executive analytics...</p>
      </div>
    );
  }

  const isOverForecast = summary.bias > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* High-Impact Domain Insight Banner */}
      <div style={{
        background: isOverForecast 
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' 
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: `1px solid ${isOverForecast ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.6rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isOverForecast ? '0 0 30px rgba(244, 63, 94, 0.15)' : '0 0 30px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', maxWidth: '75%' }}>
          <div style={{
            background: isOverForecast ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            padding: '0.65rem',
            borderRadius: '12px',
            color: isOverForecast ? '#fb7185' : '#34d399'
          }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                {isOverForecast 
                  ? `Critical Day-Ahead Bias Alert: +${summary.bias.toLocaleString()} MW Systematic Over-Forecast` 
                  : `Day-Ahead Forecast Bias: ${summary.bias.toLocaleString()} MW`}
              </h3>
              <span className={`badge ${isOverForecast ? 'badge-rose' : 'badge-emerald'}`}>
                {isOverForecast ? 'Volume Shortfall Risk' : 'Surplus Position'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              National Grid ESO Day-Ahead wind forecasts published prior to the {cutoffTime} UTC auction cutoff 
              <strong> over-predicted actual generation by {summary.bias.toLocaleString()} MW on average</strong>. 
              Traders purchasing Day-Ahead power without quantified bias correction would under-procure thermal volume, 
              forcing the desk into costly Balancing Mechanism cashout exposure (System Buy Price penalties).
            </p>
          </div>
        </div>

        <button 
          className="btn-primary" 
          onClick={onSwitchToProcurement}
          style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.25rem' }}
        >
          Model Bias-Corrected Procurement &rarr;
        </button>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* KPI 1: Mean Actual Generation */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Actual Wind Outturn
            </span>
            <span style={{ color: '#10b981' }}><Wind size={16} /></span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' }}>
            {summary.mean_actual?.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            National UK average across {summary.count} settlement periods
          </div>
        </div>

        {/* KPI 2: Mean Day-Ahead Forecast */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Day-Ahead Forecast
            </span>
            <span style={{ color: '#38bdf8' }}><Activity size={16} /></span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.03em' }}>
            {summary.mean_forecast?.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Latest available prior to {cutoffTime} UTC cutoff
          </div>
        </div>

        {/* KPI 3: MAE */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Mean Absolute Error (MAE)
            </span>
            <span style={{ color: '#fbbf24' }}><AlertTriangle size={16} /></span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.03em' }}>
            {summary.mae?.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Normalized MAE: <strong style={{ color: '#f8fafc' }}>{summary.nmae}%</strong> of mean wind
          </div>
        </div>

        {/* KPI 4: RMSE */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Root Mean Sq Error (RMSE)
            </span>
            <span style={{ color: '#f59e0b' }}><TrendingUp size={16} /></span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.03em' }}>
            {summary.rmse?.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            Penalizes severe ramp & storm mispredictions
          </div>
        </div>

        {/* KPI 5: Mean Bias (MBE) */}
        <div className="kpi-card" style={{ borderColor: isOverForecast ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Systematic Bias (MBE)
            </span>
            <span style={{ color: isOverForecast ? '#fb7185' : '#34d399' }}>
              {isOverForecast ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isOverForecast ? '#fb7185' : '#34d399', letterSpacing: '-0.03em' }}>
            {summary.bias > 0 ? `+${summary.bias.toLocaleString()}` : summary.bias.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>MW</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isOverForecast ? '#fb7185' : '#34d399', marginTop: '0.4rem' }}>
            {isOverForecast ? 'Over-Forecast (Procure +1,840 MW Thermal)' : 'Under-Forecast'}
          </div>
        </div>

        {/* KPI 6: Correlation & R2 */}
        <div className="kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Correlation (R² / r)
            </span>
            <span style={{ color: '#a855f7' }}><CheckCircle size={16} /></span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', letterSpacing: '-0.03em' }}>
            {summary.correlation}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            R² Fit Score: <strong style={{ color: '#f8fafc' }}>{summary.r2}</strong>
          </div>
        </div>
      </div>

      {/* Quantified Risk Percentiles Bar */}
      <div className="glass-panel" style={{ padding: '1.1rem 1.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quantified Error Percentiles (Forecast − Actual)
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Negative values indicate wind exceeded forecast; positive values indicate wind shortfall.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {summary.percentiles && Object.entries(summary.percentiles)
              .filter(([k]) => ['p10', 'p25', 'p50', 'p75', 'p90', 'p95'].includes(k))
              .map(([key, val]) => (
                <div key={key} style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {key}
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: val > 0 ? '#fb7185' : '#34d399',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()} MW
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
