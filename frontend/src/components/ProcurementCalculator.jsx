import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Zap, ShieldCheck, AlertCircle, DollarSign, ArrowRight, Settings, Check, HelpCircle } from 'lucide-react';
import { runProcurementSimulation } from '../services/api';

export default function ProcurementCalculator({ currentDate = '2026-01-05', cutoffTime = '11:00' }) {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [utilityScale, setUtilityScale] = useState(15.0); // 15% Tier-1 supplier
  const [strategy, setStrategy] = useState('bias_corrected'); // 'unadjusted', 'bias_corrected', 'conservative_p10'
  const [cashoutPrice, setCashoutPrice] = useState(120.0); // £120/MWh
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    fetchSimulation();
  }, [selectedDate, utilityScale, strategy, cashoutPrice, cutoffTime]);

  const fetchSimulation = async () => {
    try {
      setLoading(true);
      const res = await runProcurementSimulation({
        date: selectedDate,
        cutoff_time: cutoffTime,
        utility_scale_pct: utilityScale,
        risk_strategy: strategy,
        imbalance_penalty_gbp: cashoutPrice
      });
      setSimulation(res);
    } catch (err) {
      console.error('Procurement simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const scalePresets = [
    { label: 'GB National Grid (100%)', value: 100.0 },
    { label: 'Tier-1 UK Supplier (15%)', value: 15.0 },
    { label: 'Mid-Tier Supplier (5%)', value: 5.0 },
    { label: 'Independent Retailer (1%)', value: 1.0 },
  ];

  const strategyDescriptions = {
    unadjusted: {
      title: 'Naive Point Forecast (High Imbalance Risk)',
      desc: 'Buys Thermal = Demand − Raw Wind Forecast. Ignores forecast error. Vulnerable to severe shortfall and penalizing Balancing Mechanism cashout prices.',
      badgeClass: 'badge-rose'
    },
    bias_corrected: {
      title: 'Quantified Bias-Corrected Procurement (Recommended)',
      desc: 'Adjusts wind forecast downward by historical over-forecasting bias (+1,840 MW nationally scaled). Eliminates structural deficit.',
      badgeClass: 'badge-cyan'
    },
    conservative_p10: {
      title: 'Conservative P10 Hedging (90% Confidence Buffer)',
      desc: 'Procures thermal power assuming wind generation performs at the 10th percentile worst-case scenario. Complete protection against deficit penalties.',
      badgeClass: 'badge-emerald'
    }
  };

  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.1rem',
          backdropFilter: 'blur(12px)',
          minWidth: '240px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
            SP {p.settlementPeriod} ({p.time}) • {selectedDate}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#cbd5e1' }}>Consumer Demand:</span>
            <strong>{p.consumer_demand_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#38bdf8' }}>Wind Forecast:</span>
            <strong>{p.wind_forecast_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#fbbf24' }}>Thermal Procured:</span>
            <strong style={{ color: '#fbbf24' }}>{p.thermal_procured_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
            <span style={{ color: '#10b981' }}>Actual Wind Outturn:</span>
            <strong>{p.actual_wind_mw?.toLocaleString()} MW</strong>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            marginTop: '0.4rem',
            paddingTop: '0.3rem',
            borderTop: '1px dashed var(--border-subtle)',
            color: p.actual_net_imbalance_mw < 0 ? '#fb7185' : '#34d399'
          }}>
            <span>Physical Imbalance:</span>
            <strong>{p.actual_net_imbalance_mw > 0 ? `+${p.actual_net_imbalance_mw}` : p.actual_net_imbalance_mw} MW</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Workbench Header & Parameter Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.2)',
                padding: '0.4rem',
                borderRadius: '8px',
                color: '#fbbf24'
              }}>
                <Zap size={22} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Day-Ahead Thermal Power Procurement Decision Workbench
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.3rem' }}>
              Simulate wholesale power purchases across all 48 settlement periods. Directly observe how adjusting for quantified wind forecast error protects against costly Balancing Mechanism cashout exposure.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Delivery Day:</label>
              <input
                type="date"
                min="2026-01-01"
                max="2026-01-31"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
        </div>

        {/* Control Sliders & Selectors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          {/* 1. Utility Scale */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                Utility Portfolio Scale
              </label>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                {utilityScale}% of GB Grid
              </span>
            </div>
            <select
              value={utilityScale}
              onChange={(e) => setUtilityScale(parseFloat(e.target.value))}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {scalePresets.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Peak Demand: ~{Math.round(41800 * (utilityScale / 100)).toLocaleString()} MW
            </div>
          </div>

          {/* 2. Procurement Strategy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                Procurement Decision Strategy
              </label>
              <span className={`badge ${strategyDescriptions[strategy].badgeClass}`}>
                {strategy}
              </span>
            </div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 0.75rem',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="unadjusted">1. Naive (Demand − Wind Forecast)</option>
              <option value="bias_corrected">2. Quantified Bias-Corrected (Recommended)</option>
              <option value="conservative_p10">3. Conservative P10 Hedging (90% Conf.)</option>
            </select>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {strategyDescriptions[strategy].desc}
            </div>
          </div>

          {/* 3. Cashout Price / SBP Scenario */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                Imbalance Cashout Penalty (System Buy Price)
              </label>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
                £{cashoutPrice}/MWh
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="350"
              step="10"
              value={cashoutPrice}
              onChange={(e) => setCashoutPrice(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              <span>£50 (Off-peak)</span>
              <span>£120 (Winter Avg)</span>
              <span>£350 (Peak Stress)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Simulation Results */}
      {simulation && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          {/* Total Demand */}
          <div className="kpi-card">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Consumer Demand
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.3rem' }}>
              {Math.round(simulation.total_consumer_demand_mwh)?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MWh</span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              24-hour total energy requirement
            </div>
          </div>

          {/* Expected Wind vs Delivered */}
          <div className="kpi-card">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Wind Contribution
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.3rem' }}>
              {Math.round(simulation.total_actual_wind_mwh)?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MWh</span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Forecast: {Math.round(simulation.total_wind_forecast_mwh)?.toLocaleString()} MWh
            </div>
          </div>

          {/* Required Thermal Procurement */}
          <div className="kpi-card">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Day-Ahead Thermal Procured
            </span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.3rem' }}>
              {Math.round(simulation.total_thermal_procured_mwh)?.toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MWh</span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Includes {Math.round(simulation.total_risk_buffer_mwh)?.toLocaleString()} MWh risk buffer
            </div>
          </div>

          {/* Imbalance Financial Exposure */}
          <div className="kpi-card" style={{
            borderColor: simulation.estimated_imbalance_exposure_gbp > 5000 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)',
            boxShadow: simulation.estimated_imbalance_exposure_gbp > 5000 ? '0 0 20px rgba(244, 63, 94, 0.15)' : 'none'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Imbalance Shortfall Cost
            </span>
            <div style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: simulation.estimated_imbalance_exposure_gbp > 0 ? '#fb7185' : '#34d399',
              marginTop: '0.3rem'
            }}>
              £{Math.round(simulation.estimated_imbalance_exposure_gbp)?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {simulation.estimated_imbalance_exposure_gbp === 0 
                ? 'Zero deficit penalty exposure!' 
                : `@ £${cashoutPrice}/MWh System Buy Price`}
            </div>
          </div>
        </div>
      )}

      {/* Procurement Composition Chart */}
      {simulation && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Hourly Generation Stack: Demand Matching & Procurement Mix
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                Comparing consumer electricity load vs renewable wind contribution and thermal procurement required.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#38bdf8', borderRadius: '2px' }} />
                Wind Outturn
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#fbbf24', borderRadius: '2px' }} />
                Thermal Procured
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: '12px', height: '3px', backgroundColor: '#f43f5e' }} />
                Consumer Demand
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simulation.periods} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  fontSize={11}
                  interval={3}
                  tickMargin={8}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k MW`}
                />
                <Tooltip content={<CustomChartTooltip />} />

                {/* Wind Generation Contribution (Bottom of stack) */}
                <Area 
                  type="monotone" 
                  dataKey="actual_wind_mw" 
                  stackId="1" 
                  name="Wind Actual Outturn (MW)" 
                  fill="#0284c7" 
                  stroke="#38bdf8" 
                  fillOpacity={0.65} 
                />

                {/* Thermal Power Procured (Stacked on top of Wind) */}
                <Area 
                  type="monotone" 
                  dataKey="thermal_procured_mw" 
                  stackId="1" 
                  name="Thermal Procured Day-Ahead (MW)" 
                  fill="#d97706" 
                  stroke="#fbbf24" 
                  fillOpacity={0.7} 
                />

                {/* Consumer Demand Target Line */}
                <Line 
                  type="monotone" 
                  dataKey="consumer_demand_mw" 
                  name="Consumer Load (MW)" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Half-Hour Settlement Period Schedule Table */}
      {simulation && (
        <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.8rem' }}>
            Day-Ahead Settlement Schedule (48 Half-Hour Periods for {selectedDate})
          </h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>SP</th>
                <th>Time (UTC)</th>
                <th>Consumer Demand</th>
                <th>Wind Forecast</th>
                <th>Actual Wind</th>
                <th>Thermal Procured</th>
                <th>Net Imbalance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {simulation.periods.slice(0, 16).map((p) => (
                <tr key={p.settlementPeriod}>
                  <td style={{ fontWeight: 700, color: '#f8fafc' }}>{p.settlementPeriod}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.time}</td>
                  <td>{p.consumer_demand_mw?.toLocaleString()} MW</td>
                  <td style={{ color: '#38bdf8' }}>{p.wind_forecast_mw?.toLocaleString()} MW</td>
                  <td style={{ color: '#10b981' }}>{p.actual_wind_mw?.toLocaleString()} MW</td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>{p.thermal_procured_mw?.toLocaleString()} MW</td>
                  <td style={{
                    color: p.actual_net_imbalance_mw < 0 ? '#fb7185' : '#34d399',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600
                  }}>
                    {p.actual_net_imbalance_mw > 0 ? `+${p.actual_net_imbalance_mw}` : p.actual_net_imbalance_mw} MW
                  </td>
                  <td>
                    <span className={`badge ${
                      p.actual_net_imbalance_mw < -20 ? 'badge-rose' : p.actual_net_imbalance_mw > 20 ? 'badge-amber' : 'badge-emerald'
                    }`}>
                      {p.imbalance_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing first 16 periods. Full 48 half-hour schedule is processed and fed into trading order books.
          </div>
        </div>
      )}
    </div>
  );
}
