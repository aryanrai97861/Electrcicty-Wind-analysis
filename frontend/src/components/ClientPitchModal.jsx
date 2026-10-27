import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Presentation, Award, TrendingDown, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export default function ClientPitchModal({ isOpen, onClose }) {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Executive Pitch: Transforming Day-Ahead Power Procurement",
      subtitle: "Tailored for the UK Wholesale Energy Utility Trading Desk",
      icon: <Award size={32} color="#38bdf8" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            UK energy utilities face a high-stakes daily mandate: <strong>accurately procurement-hedging consumer electricity demand on the UK Day-Ahead wholesale market</strong> 24 hours prior to real-time physical delivery.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#38bdf8', fontSize: '0.9rem', marginBottom: '0.4rem' }}>The Operational Dilemma</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Wind generation is highly weather-dependent. To decide how much thermal/exchange power to buy at Day-Ahead gate closure (11:00 UTC D-1), traders must rely on wind generation forecasts.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#fb7185', fontSize: '0.9rem', marginBottom: '0.4rem' }}>The Cost of Inaccuracy</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Over-estimating wind means purchasing too little Day-Ahead thermal power. The resulting deficit forces the utility into the Balancing Mechanism at penalizing Cashout prices (£120–£400/MWh).
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#f8fafc' }}>AURA PowerDesk UK</strong> bridges this gap by unifying Elexon BMRS forecast feeds and delivering quantified error analytics that transform uncertain wind forecasts into optimal, risk-adjusted procurement decisions.
          </div>
        </div>
      )
    },
    {
      title: "The Empirical Discovery: The +1,840 MW Over-Forecasting Trap",
      subtitle: "Uncovering the structural bias in January 2026 Elexon data",
      icon: <ShieldAlert size={32} color="#fb7185" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Our deep analysis of all 1,488 settlement periods in January 2026 from Elexon BMRS revealed an astonishing, costly market truth:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185' }}>+1,840 MW</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Mean Over-Forecast Bias</div>
            </div>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>2,126 MW</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Mean Absolute Error (MAE)</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>0.9275</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>High Correlation (R² = 0.86)</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Because the correlation is high, traders mistakenly assume the forecast is trustworthy. However, the <strong>systematic +1,840 MW over-prediction bias</strong> means a naive desk is chronically short. Our platform automatically extracts and compensates for this bias.
          </p>
        </div>
      )
    },
    {
      title: "Our Solution: A Next-Generation Procurement Platform",
      subtitle: "Full Elexon BMRS integration, multi-horizon views, and risk modeling",
      icon: <Cpu size={32} color="#10b981" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#38bdf8', fontSize: '0.88rem', marginBottom: '0.3rem' }}>1. Exact Gate Closure Synchronization</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Pins forecast ingestion strictly to D-1 11:00 UTC (or custom desk cutoffs), ensuring zero lookahead bias and 100% operational fidelity.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#fbbf24', fontSize: '0.88rem', marginBottom: '0.3rem' }}>2. Half-Hourly Diurnal Risk Profiling</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Maps error profiles across all 48 settlement periods, isolating the high-risk UK Evening Peak (SP 33–39, 16:30–19:30 UTC).
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#10b981', fontSize: '0.88rem', marginBottom: '0.3rem' }}>3. Multi-Horizon Lead-Time Decay</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Tracks forecast convergence from D-2 to D-1 11:00, D-1 17:00, and Intra-Day, guiding secondary re-balancing trades.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ color: '#a855f7', fontSize: '0.88rem', marginBottom: '0.3rem' }}>4. Thermal Procurement Decision Engine</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Simulates net thermal procurement with Bias Correction and P10/P90 confidence buffers to minimize cashout penalty risk.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Commercial Value & ROI: Mitigating Cashout Exposure",
      subtitle: "Tangible financial savings for your trading desk",
      icon: <TrendingDown size={32} color="#fbbf24" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            For a UK Tier-1 Energy Supplier serving ~15% of national demand (~6 GW peak load):
          </p>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Daily Wind Shortfall (without correction):</span>
              <strong style={{ color: '#fb7185' }}>~276 MW continuous (~6,624 MWh/day)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Average Balancing Cashout Spread (SBP vs DAM):</span>
              <strong style={{ color: '#fbbf24' }}>£35 / MWh spread</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>Estimated Monthly Avoided Imbalance Penalty:</span>
              <strong style={{ color: '#34d399', fontSize: '1.15rem' }}>£6.9M / month</strong>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            By moving from naive point-forecast purchasing to our quantified bias-adjusted strategy, your trading desk pays standard Day-Ahead wholesale rates rather than distress Cashout prices.
          </p>
        </div>
      )
    },
    {
      title: "Delivery, Architecture & Immediate Next Steps",
      subtitle: "Turnkey software deployment with extensible roadmap",
      icon: <CheckCircle size={32} color="#34d399" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            Version 1.0 of AURA PowerDesk UK is fully delivered, tested, and ready for immediate deployment:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#f8fafc' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Full React 19 Frontend + High-Performance FastAPI Python Backend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#f8fafc' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Self-contained SQLite Cache with 1,488 Actuals & 19,856 Forecast records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#10b981' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Docker & Docker-Compose Containerized (Ready for Vercel, Heroku, AWS ECS)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#f8fafc' }}>
              <CheckCircle size={16} color="#10b981" />
              <span>Extensible Roadmap: Solar generation outturn, EPEX SPOT API automated order dispatch</span>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
              Explore Live Application &rarr;
            </button>
          </div>
        </div>
      )
    }
  ];

  const current = slides[slide];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {current.icon}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                {current.title}
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '0.2rem' }}>
                {current.subtitle}
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

        {/* Slide Body */}
        <div style={{ minHeight: '300px', marginBottom: '1.5rem' }}>
          {current.content}
        </div>

        {/* Modal Footer Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button 
            className="btn-secondary" 
            onClick={() => setSlide(Math.max(0, slide - 1))}
            disabled={slide === 0}
            style={{ opacity: slide === 0 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {slides.map((_, i) => (
              <span 
                key={i} 
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === slide ? '#38bdf8' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }} 
              />
            ))}
          </div>

          <button 
            className="btn-primary" 
            onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))}
            disabled={slide === slides.length - 1}
            style={{ opacity: slide === slides.length - 1 ? 0.4 : 1 }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
