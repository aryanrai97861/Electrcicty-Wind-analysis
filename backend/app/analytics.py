import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional

def compute_error_metrics(forecasts: np.ndarray, actuals: np.ndarray) -> Dict[str, Any]:
    """
    Computes rigorous quantitative error metrics for wind forecast vs actual generation.
    """
    valid_mask = ~np.isnan(forecasts) & ~np.isnan(actuals)
    f = forecasts[valid_mask]
    a = actuals[valid_mask]
    
    if len(f) == 0:
        return {
            "count": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "mbe": 0.0,
            "nmae": 0.0,
            "mape": 0.0,
            "r2": 0.0,
            "correlation": 0.0,
            "percentiles": {},
            "mean_actual": 0.0,
            "mean_forecast": 0.0
        }
    
    errors = f - a
    abs_errors = np.abs(errors)
    
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    mbe = float(np.mean(errors))
    mean_actual = float(np.mean(a))
    mean_forecast = float(np.mean(f))
    
    # Normalized MAE relative to average actual generation
    nmae = float((mae / mean_actual * 100) if mean_actual > 0 else 0.0)
    
    # MAPE filtered for actuals > 100 MW to avoid extreme division artifacts
    mape_mask = a > 100
    if np.sum(mape_mask) > 0:
        mape = float(np.mean(abs_errors[mape_mask] / a[mape_mask]) * 100)
    else:
        mape = 0.0
        
    # Correlation & R2
    if len(f) > 1 and np.std(f) > 0 and np.std(a) > 0:
        corr = float(np.corrcoef(f, a)[0, 1])
        ss_res = np.sum((a - f) ** 2)
        ss_tot = np.sum((a - mean_actual) ** 2)
        r2 = float(1 - (ss_res / ss_tot)) if ss_tot > 0 else 0.0
    else:
        corr = 1.0 if np.allclose(f, a) else 0.0
        r2 = 1.0 if np.allclose(f, a) else 0.0
        
    percentiles = {
        "p5": float(np.percentile(errors, 5)),
        "p10": float(np.percentile(errors, 10)),
        "p25": float(np.percentile(errors, 25)),
        "p50": float(np.percentile(errors, 50)),
        "p75": float(np.percentile(errors, 75)),
        "p90": float(np.percentile(errors, 90)),
        "p95": float(np.percentile(errors, 95)),
        "min": float(np.min(errors)),
        "max": float(np.max(errors))
    }
    
    return {
        "count": int(len(f)),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "mbe": round(mbe, 2),
        "bias": round(mbe, 2),
        "bias_direction": "OVER_FORECAST" if mbe > 0 else "UNDER_FORECAST",
        "nmae": round(nmae, 2),
        "mape": round(mape, 2),
        "r2": round(r2, 4),
        "correlation": round(corr, 4),
        "mean_actual": round(mean_actual, 2),
        "mean_forecast": round(mean_forecast, 2),
        "percentiles": {k: round(v, 2) for k, v in percentiles.items()}
    }

def calculate_settlement_period_profile(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Computes diurnal error and generation profiles across settlement periods (1-48).
    """
    profile = []
    for sp in range(1, 49):
        sp_data = df[df['settlementPeriod'] == sp]
        if sp_data.empty:
            continue
        
        act = sp_data['actual_mw'].values
        fc = sp_data['forecast_mw'].values
        valid = ~np.isnan(fc) & ~np.isnan(act)
        
        if not np.any(valid):
            continue
            
        a = act[valid]
        f = fc[valid]
        err = f - a
        abs_err = np.abs(err)
        
        # Calculate time string (e.g. SP 1 -> 00:00, SP 2 -> 00:30, SP 33 -> 16:00, etc.)
        minutes_total = (sp - 1) * 30
        hours = minutes_total // 60
        mins = minutes_total % 60
        time_str = f"{hours:02d}:{mins:02d}"
        
        profile.append({
            "settlementPeriod": int(sp),
            "time": time_str,
            "mean_actual": round(float(np.mean(a)), 2),
            "mean_forecast": round(float(np.mean(f)), 2),
            "mae": round(float(np.mean(abs_err)), 2),
            "rmse": round(float(np.sqrt(np.mean(err ** 2))), 2),
            "bias": round(float(np.mean(err)), 2),
            "p10_error": round(float(np.percentile(err, 10)), 2),
            "p90_error": round(float(np.percentile(err, 90)), 2),
            "is_peak": bool(33 <= sp <= 39) # 16:00 to 19:30 evening peak in UK
        })
    return profile

def calculate_lead_time_decay(lead_times: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Formats forecast lead time error progression.
    """
    return sorted(lead_times, key=lambda x: x.get('horizon_hours', 0), reverse=True)

def generate_uk_demand_profile(scale_factor: float = 1.0, base_type: str = "winter_typical") -> np.ndarray:
    """
    Generates standard UK 48 settlement period demand curve (MW).
    National winter peak averages ~38-42 GW, overnight ~22-26 GW.
    scale_factor allows modeling specific utility market share (e.g., 0.10 for 10% market share).
    """
    # 48 settlement periods base curve (approximate National GB winter profile in MW)
    gb_profile = np.array([
        23500, 22800, 22200, 21800, 21600, 21500, 21600, 22000, # SP 1-8 (00:00 - 04:00)
        23000, 25000, 28000, 31500, 34500, 36800, 37500, 37200, # SP 9-16 (04:00 - 08:00)
        36800, 36500, 36400, 36200, 36100, 36000, 35900, 35800, # SP 17-24 (08:00 - 12:00)
        35800, 36000, 36200, 36500, 37000, 37800, 38800, 40200, # SP 25-32 (12:00 - 16:00)
        41500, 41800, 41200, 40500, 39500, 38200, 36500, 34500, # SP 33-40 (16:00 - 20:00 Peak)
        32000, 29800, 27500, 26000, 24800, 24000, 23500, 23200  # SP 41-48 (20:00 - 24:00)
    ], dtype=float)
    
    return gb_profile * scale_factor
