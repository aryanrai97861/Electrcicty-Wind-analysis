# AURA PowerDesk UK
### UK Day-Ahead Electricity Market Procurement & Renewable Wind Forecast Analytics Suite

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)
[![Elexon BMRS](https://img.shields.io/badge/Data-Elexon_BMRS-0284c7.svg?style=flat)](https://bmrs.elexon.co.uk)

A customized, production-grade decision workbench built for **UK Energy Utility Power Traders** responsible for procurement hedging on the **UK Day-Ahead Wholesale Electricity Market** (EPEX SPOT / N2EX) using real-time and historical **Elexon BMRS** generation streams (`FUELHH` actuals and `WINDFOR` forecasts).

---

## Table of Contents
1. [Product Pitch to the Client](#1-product-pitch-to-the-client)
   - [The Operational Challenge](#the-operational-challenge)
   - [The Empirical Discovery: The +1,840 MW Over-Forecasting Trap](#the-empirical-discovery-the-1840-mw-over-forecasting-trap)
   - [Commercial ROI & Penalty Mitigation](#commercial-roi--penalty-mitigation)
   - [Core Platform Capabilities](#core-platform-capabilities)
2. [Software Design & Technical Lead Review](#2-software-design--technical-lead-review)
   - [High-Level Architecture](#high-level-architecture)
   - [Domain Engineering: Cadence Alignment (60-min to 30-min SP)](#domain-engineering-cadence-alignment-60-min-to-30-min-sp)
   - [Zero Data Leakage: Reproducing Trader Cutoff Reality](#zero-data-leakage-reproducing-trader-cutoff-reality)
   - [Lead-Time Error Decay Optimization](#lead-time-error-decay-optimization)
   - [Thermal Procurement Decision Formulations](#thermal-procurement-decision-formulations)
   - [Database Schema & Performance Indexing](#database-schema--performance-indexing)
   - [Backend API Specifications](#backend-api-specifications)
3. [AI Tools Usage Disclosure](#3-ai-tools-usage-disclosure)
4. [Getting Started & Local Setup](#4-getting-started--local-setup)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup-python-fastapi)
   - [Frontend Setup](#frontend-setup-react--vite)
   - [Running Automated Tests](#running-automated-tests)
   - [Data Ingestion Utility](#data-ingestion-utility)

---

## 1. Product Pitch to the Client

### The Operational Challenge
Every morning prior to the **11:00 UTC Day-Ahead Auction Gate Closure** (D-1), power traders at UK energy utilities face a critical commercial decision: **How many Megawatt-hours (MWh) of electricity must be purchased to serve tomorrow's (delivery day D) consumer demand?**

```
                       UK DAY-AHEAD PROCUREMENT TIMELINE
 
   D-1 09:00 UTC         D-1 11:00 UTC           D-1 12:00 UTC             Day D (SP 1–48)
   Early Prep & Run      Auction Cutoff          Auction Results           Physical Delivery
   Forecast Ingestion    (EPEX / N2EX)           Published                 & Cashout Settlement
 ─────────●────────────────────●───────────────────────●───────────────────────────●────────▶
          │                    │
          └── AURA PowerDesk ──┘
              Quantifies Forecast Error
              & Determines Optimal Thermal
              Procurement Stack
```

Because renewable wind power has zero fuel cost, utilities rely on wind generation to meet consumer load first. However, wind generation is weather-dependent and volatile. To avoid severe imbalances, utilities must purchase supplemental electricity—primarily from **thermal dispatch plants (CCGT) and wholesale power exchanges**—one full day before physical delivery.

If the utility relies naively on wind forecasts without quantifying forecast error, any wind deficit leaves the supplier **physically short in real-time**. The UK System Operator (National Grid ESO) automatically settles deficits via the **Balancing Mechanism at penalizing Cashout prices (System Buy Price / SBP, often £120–£400/MWh)**.

---

### The Empirical Discovery: The +1,840 MW Over-Forecasting Trap
Analyzing all **1,488 settlement periods in January 2026** directly from Elexon BMRS data reveals a stark, costly market reality:

| Metric | January 2026 Value | Commercial Interpretation |
| :--- | :---: | :--- |
| **National Mean Actual Wind** | **13,296.8 MW** | Baseline outturn generation across Great Britain |
| **Day-Ahead Mean Forecast** | **15,137.1 MW** | Latest forecast published prior to D-1 11:00 UTC |
| **Systematic Mean Bias (MBE)** | **+1,840.3 MW** | **Chronic, structural over-forecasting across January** |
| **Mean Absolute Error (MAE)** | **2,126.1 MW** | Average magnitude of forecast deviation per settlement period |
| **Root Mean Sq Error (RMSE)** | **2,620.8 MW** | Penalizes severe ramp events and storm mispredictions |
| **Normalized MAE (NMAE)** | **15.99%** | Error normalized as percentage of mean wind generation |
| **Correlation ($r$) / $R^2$** | **0.9275 / 0.8601** | High statistical correlation masking a massive volumetric bias |

> [!WARNING]
> **The Trader's Illusion**: Because the Pearson correlation between the forecast and actual outturn is exceptionally high ($r = 0.9275$), an unadjusted trading desk might assume the forecast is highly reliable. However, the **+1,840 MW systematic positive bias** means that on average, **1.84 GW of expected wind never materializes**. A naive desk that procures `Thermal = Demand − Wind Forecast` will be **chronically short by hundreds of MW every hour**.

---

### Commercial ROI & Penalty Mitigation
For a typical **Tier-1 UK Energy Supplier** serving ~15% of the national consumer load (~6 GW peak demand):

* **Daily Wind Shortfall (Unadjusted)**: $\approx 276\text{ MW continuous shortfall} = 6,624\text{ MWh/day}$
* **Balancing Cashout Spread ($\Delta$ Cashout vs DAM)**: $\approx £35/\text{MWh}$ premium paid on distress imbalance
* **Avoidable Monthly Financial Loss**:
  $$\text{Monthly Avoidable Loss} = 6,624\text{ MWh/day} \times 31\text{ days} \times £35/\text{MWh} \approx \mathbf{£7,187,040}$$

By utilizing **AURA PowerDesk UK's Quantified Bias-Correction & Confidence Buffering**, the trading desk automatically purchases the requisite thermal volume during the liquid Day-Ahead auction at standard wholesale rates, **eliminating over £7.1M in cashout penalty penalties in a single winter month**.

---

### Core Platform Capabilities
1. **D-1 Gate Closure Synchronization**: Strict inequality query filtering allows traders to test auction cutoffs (09:00, 11:00, 12:00, 14:00, 17:00 UTC) with zero lookahead bias.
2. **Thermal Procurement Decision Workbench**:
   - Interactive simulation across all 48 settlement periods.
   - Three dynamic risk strategies:
     - *Strategy 1 (Naive)*: $\text{Thermal} = \max(0, \text{Demand} - \text{Forecast})$.
     - *Strategy 2 (Quantified Bias-Corrected)*: $\text{Thermal} = \max(0, \text{Demand} - (\text{Forecast} - \text{Bias}))$.
     - *Strategy 3 (Conservative P10 Hedging)*: $\text{Thermal} = \max(0, \text{Demand} - (\text{Forecast} - \text{P90 Error}))$.
   - Adjustable supplier portfolio scaling (1% Independent Retailer to 100% National Grid).
   - Real-time Cashout Exposure calculator (£/MWh penalty sensitivity slider).
3. **Diurnal 48 Settlement Periods Profile**: Half-hourly mapping identifying that forecast errors peak during the critical **UK Evening Peak (SPs 33–39, 16:30–19:30 UTC)** when electricity prices are highest.
4. **Multi-Horizon Lead-Time Decay**: Tracks forecast convergence from D-2 (48h ahead) to D-1 11:00, D-1 17:00, and Intra-Day (6h and 2h pre-gate closure), providing quantitative guidance for secondary intra-day re-balancing.

---

## 2. Software Design & Technical Lead Review

### High-Level Architecture
AURA PowerDesk UK is architected as a high-throughput, decoupled application designed for reliability and sub-second analytical response times:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 SPA Frontend (Vite)                         │
│  - Recharts Visualizations    - Glassmorphic CSS Token System          │
│  - 4 Dynamic Workbench Tabs   - Interactive Client & Tech Modals       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FastAPI Python Backend (ASGI / Uvicorn)              │
│  - RESTful Endpoints          - Pydantic v2 Type Schemas               │
│  - High-Speed Query Planner   - Vectorized Analytics (NumPy / Pandas)  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│ Embedded SQLite Database Engine     │  │ Elexon BMRS Live Sync Stream  │
│ - elexon_jan2026.db (4 MB)          │  │ - FUELHH (Half-hourly Wind)   │
│ - 1,536 Actuals (Jan 1 - Feb 1)     │  │ - WINDFOR (Forecast Revisions)│
│ - 19,856 Forecast Revisions         │  │ - REST API v1 Client          │
│ - B-Tree Composite Indexes          │  └───────────────────────────────┘
└─────────────────────────────────────┘
```

---

### Domain Engineering: Cadence Alignment (60-min to 30-min SP)
A critical domain challenge in the UK power market is that **Elexon BMRS WINDFOR is published at 60-minute resolution** (hour-beginning `:00`), whereas **FUELHH actuals are reported at 30-minute settlement period resolution** (SPs 1–48).

* **Settlement Period 1**: `00:00:00Z` to `00:30:00Z`
* **Settlement Period 2**: `00:30:00Z` to `01:00:00Z`
* **WINDFOR Forecast**: Target time `00:00:00Z` (valid for the full hour `00:00`–`01:00`)

**Alignment Algorithm**:
```python
# Strip minute:second to hourly boundary
actuals_df['hour_start'] = actuals_df['startTime'].str.slice(0, 14) + "00:00Z"

# Join hourly forecast block to both half-hourly settlement periods (SP 2k-1 and SP 2k)
merged_df = actuals_df.merge(
    forecasts_df,
    left_on='hour_start',
    right_on='startTime',
    how='left'
)
```
This maps the NGESO hourly energy forecast block across both settlement periods, preserving exact volumetric consistency without interpolation artifacts.

---

### Zero Data Leakage: Reproducing Trader Cutoff Reality
To prevent lookahead bias (hindsight leakage), the system enforces strict temporal inequality constraints. For any delivery day $D$:

$$\text{Forecast Cutoff} = (D - 1\text{ day})\text{ at Cutoff Time (e.g. 11:00:00Z)}$$

```sql
WITH ranked AS (
    SELECT startTime, generation AS forecast_mw, publishTime,
           ROW_NUMBER() OVER (PARTITION BY startTime ORDER BY publishTime DESC) AS rn
    FROM forecasts
    WHERE publishTime <= :cutoff_timestamp
      AND startTime >= :delivery_start AND startTime <= :delivery_end
)
SELECT startTime, forecast_mw, publishTime
FROM ranked
WHERE rn = 1;
```
Any forecast revision published at `11:01 UTC` or later on D-1 is strictly quarantined from the Day-Ahead decision model.

---

### Lead-Time Error Decay Optimization
Initial iterations using row-by-row DataFrame filtering required ~16 seconds to evaluate all 1,488 settlement periods across 5 lead-time horizons. 

We replaced this with **SQLite Window Functions (`ROW_NUMBER() OVER`)** leveraging B-Tree composite indexes on `(startTime, publishTime)`:

```sql
WITH ranked AS (
    SELECT a.settlementDate, a.generation AS actual_mw, f.generation AS forecast_mw,
           ROW_NUMBER() OVER (PARTITION BY a.startTime ORDER BY f.publishTime DESC) AS rn
    FROM actuals a
    JOIN forecasts f ON f.startTime = (substr(a.startTime, 1, 14) || '00:00Z')
    WHERE datetime(f.publishTime) <= datetime(f.startTime, '-6 hours')
      AND a.settlementDate BETWEEN '2026-01-01' AND '2026-01-31'
)
SELECT actual_mw, forecast_mw FROM ranked WHERE rn = 1;
```
**Optimization Result**: Reduced computation time from **15.88s to 0.16s (98.9% latency reduction)**.

#### Quantified Error Decay Across Lead Times (January 2026):
| Horizon | Horizon Hours | Sample Count | MAE (MW) | RMSE (MW) | Mean Bias (MW) | NMAE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **48h Ahead (D-2 11:00)** | 48h | 1,364 | 2,552.79 | 3,097.05 | +1,990.04 | 19.34% |
| **24h Ahead (Day-Ahead D-1 11:00)** | 24h | 1,488 | 2,126.12 | 2,620.80 | +1,840.30 | 15.99% |
| **17h Ahead (Late D-1 17:00)** | 17h | 1,488 | 1,984.49 | 2,447.58 | +1,816.90 | 14.92% |
| **6h Ahead (Intraday)** | 6h | 1,488 | 1,884.86 | 2,362.02 | +1,683.60 | 14.18% |
| **2h Ahead (Pre-Gate Closure)** | 2h | 1,488 | 1,825.07 | 2,322.31 | +1,609.11 | 13.73% |

Forecast accuracy exhibits monotonic convergence toward delivery, with MAE improving by **727.72 MW (28.5%)** between D-2 and final gate closure.

---

### Thermal Procurement Decision Formulations
For each half-hour settlement period $i \in \{1, \dots, 48\}$, given utility demand $D_i$ and scaled wind forecast $\hat{W}_i$:

1. **Naive Procurement**:
   $$P^{\text{thermal}}_i = \max(0, D_i - \hat{W}_i)$$

2. **Bias-Corrected Procurement**:
   $$P^{\text{thermal}}_i = \max(0, D_i - \max(0, \hat{W}_i - \text{Bias}))$$
   $$\text{Risk Buffer}_i = P^{\text{thermal}}_i - \max(0, D_i - \hat{W}_i)$$

3. **Conservative P10 Hedging**:
   $$P^{\text{thermal}}_i = \max(0, D_i - \max(0, \hat{W}_i - \Delta_{\text{P90 Error}}))$$

4. **Outturn Imbalance & Cashout Penalty**:
   $$I_i = (P^{\text{thermal}}_i + W^{\text{actual}}_i) - D_i \quad (\text{MW})$$
   $$\text{Shortfall Exposure (£)} = \sum_{i, I_i < 0} (|I_i| \times 0.5\text{ h}) \times \text{Cashout Price (£/MWh)}$$

---

### Database Schema & Performance Indexing
Located at `backend/elexon_jan2026.db`:
```sql
CREATE TABLE actuals (
    startTime TEXT PRIMARY KEY,
    settlementDate TEXT,
    settlementPeriod INTEGER,
    generation REAL,
    publishTime TEXT
);

CREATE TABLE forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT,
    publishTime TEXT,
    generation REAL,
    UNIQUE(startTime, publishTime)
);

CREATE INDEX idx_forecast_start ON forecasts(startTime);
CREATE INDEX idx_forecast_pub ON forecasts(publishTime);
CREATE INDEX idx_actual_start ON actuals(startTime);
CREATE INDEX idx_actual_date ON actuals(settlementDate);
```

---

### Backend API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, database record counts, and date range verification |
| `GET` | `/api/summary` | Full-month or filtered MAE, RMSE, MBE, MAPE, $R^2$, and P5–P95 percentiles |
| `GET` | `/api/timeseries` | Half-hourly actual vs forecast time-series with error bars |
| `GET` | `/api/settlement-periods` | Diurnal profile across all 48 settlement periods with peak tags |
| `GET` | `/api/daily-metrics` | Day-by-day performance calendar with weather regime classification |
| `GET` | `/api/lead-time-decay` | 5-horizon error progression metrics (48h down to 2h) |
| `GET` | `/api/multi-horizon` | Multi-horizon evolution curves for a single delivery date |
| `POST` | `/api/procurement-calculator`| Simulates thermal procurement, physical imbalance, and cashout exposure |
| `POST` | `/api/sync` | On-demand live fetch directly from Elexon BMRS API streams |

---

## 3. AI Tools Usage Disclosure

In compliance with the project guidelines (*"You are free to use AI tools to assist with building this application (please mention it explicitly in the README if you’ve used AI tools)"*), this project utilized AI pair-programming assistants (Google Gemini 3.8 / Antigravity AI agent) for:
- Accelerating initial API exploration and drafting Elexon stream JSON ingestion logic.
- Generating boilerplate Pydantic schemas and FastAPI endpoint decorators.
- Crafting responsive CSS styling tokens and Recharts custom tooltips.
- Optimizing SQL window function queries and authoring unit test assertions.

All domain modeling, cadence alignment algorithms, financial imbalance calculations, and architectural validation were manually verified for mathematical and operational correctness.

---

## 4. Getting Started & Local Setup

### Prerequisites
- **Python**: 3.11+ (tested on Python 3.12)
- **Node.js**: v18+ (tested on v20 / v22)
- **Package Managers**: `pip` and `npm`

---

### Backend Setup (Python FastAPI)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Access interactive Swagger API documentation at:
   [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Frontend Setup (React + Vite)

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server (with preconfigured API proxy to port 8000):
   ```bash
   npm run dev
   ```

4. Open your browser at:
   [http://localhost:5173](http://localhost:5173)

---

### Running Automated Tests
A comprehensive test suite is provided to verify data integrity, absence of lookahead bias, and analytical formula accuracy:

```bash
python -m unittest backend/test_suite.py
```

Expected output:
```
.....
----------------------------------------------------------------------
Ran 5 tests in 0.378s

OK
```

---

### Data Ingestion Utility
The database (`backend/elexon_jan2026.db`) comes **pre-populated with all January 2026 actuals and forecasts**. If you wish to refresh or re-sync data directly from the live Elexon BMRS API:

```bash
# Ingest both actuals and forecasts:
python backend/ingest_data.py --all

# Or ingest actuals alone:
python backend/ingest_data.py --actuals

# Or ingest forecasts alone:
python backend/ingest_data.py --forecasts
```

Alternatively, use the **Live Sync** button directly in the web application header.

---

### Repository Structure
```
.
├── README.md                   # Complete Client Pitch & Technical Lead Review
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── analytics.py        # Error metrics, diurnal profiles, UK demand model
│   │   ├── data_service.py     # SQL query planner, gate closure alignment, decay
│   │   ├── database.py         # SQLite connection & schema initialization
│   │   ├── main.py             # FastAPI routing, middleware, procurement calculator
│   │   └── models.py           # Pydantic v2 data models & request/response schemas
│   ├── elexon_jan2026.db       # Embedded database with 1,536 actuals & 19,856 forecasts
│   ├── ingest_data.py          # Unified Elexon BMRS stream ingestion script
│   ├── requirements.txt        # Python dependency manifest
│   └── test_suite.py           # Automated unit tests for data integrity & algorithms
└── frontend/
    ├── dist/                   # Production-ready static build
    ├── index.html              # HTML5 entry point with customized metadata
    ├── package.json            # Node.js dependencies
    ├── vite.config.js          # Vite configuration with API proxy
    └── src/
        ├── App.jsx             # Main dashboard container & state coordinator
        ├── index.css           # Premium glassmorphic design system & color tokens
        ├── main.jsx            # React root mount
        ├── components/
        │   ├── ClientPitchModal.jsx         # 5-Slide interactive client pitch deck
        │   ├── ExecutiveSummary.jsx         # KPI metric cards & bias alert banner
        │   ├── ForecastVsActualChart.jsx    # Interactive timeseries line & delta chart
        │   ├── Header.jsx                   # Sticky navigation, cutoff & date selectors
        │   ├── LeadTimeEvolution.jsx        # Multi-horizon error decay & single-day drilldown
        │   ├── ProcurementCalculator.jsx    # Thermal procurement decision workbench
        │   ├── SettlementPeriodProfile.jsx  # 48 Settlement periods diurnal analysis
        │   └── TechLeadModal.jsx            # In-app technical architecture review modal
        └── services/
            └── api.js                       # Frontend REST API client
```
