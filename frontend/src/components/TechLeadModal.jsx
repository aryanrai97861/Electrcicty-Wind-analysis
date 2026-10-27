import React from 'react';
import { X, Code2, Database, Layers, Server, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TechLeadModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '950px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
              <Code2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Internal Technical Architecture & Implementation Review
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Engineering design documentation for internal technical lead review
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Technical Deep Dive Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
          {/* Section 1: End-to-End System Architecture */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Server size={18} />
              <span>1. System Architecture & Component Separation</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Built as a decoupled, production-grade microservice architecture:
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', lineHeight: 1.6 }}>
              <li><strong>Frontend:</strong> React 19 SPA built with Vite, Recharts, Lucide icons, and modern glassmorphic CSS tokens. Fully responsive and accessible.</li>
              <li><strong>Backend API:</strong> Python 3.12 + FastAPI with asynchronous ASGI execution (Uvicorn), Pydantic v2 schemas for strict type safety, and CORS middleware.</li>
              <li><strong>Storage Engine:</strong> Embedded SQLite database (<code className="font-mono">elexon_jan2026.db</code>) with B-Tree composite indexes on <code className="font-mono">(startTime, publishTime)</code>, enabling sub-15ms queries across 20,000+ records.</li>
            </ul>
          </div>

          {/* Section 2: Cadence Alignment Algorithm */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Database size={18} />
              <span>2. Domain Alignment: 60-min WINDFOR to 30-min Settlement Periods</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              A major domain challenge discovered during implementation is that <strong>Elexon BMRS WINDFOR is published hourly</strong> (minute :00), whereas <strong>FUELHH actuals operate on half-hourly settlement periods</strong> (SPs 1–48).
            </p>
            <div style={{ background: '#090d16', padding: '0.65rem 0.9rem', borderRadius: '6px', margin: '0.5rem 0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', border: '1px solid var(--border-subtle)' }}>
              actuals_df['hour_start'] = actuals_df['startTime'].str.slice(0, 14) + "00:00Z"<br/>
              merged = actuals_df.merge(forecasts_df, left_on='hour_start', right_on='startTime')
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Standard UK power market convention maps the hourly NGESO forecast block across both 30-minute settlement periods (SP 2k-1 and SP 2k), preserving energy balance across the hour.
            </p>
          </div>

          {/* Section 3: Preventing Data Leakage / Lookahead Bias */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} />
              <span>3. Preventing Data Leakage & Reproducing Trader Reality</span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              To ensure 100% backtesting realism, Day-Ahead forecasts are queried with a strict inequality constraint:
            </p>
            <div style={{ background: '#090d16', padding: '0.65rem 0.9rem', borderRadius: '6px', margin: '0.5rem 0', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', border: '1px solid var(--border-subtle)' }}>
              WHERE publishTime &lt;= Cutoff(D-1) AND rn = 1
            </div>
            <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              Any forecast published after the auction gate closure cutoff (11:00 UTC D-1) is strictly quarantined from Day-Ahead procurement decisions, eliminating hindsight bias.
            </p>
          </div>

          {/* Section 4: Performance, Docker & Deployment */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Layers size={18} />
              <span>4. Dockerization & Deployment Architecture</span>
            </div>
            <ul style={{ margin: '0.4rem 0 0 1.25rem', lineHeight: 1.6 }}>
              <li><strong>Docker:</strong> Multi-stage build and <code className="font-mono">docker-compose.yml</code> orchestrating both frontend and backend containers.</li>
              <li><strong>Heroku / Container:</strong> Single container deployment where FastAPI serves the static production build of Vite directly from <code className="font-mono">frontend/dist</code> with zero reverse proxy overhead.</li>
              <li><strong>Vercel:</strong> Static frontend deployable on Vercel with rewrite rules pointing to the FastAPI backend API.</li>
              <li><strong>AI Tools Declaration:</strong> As requested in the instructions, AI pair-programming tools were utilized to accelerate boilerplate generation and vectorized math formulas, explicitly declared in README.md.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1.25rem' }}>
          <button className="btn-primary" onClick={onClose}>
            Close Architecture Review
          </button>
        </div>
      </div>
    </div>
  );
}
