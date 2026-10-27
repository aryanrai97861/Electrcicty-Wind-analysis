import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import { Clock, AlertTriangle, TrendingUp, Sun, Moon } from 'lucide-react';

export default function SettlementPeriodProfile({ spData }) {
  if (!spData || spData.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading settlement period profile...</p>
      </div>
    );
  }

  // Find peak error settlement periods
  const highestMaeSP = [...spData].sort((a, b) => b.mae - a.mae)[0];
  const highestBiasSP = [...spData].sort((a, b) => b.bias - a.bias)[0];

  const CustomSPTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.1rem',
          backdropFilter: 'blur(12px)',
          minWidth: '220px'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
            SP {d.settlementPeriod} ({d.time} UTC) {d.is_peak && <span className="badge badge-amber" style={{ marginLeft: '0.4rem' }}>Peak Period</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#38bdf8' }}>Mean Forecast:</span>
            <strong>{d.mean_forecast?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#10b981' }}>Mean Actual:</span>
            <strong>{d.mean_actual?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#fbbf24' }}>MAE:</span>
            <strong>{d.mae?.toLocaleString()} MW</strong>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.78rem',
            marginTop: '0.35rem',
            paddingTop: '0.3rem',
            borderTop: '1px dashed var(--border-subtle)',
            color: d.bias > 0 ? '#fb7185' : '#34d399'
          }}>
            <span>Mean Bias:</span>
            <strong>{d.bias > 0 ? `+${d.bias}` : d.bias} MW</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Diurnal Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ color: '#fbbf24' }}><Clock size={18} /></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
              Highest Error Period
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>
            SP {highestMaeSP?.settlementPeriod} ({highestMaeSP?.time} UTC)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            MAE: <strong>{highestMaeSP?.mae?.toLocaleString()} MW</strong> ({highestMaeSP?.is_peak ? 'Evening Peak Window' : 'Daytime'})
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ color: '#fb7185' }}><AlertTriangle size={18} /></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
              Maximum Over-Forecast Bias
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fb7185' }}>
            SP {highestBiasSP?.settlementPeriod} ({highestBiasSP?.time} UTC)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Over-forecast bias: <strong>+{highestBiasSP?.bias?.toLocaleString()} MW</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ color: '#38bdf8' }}><TrendingUp size={18} /></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
              Evening Peak Risk (SP 33-39)
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
            16:30 – 19:30 UTC
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            High-value periods with peak UK power prices & steep imbalance penalties
          </div>
        </div>
      </div>

      {/* 48 Settlement Periods Profile Chart */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Diurnal Settlement Period Error & Generation Profile (SP 1 – 48)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
              Half-hourly outturn generation vs Day-Ahead forecast and Mean Absolute Error across January 2026.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '2px' }} />
              Forecast MW
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px' }} />
              Actual MW
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#f43f5e' }} />
              MAE Error (MW)
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={spData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={11}
                interval={3}
                tickMargin={8}
              />
              
              <YAxis 
                yAxisId="left"
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
              />

              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#fb7185" 
                fontSize={11}
                tickFormatter={(v) => `${v} MW`}
              />

              <Tooltip content={<CustomSPTooltip />} />

              {/* Forecast MW Bar */}
              <Bar 
                yAxisId="left"
                dataKey="mean_forecast" 
                name="Mean Forecast (MW)" 
                fill="#0284c7" 
                opacity={0.65} 
                barSize={10}
              />

              {/* Actual MW Bar */}
              <Bar 
                yAxisId="left"
                dataKey="mean_actual" 
                name="Mean Actual (MW)" 
                fill="#10b981" 
                opacity={0.7} 
                barSize={10}
              />

              {/* MAE Line */}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="mae" 
                name="MAE (MW)" 
                stroke="#fb7185" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#fb7185' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
