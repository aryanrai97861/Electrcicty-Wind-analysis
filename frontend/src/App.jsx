import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ExecutiveSummary from './components/ExecutiveSummary';
import ForecastVsActualChart from './components/ForecastVsActualChart';
import ProcurementCalculator from './components/ProcurementCalculator';
import SettlementPeriodProfile from './components/SettlementPeriodProfile';
import LeadTimeEvolution from './components/LeadTimeEvolution';
import ClientPitchModal from './components/ClientPitchModal';
import TechLeadModal from './components/TechLeadModal';

import {
  fetchHealth,
  fetchSummary,
  fetchTimeseries,
  fetchSettlementPeriods,
  fetchDailyMetrics,
  syncElexon
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '2026-01-01', end: '2026-01-31' });
  const [cutoffTime, setCutoffTime] = useState('11:00');

  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [spData, setSpData] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [techLeadOpen, setTechLeadOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadHealth();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, cutoffTime]);

  const loadHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      console.error('Health check error:', e);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, tsRes, spRes, dailyRes] = await Promise.all([
        fetchSummary(dateRange.start, dateRange.end, cutoffTime),
        fetchTimeseries(
          dateRange.start, 
          // For timeseries line, if full month is chosen, default to first 7 days for readability
          dateRange.start === '2026-01-01' && dateRange.end === '2026-01-31' ? '2026-01-07' : dateRange.end, 
          cutoffTime
        ),
        fetchSettlementPeriods(dateRange.start, dateRange.end, cutoffTime),
        fetchDailyMetrics(dateRange.start, dateRange.end, cutoffTime)
      ]);

      setSummary(sumRes);
      setTimeseries(tsRes);
      setSpData(spRes);
      setDailyMetrics(dailyRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncElexon(dateRange.start, dateRange.end);
      await loadHealth();
      await loadDashboardData();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dateRange={dateRange}
        setDateRange={setDateRange}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        health={health}
        onOpenPitch={() => setPitchOpen(true)}
        onOpenTechLead={() => setTechLeadOpen(true)}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {/* Loading Indicator */}
        {loading && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            zIndex: 100,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            fontSize: '0.82rem',
            color: '#38bdf8'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', animation: 'ping 1s infinite' }} />
            Recalculating error models...
          </div>
        )}

        {/* Tab 1: Executive Overview & Accuracy Metrics */}
        {activeTab === 'overview' && (
          <div>
            <ExecutiveSummary 
              summary={summary} 
              dateRange={dateRange} 
              cutoffTime={cutoffTime} 
              onSwitchToProcurement={() => setActiveTab('procurement')}
            />

            <ForecastVsActualChart 
              timeseriesData={timeseries} 
              cutoffTime={cutoffTime} 
            />

            {/* Daily Metrics Calendar Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Day-by-Day Forecast Accuracy Performance (January 2026)
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                    Comparing error magnitudes across high wind storm events vs calm periods.
                  </p>
                </div>
                <span className="badge badge-cyan">{dailyMetrics.length} Days Evaluated</span>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mean Actual</th>
                    <th>Day-Ahead Forecast</th>
                    <th>MAE (MW)</th>
                    <th>RMSE (MW)</th>
                    <th>Mean Bias</th>
                    <th>Peak Generation</th>
                    <th>Wind Regime</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMetrics.slice(0, 10).map((day) => (
                    <tr key={day.date}>
                      <td style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                        {day.date}
                      </td>
                      <td>{day.mean_actual_mw?.toLocaleString()} MW</td>
                      <td style={{ color: '#38bdf8' }}>{day.mean_forecast_mw?.toLocaleString()} MW</td>
                      <td style={{ color: '#fbbf24', fontWeight: 600 }}>{day.mae?.toLocaleString()} MW</td>
                      <td>{day.rmse?.toLocaleString()} MW</td>
                      <td style={{
                        color: day.bias > 0 ? '#fb7185' : '#34d399',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 600
                      }}>
                        {day.bias > 0 ? `+${day.bias}` : day.bias} MW
                      </td>
                      <td>{day.max_actual_mw?.toLocaleString()} MW</td>
                      <td>
                        <span className={`badge ${
                          day.regime === 'High Wind Event' ? 'badge-cyan' : day.regime === 'Low Wind (Calm)' ? 'badge-amber' : 'badge-emerald'
                        }`}>
                          {day.regime}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Showing first 10 days of January 2026. Complete 31-day performance records stored in system database.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Day-Ahead Thermal Procurement Decision Workbench */}
        {activeTab === 'procurement' && (
          <ProcurementCalculator 
            currentDate={dateRange.start} 
            cutoffTime={cutoffTime} 
          />
        )}

        {/* Tab 3: Diurnal 48 Settlement Periods Profile */}
        {activeTab === 'diurnal' && (
          <SettlementPeriodProfile spData={spData} />
        )}

        {/* Tab 4: Multi-Horizon Lead-Time Decay */}
        {activeTab === 'leadtime' && (
          <LeadTimeEvolution cutoffTime={cutoffTime} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(8, 12, 20, 0.9)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1600px', margin: '0 auto', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>AURA PowerDesk UK</strong> • Built for UK Day-Ahead Electricity Market Procurement & Wind Forecasting
          </div>
          <div>
            Data Source: <strong style={{ color: '#38bdf8' }}>Elexon BMRS</strong> (FUELHH Actuals & WINDFOR Forecasts) • January 2026 Evaluation
          </div>
        </div>
      </footer>

      {/* Interactive Pitch Deck Modal */}
      <ClientPitchModal 
        isOpen={pitchOpen} 
        onClose={() => setPitchOpen(false)} 
      />

      {/* Technical Architecture Modal */}
      <TechLeadModal 
        isOpen={techLeadOpen} 
        onClose={() => setTechLeadOpen(false)} 
      />
    </div>
  );
}
