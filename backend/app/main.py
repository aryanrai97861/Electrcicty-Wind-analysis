from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any

from .database import init_db, get_db_connection
from .data_service import DataService
from .analytics import (
    compute_error_metrics, 
    calculate_settlement_period_profile,
    generate_uk_demand_profile
)
from .models import (
    ErrorMetrics, 
    SettlementPeriodRecord, 
    DailyMetricRecord, 
    TimeSeriesRecord,
    ProcurementRequest,
    ProcurementResponse,
    ProcurementPeriodResult
)

app = FastAPI(
    title="UK Day-Ahead Power Procurement & Wind Forecast Analytics",
    description="Customized platform for UK energy utility power traders buying from the Day-Ahead market using Elexon BMRS data.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite runs on 5173, backend on 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT count(*) FROM actuals")
    actuals_count = c.fetchone()[0]
    c.execute("SELECT count(*) FROM forecasts")
    forecasts_count = c.fetchone()[0]
    c.execute("SELECT min(settlementDate), max(settlementDate) FROM actuals")
    act_range = c.fetchone()
    conn.close()
    
    return {
        "status": "healthy",
        "market": "UK GB Wholesale Electricity (Elexon BMRS)",
        "datasets": ["FUELHH (Actuals)", "WINDFOR (Forecasts)"],
        "actuals_count": actuals_count,
        "forecasts_count": forecasts_count,
        "actuals_date_range": {
            "start": act_range[0] if act_range else None,
            "end": act_range[1] if act_range else None
        }
    }

@app.get("/api/summary", response_model=ErrorMetrics)
def get_summary(
    start_date: str = Query("2026-01-01", description="Start settlement date YYYY-MM-DD"),
    end_date: str = Query("2026-01-31", description="End settlement date YYYY-MM-DD"),
    cutoff_time: str = Query("11:00", description="Day-Ahead decision cutoff time on D-1 (HH:MM)")
):
    df = DataService.get_day_ahead_dataset(start_date, end_date, cutoff_time)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available for the specified range.")
    
    metrics = compute_error_metrics(df['forecast_mw'].values, df['actual_mw'].values)
    return metrics

@app.get("/api/timeseries")
def get_timeseries(
    start_date: str = Query("2026-01-01"),
    end_date: str = Query("2026-01-07"),
    cutoff_time: str = Query("11:00")
):
    df = DataService.get_day_ahead_dataset(start_date, end_date, cutoff_time)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available.")
        
    records = []
    for _, row in df.iterrows():
        sp = int(row['settlementPeriod'])
        minutes_total = (sp - 1) * 30
        hours = minutes_total // 60
        mins = minutes_total % 60
        time_label = f"{hours:02d}:{mins:02d}"
        
        act = float(row['actual_mw']) if pd.notnull(row['actual_mw']) else None
        fc = float(row['forecast_mw']) if pd.notnull(row['forecast_mw']) else None
        err = float(row['error_mw']) if pd.notnull(row['error_mw']) else None
        
        records.append({
            "settlementDate": row['settlementDate'],
            "settlementPeriod": sp,
            "startTime": row['startTime'],
            "timeLabel": f"{row['settlementDate']} {time_label}",
            "actual_mw": round(act, 2) if act is not None else None,
            "forecast_mw": round(fc, 2) if fc is not None else None,
            "error_mw": round(err, 2) if err is not None else None,
            "abs_error_mw": round(abs(err), 2) if err is not None else None,
            "is_peak": bool(33 <= sp <= 39)
        })
    return records

@app.get("/api/multi-horizon")
def get_multi_horizon(
    date: str = Query("2026-01-05", description="Delivery date YYYY-MM-DD"),
    cutoff_time: str = Query("11:00")
):
    data = DataService.get_multi_horizon_for_date(date, cutoff_time)
    if not data:
        raise HTTPException(status_code=404, detail=f"No data for date {date}")
    return data

@app.get("/api/settlement-periods", response_model=List[SettlementPeriodRecord])
def get_settlement_period_analysis(
    start_date: str = Query("2026-01-01"),
    end_date: str = Query("2026-01-31"),
    cutoff_time: str = Query("11:00")
):
    df = DataService.get_day_ahead_dataset(start_date, end_date, cutoff_time)
    if df.empty:
        raise HTTPException(status_code=404, detail="No data available.")
    return calculate_settlement_period_profile(df)

@app.get("/api/lead-time-decay")
def get_lead_time_decay():
    return DataService.get_lead_time_decay_metrics()

@app.get("/api/daily-metrics", response_model=List[DailyMetricRecord])
def get_daily_metrics(
    start_date: str = Query("2026-01-01"),
    end_date: str = Query("2026-01-31"),
    cutoff_time: str = Query("11:00")
):
    return DataService.get_daily_breakdown(start_date, end_date, cutoff_time)

@app.post("/api/procurement-calculator", response_model=ProcurementResponse)
def calculate_procurement(req: ProcurementRequest):
    """
    Simulates the Day-Ahead power procurement decision for an energy utility desk.
    Demonstrates how quantifying wind forecast error directly drives optimal thermal procurement.
    """
    df = DataService.get_day_ahead_dataset(req.date, req.date, req.cutoff_time)
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No forecast/actual data for delivery date {req.date}")
        
    # Scale demand profile
    scale = req.utility_scale_pct / 100.0
    demand_curve = generate_uk_demand_profile(scale_factor=scale)
    
    # Calculate historical January bias to use for bias correction
    jan_df = DataService.get_day_ahead_dataset("2026-01-01", "2026-01-31", req.cutoff_time)
    hist_bias = float((jan_df['forecast_mw'] - jan_df['actual_mw']).mean())
    hist_p10_err = float(np.percentile((jan_df['forecast_mw'] - jan_df['actual_mw']).dropna(), 10))
    hist_p90_err = float(np.percentile((jan_df['forecast_mw'] - jan_df['actual_mw']).dropna(), 90))
    
    periods = []
    total_demand_mwh = 0.0
    total_wind_fc_mwh = 0.0
    total_act_wind_mwh = 0.0
    total_thermal_mwh = 0.0
    total_risk_buffer_mwh = 0.0
    net_imbalance_mwh = 0.0
    
    for idx, row in df.iterrows():
        sp = int(row['settlementPeriod'])
        # 30 min = 0.5 hours for MWh conversion
        duration_h = 0.5
        
        demand_mw = float(demand_curve[sp - 1])
        # Scale national wind down to utility portfolio share (or full national if 100%)
        wind_fc_mw = float(row['forecast_mw'] * scale) if pd.notnull(row['forecast_mw']) else 0.0
        wind_act_mw = float(row['actual_mw'] * scale) if pd.notnull(row['actual_mw']) else 0.0
        
        scaled_bias = hist_bias * scale
        scaled_p90_err = hist_p90_err * scale
        
        # Determine thermal power procurement based on selected strategy
        if req.risk_strategy == "unadjusted":
            # Naive procurement: Demand - Raw Wind Forecast
            thermal_mw = max(0.0, demand_mw - wind_fc_mw)
            risk_buffer_mw = 0.0
        elif req.risk_strategy == "bias_corrected":
            # Subtract historical over-forecasting bias from wind forecast
            adjusted_wind = max(0.0, wind_fc_mw - scaled_bias)
            thermal_mw = max(0.0, demand_mw - adjusted_wind)
            risk_buffer_mw = thermal_mw - max(0.0, demand_mw - wind_fc_mw)
        elif req.risk_strategy == "conservative_p10":
            # Assume wind generates at P10 lower bound (High shortfall hedge)
            adjusted_wind = max(0.0, wind_fc_mw - scaled_p90_err)
            thermal_mw = max(0.0, demand_mw - adjusted_wind)
            risk_buffer_mw = thermal_mw - max(0.0, demand_mw - wind_fc_mw)
        else:
            thermal_mw = max(0.0, demand_mw - wind_fc_mw)
            risk_buffer_mw = 0.0
            
        # Outturn delivery: Total procured = Thermal procured + Actual wind
        total_delivered_mw = thermal_mw + wind_act_mw
        imbalance_mw = total_delivered_mw - demand_mw # positive = long (surplus), negative = short (deficit)
        
        imbalance_status = "BALANCED"
        if imbalance_mw < -20:
            imbalance_status = "SHORT (Deficit Penalty)"
        elif imbalance_mw > 20:
            imbalance_status = "LONG (Surplus Spillage)"
            
        minutes_total = (sp - 1) * 30
        time_str = f"{minutes_total // 60:02d}:{minutes_total % 60:02d}"
        
        periods.append(ProcurementPeriodResult(
            settlementPeriod=sp,
            time=time_str,
            consumer_demand_mw=round(demand_mw, 2),
            wind_forecast_mw=round(wind_fc_mw, 2),
            actual_wind_mw=round(wind_act_mw, 2),
            thermal_procured_mw=round(thermal_mw, 2),
            actual_net_imbalance_mw=round(imbalance_mw, 2),
            risk_buffer_mw=round(risk_buffer_mw, 2),
            imbalance_status=imbalance_status
        ))
        
        total_demand_mwh += demand_mw * duration_h
        total_wind_fc_mwh += wind_fc_mw * duration_h
        total_act_wind_mwh += wind_act_mw * duration_h
        total_thermal_mwh += thermal_mw * duration_h
        total_risk_buffer_mwh += risk_buffer_mw * duration_h
        net_imbalance_mwh += imbalance_mw * duration_h
        
    # Financial exposure: if net shortfall, utility pays imbalance penalty
    shortfall_mwh = sum(abs(p.actual_net_imbalance_mw * 0.5) for p in periods if p.actual_net_imbalance_mw < 0)
    financial_exposure = shortfall_mwh * req.imbalance_penalty_gbp
    
    return ProcurementResponse(
        date=req.date,
        strategy=req.risk_strategy,
        total_consumer_demand_mwh=round(total_demand_mwh, 2),
        total_wind_forecast_mwh=round(total_wind_fc_mwh, 2),
        total_actual_wind_mwh=round(total_act_wind_mwh, 2),
        total_thermal_procured_mwh=round(total_thermal_mwh, 2),
        total_risk_buffer_mwh=round(total_risk_buffer_mwh, 2),
        net_imbalance_mwh=round(net_imbalance_mwh, 2),
        estimated_imbalance_exposure_gbp=round(financial_exposure, 2),
        periods=periods
    )

@app.post("/api/sync")
def sync_data(
    start_date: str = Query("2026-01-01"),
    end_date: str = Query("2026-01-31")
):
    result = DataService.live_sync_elexon(start_date, end_date)
    return result

# Static files for production deployment
dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if dist_path.exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")
