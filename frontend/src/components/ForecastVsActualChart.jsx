import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Eye, TrendingUp, Layers, HelpCircle } from 'lucide-react';

export default function ForecastVsActualChart({ timeseriesData, cutoffTime }) {
  const [viewMode, setViewMode] = useState('both'); // 'both', 'forecast_actual', 'error_bars'
  const [showPeakHighlight, setShowPeakHighlight] = useState(true);

  if (!timeseriesData || timeseriesData.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No timeseries data loaded for this period.</p>
      </div>
    );
  }

  // Format tick labels for clean time series
  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    // If tickItem is "2026-01-05 14:00"
    const parts = tickItem.split(' ');
    if (parts.length === 2) {
      const time = parts[1];
      // Only show for 00:00, 06:00, 12:00, 18:00 to prevent crowding
      if (['00:00', '06:00', '12:00', '18:00'].includes(time)) {
        return `${parts[0].slice(5)} ${time}`;
      }
    }
    return '';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const act = data.actual_mw;
      const fc = data.forecast_mw;
      const err = data.error_mw;
      const isOver = err > 0;

      return (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.1rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
          minWidth: '220px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
            {data.settlementDate} • SP {data.settlementPeriod} ({data.timeLabel?.split(' ')[1] || ''})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#38bdf8' }}>Day-Ahead Forecast:</span>
            <strong style={{ color: '#38bdf8' }}>{fc?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#10b981' }}>Actual Outturn:</span>
            <strong style={{ color: '#10b981' }}>{act?.toLocaleString()} MW</strong>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.82rem',
            marginTop: '0.4rem',
            paddingTop: '0.3rem',
            borderTop: '1px dashed var(--border-subtle)',
            color: isOver ? '#fb7185' : '#34d399'
          }}>
            <span>Forecast Error:</span>
            <strong>{isOver ? `+${err?.toLocaleString()}` : err?.toLocaleString()} MW ({isOver ? 'Shortfall' : 'Surplus'})</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Chart Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              UK National Wind: Actual Outturn vs. Day-Ahead Forecast
            </h2>
            <span className="badge badge-cyan">{cutoffTime} UTC D-1 Gate Closure</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
            Half-hourly resolution (30-min settlement intervals). Forecast represents the latest NGESO WINDFOR submission before auction cutoff.
          </p>
        </div>

        {/* View Mode Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Lines & Error Delta
          </button>
          <button
            className={`btn-secondary ${viewMode === 'forecast_actual' ? 'active' : ''}`}
            onClick={() => setViewMode('forecast_actual')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Generation Only
          </button>
          <button
            className={`btn-secondary ${viewMode === 'error_bars' ? 'active' : ''}`}
            onClick={() => setViewMode('error_bars')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            Error Magnitude
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ width: '100%', height: '380px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeseriesData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            
            <XAxis 
              dataKey="timeLabel" 
              tickFormatter={formatXAxis} 
              stroke="#64748b" 
              fontSize={11}
              interval={0}
              tickMargin={10}
            />
            
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              domain={[0, 'auto']}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '0.8rem' }}
            />

            {/* Error Bars or Area */}
            {(viewMode === 'both' || viewMode === 'error_bars') && (
              <Bar 
                dataKey="abs_error_mw" 
                name="Forecast Absolute Error (MW)" 
                fill="#f43f5e" 
                opacity={0.3} 
                barSize={3}
              />
            )}

            {/* Actual Outturn Line */}
            {(viewMode === 'both' || viewMode === 'forecast_actual') && (
              <Area
                type="monotone"
                dataKey="actual_mw"
                name="Actual Wind Outturn (MW)"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#actualGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* Day-Ahead Forecast Line */}
            {(viewMode === 'both' || viewMode === 'forecast_actual') && (
              <Line
                type="monotone"
                dataKey="forecast_mw"
                name="Day-Ahead Forecast (MW)"
                stroke="#38bdf8"
                strokeWidth={2.2}
                strokeDasharray={viewMode === 'both' ? '4 2' : '0'}
                dot={false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Insight */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#10b981', display: 'inline-block' }} />
          <span>Actual Generation (FUELHH WIND)</span>
          <span style={{ width: '12px', height: '3px', backgroundColor: '#38bdf8', borderStyle: 'dashed', display: 'inline-block', marginLeft: '0.5rem' }} />
          <span>Day-Ahead Decision Forecast (WINDFOR)</span>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#f43f5e', opacity: 0.6, display: 'inline-block', marginLeft: '0.5rem' }} />
          <span>Forecast Error Delta (Over/Under)</span>
        </div>
        <span>Data verified from Elexon BMRS API</span>
      </div>
    </div>
  );
}
