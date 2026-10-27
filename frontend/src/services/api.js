// API client for UK Day-Ahead Power Procurement & Wind Forecast Analytics

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSummary(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate, cutoff_time: cutoffTime });
  const res = await fetch(`${API_BASE}/summary?${params}`);
  if (!res.ok) throw new Error(`Summary fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTimeseries(startDate = '2026-01-01', endDate = '2026-01-07', cutoffTime = '11:00') {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate, cutoff_time: cutoffTime });
  const res = await fetch(`${API_BASE}/timeseries?${params}`);
  if (!res.ok) throw new Error(`Timeseries fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMultiHorizon(date = '2026-01-05', cutoffTime = '11:00') {
  const params = new URLSearchParams({ date, cutoff_time: cutoffTime });
  const res = await fetch(`${API_BASE}/multi-horizon?${params}`);
  if (!res.ok) throw new Error(`Multi-horizon fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSettlementPeriods(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate, cutoff_time: cutoffTime });
  const res = await fetch(`${API_BASE}/settlement-periods?${params}`);
  if (!res.ok) throw new Error(`Settlement periods fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchLeadTimeDecay() {
  const res = await fetch(`${API_BASE}/lead-time-decay`);
  if (!res.ok) throw new Error(`Lead time decay fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDailyMetrics(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '11:00') {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate, cutoff_time: cutoffTime });
  const res = await fetch(`${API_BASE}/daily-metrics?${params}`);
  if (!res.ok) throw new Error(`Daily metrics fetch failed: ${res.statusText}`);
  return res.json();
}

export async function runProcurementSimulation(payload) {
  const res = await fetch(`${API_BASE}/procurement-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Procurement simulation failed: ${res.statusText}`);
  return res.json();
}

export async function syncElexon(startDate = '2026-01-01', endDate = '2026-01-31') {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  const res = await fetch(`${API_BASE}/sync?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Sync failed: ${res.statusText}`);
  return res.json();
}
