from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ErrorMetrics(BaseModel):
    count: int
    mae: float
    rmse: float
    mbe: float
    bias: float
    bias_direction: str
    nmae: float
    mape: float
    r2: float
    correlation: float
    mean_actual: float
    mean_forecast: float
    percentiles: Dict[str, float]

class SettlementPeriodRecord(BaseModel):
    settlementPeriod: int
    time: str
    mean_actual: float
    mean_forecast: float
    mae: float
    rmse: float
    bias: float
    p10_error: float
    p90_error: float
    is_peak: bool

class LeadTimeRecord(BaseModel):
    horizon_name: str
    horizon_hours: int
    sample_count: int
    mae: float
    rmse: float
    bias: float
    nmae_pct: float

class DailyMetricRecord(BaseModel):
    date: str
    mean_actual_mw: float
    mean_forecast_mw: float
    mae: float
    rmse: float
    bias: float
    bias_direction: str
    max_actual_mw: float
    min_actual_mw: float
    regime: str

class TimeSeriesRecord(BaseModel):
    settlementDate: str
    settlementPeriod: int
    startTime: str
    timeLabel: str
    actual_mw: float
    forecast_mw: Optional[float] = None
    error_mw: Optional[float] = None
    abs_error_mw: Optional[float] = None
    pct_error: Optional[float] = None

class ProcurementRequest(BaseModel):
    date: str = "2026-01-05"
    cutoff_time: str = "11:00"
    utility_scale_pct: float = Field(100.0, description="Percentage of GB market (100 = National GB, 10 = Tier 1 Utility)")
    peak_demand_mw: Optional[float] = Field(None, description="Custom peak demand in MW (optional)")
    risk_strategy: str = Field("bias_corrected", description="Strategy: 'unadjusted', 'bias_corrected', 'conservative_p10', 'high_confidence_p05'")
    imbalance_penalty_gbp: float = Field(120.0, description="Estimated Imbalance / System Buy Price in GBP/MWh")

class ProcurementPeriodResult(BaseModel):
    settlementPeriod: int
    time: str
    consumer_demand_mw: float
    wind_forecast_mw: float
    actual_wind_mw: float
    thermal_procured_mw: float
    actual_net_imbalance_mw: float
    risk_buffer_mw: float
    imbalance_status: str

class ProcurementResponse(BaseModel):
    date: str
    strategy: str
    total_consumer_demand_mwh: float
    total_wind_forecast_mwh: float
    total_actual_wind_mwh: float
    total_thermal_procured_mwh: float
    total_risk_buffer_mwh: float
    net_imbalance_mwh: float
    estimated_imbalance_exposure_gbp: float
    periods: List[ProcurementPeriodResult]
