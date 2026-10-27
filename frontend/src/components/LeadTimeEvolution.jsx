import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Calendar, ArrowDownRight, Compass, ShieldCheck } from 'lucide-react';
import { fetchMultiHorizon, fetchLeadTimeDecay } from '../services/api';

export default function LeadTimeEvolution({ cutoffTime }) {
  const [leadTimeStats, setLeadTimeStats] = useState([]);
  const [selectedDay, setSelectedDay] = useState('2026-01-05');
  const [multiHorizonData, setMultiHorizonData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeadTimeStats();
  }, []);

  useEffect(() => {
    loadMultiHorizonDay();
  }, [selectedDay, cutoffTime]);

  const loadLeadTimeStats = async () => {
    try {
      const data = await fetchLeadTimeDecay();
      setLeadTimeStats(data);
    } catch (e) {
      console.error('Failed to load lead time decay:', e);
    }
  };

  const loadMultiHorizonDay = async () => {
    try {
      setLoading(true);
      const data = await fetchMultiHorizon(selectedDay, cutoffTime);
      setMultiHorizonData(data);
    } catch (e) {
      console.error('Failed to load multi horizon data:', e);
    } finally {
      setLoading(false);
    }
  };

  const CustomHorizonTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.1rem',
          backdropFilter: 'blur(12px)',
          minWidth: '240px'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
            {d.settlementDate} • SP {d.settlementPeriod} ({d.timeLabel})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>Actual Outturn:</span>
            <strong>{d.actual_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#38bdf8' }}>Day-Ahead (D-1 11:00):</span>
            <strong>{d.forecast_da_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#818cf8' }}>D-2 11:00 (48h Ahead):</span>
            <strong>{d.forecast_d2_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#fbbf24' }}>Late Day-Ahead (D-1 17:00):</span>
            <strong>{d.forecast_late_da_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#ec4899' }}>Intraday (4h Ahead):</span>
            <strong>{d.forecast_intraday_4h_mw?.toLocaleString()} MW</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Lead-Time Error Decay Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.4rem', borderRadius: '8px', color: '#38bdf8' }}>
              <ArrowDownRight size={22} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Forecast Error Decay Across Lead Times (Horizon Analysis)
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
            How forecast accuracy improves as the delivery window approaches. Evaluating error reduction between Day-Ahead auction cutoff (24h) and real-time gate closure (2h).
          </p>
        </div>

        {/* Lead Time Table & Chart Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Decay Bar Chart */}
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeStats} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="horizon_name" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickFormatter={(val) => val.split(' (')[0]}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
                />
                <Tooltip 
                  formatter={(val, name) => [`${val.toLocaleString()} MW`, name]}
                  contentStyle={{ background: '#0d1527', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px' }}
                />
                <Bar dataKey="mae" name="Mean Absolute Error (MW)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bias" name="Mean Bias (MW)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Time Stats Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
            {leadTimeStats.map((item) => (
              <div 
                key={item.horizon_name}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {item.horizon_name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sample size: {item.sample_count?.toLocaleString()} periods
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
                    {item.mae?.toLocaleString()} MW <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MAE</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: item.bias > 0 ? '#fb7185' : '#34d399' }}>
                    Bias: {item.bias > 0 ? `+${item.bias}` : item.bias} MW ({item.nmae_pct}% NMAE)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Horizon Single-Day Time Series Drilldown */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Forecast Evolution Across Multiple Horizons (Single-Day Drilldown)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
              Observe how the forecast converges or diverges from D-2 to Day-Ahead to Intra-Day for delivery on {selectedDay}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Select Date:</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.6rem',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        <div style={{ width: '100%', height: '360px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiHorizonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              
              <XAxis 
                dataKey="timeLabel" 
                stroke="#64748b" 
                fontSize={11}
                interval={3}
                tickMargin={8}
              />
              
              <YAxis 
                stroke="#64748b" 
                fontSize={11}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
              />

              <Tooltip content={<CustomHorizonTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ paddingBottom: '10px', fontSize: '0.78rem' }} />

              {/* Actual Outturn (Benchmark truth) */}
              <Line 
                type="monotone" 
                dataKey="actual_mw" 
                name="Actual Outturn (MW)" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={false}
              />

              {/* D-1 11:00 Standard Day-Ahead */}
              <Line 
                type="monotone" 
                dataKey="forecast_da_mw" 
                name="Day-Ahead (D-1 11:00)" 
                stroke="#38bdf8" 
                strokeWidth={2.2} 
                dot={false}
              />

              {/* D-2 11:00 48h Ahead */}
              <Line 
                type="monotone" 
                dataKey="forecast_d2_mw" 
                name="D-2 Forecast (48h Ahead)" 
                stroke="#818cf8" 
                strokeWidth={1.8} 
                strokeDasharray="4 4"
                dot={false}
              />

              {/* Late Day-Ahead D-1 17:00 */}
              <Line 
                type="monotone" 
                dataKey="forecast_late_da_mw" 
                name="Late Day-Ahead (D-1 17:00)" 
                stroke="#fbbf24" 
                strokeWidth={1.8} 
                strokeDasharray="3 3"
                dot={false}
              />

              {/* Intraday 4h Ahead */}
              <Line 
                type="monotone" 
                dataKey="forecast_intraday_4h_mw" 
                name="Intraday (4h Ahead)" 
                stroke="#ec4899" 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
