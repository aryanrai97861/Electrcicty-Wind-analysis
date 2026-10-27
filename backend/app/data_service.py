import sqlite3
import pandas as pd
import numpy as np
import urllib.request
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from .database import get_db_connection

logger = logging.getLogger(__name__)

class DataService:
    @staticmethod
    def get_day_ahead_dataset(start_date: str = "2026-01-01", 
                              end_date: str = "2026-01-31", 
                              cutoff_time: str = "11:00") -> pd.DataFrame:
        """
        Retrieves actuals and joins them with the latest wind forecast available
        at or before cutoff_time on D-1 for every delivery day D in [start_date, end_date].
        """
        conn = get_db_connection()
        
        # 1. Fetch actuals
        actuals_df = pd.read_sql("""
            SELECT settlementDate, settlementPeriod, startTime, generation as actual_mw, publishTime as actual_publishTime
            FROM actuals
            WHERE settlementDate BETWEEN ? AND ?
            ORDER BY settlementDate, settlementPeriod
        """, conn, params=(start_date, end_date))
        
        if actuals_df.empty:
            conn.close()
            return pd.DataFrame()
            
        actuals_df['hour_start'] = actuals_df['startTime'].str.slice(0, 14) + "00:00Z"
        
        # 2. Iterate each date and fetch corresponding latest forecast prior to cutoff
        dates = sorted(actuals_df['settlementDate'].unique())
        all_merged = []
        
        # Clean cutoff_time format
        ct = cutoff_time.strip()
        if len(ct) == 5:
            ct = ct + ":00"
            
        for d_str in dates:
            d_obj = datetime.strptime(d_str, "%Y-%m-%d")
            cutoff_dt = (d_obj - timedelta(days=1)).strftime(f"%Y-%m-%dT{ct}Z")
            
            t_start_min = f"{d_str}T00:00:00Z"
            t_start_max = f"{d_str}T23:00:00Z"
            
            fc_query = """
            WITH ranked AS (
                SELECT startTime, generation as forecast_mw, publishTime,
                       ROW_NUMBER() OVER (PARTITION BY startTime ORDER BY publishTime DESC) as rn
                FROM forecasts
                WHERE publishTime <= ?
                  AND startTime >= ? AND startTime <= ?
            )
            SELECT startTime, forecast_mw, publishTime as forecast_publishTime
            FROM ranked
            WHERE rn = 1
            """
            fc_df = pd.read_sql(fc_query, conn, params=(cutoff_dt, t_start_min, t_start_max))
            
            day_act = actuals_df[actuals_df['settlementDate'] == d_str].copy()
            day_merged = day_act.merge(fc_df, left_on='hour_start', right_on='startTime', suffixes=('', '_fc'), how='left')
            day_merged['cutoff_used'] = cutoff_dt
            all_merged.append(day_merged)
            
        conn.close()
        
        full_df = pd.concat(all_merged, ignore_index=True)
        # Drop redundant column
        if 'startTime_fc' in full_df.columns:
            full_df = full_df.drop(columns=['startTime_fc'])
            
        # Add basic error columns
        full_df['error_mw'] = full_df['forecast_mw'] - full_df['actual_mw']
        full_df['abs_error_mw'] = full_df['error_mw'].abs()
        full_df['pct_error'] = np.where(full_df['actual_mw'] > 100, 
                                        (full_df['abs_error_mw'] / full_df['actual_mw']) * 100, 
                                        np.nan)
        return full_df

    @staticmethod
    def get_multi_horizon_for_date(delivery_date: str = "2026-01-05", 
                                   cutoff_time: str = "11:00") -> List[Dict[str, Any]]:
        """
        Retrieves actuals along with multiple forecast evolutions:
        - D-2 11:00 (48h ahead)
        - Day-Ahead (D-1 cutoff)
        - Late Day-Ahead (D-1 17:00)
        - Intra-Day 4h ahead
        - Latest published before target startTime
        """
        conn = get_db_connection()
        d_obj = datetime.strptime(delivery_date, "%Y-%m-%d")
        
        ct = cutoff_time.strip()
        if len(ct) == 5:
            ct = ct + ":00"
            
        da_cutoff = (d_obj - timedelta(days=1)).strftime(f"%Y-%m-%dT{ct}Z")
        d2_cutoff = (d_obj - timedelta(days=2)).strftime("%Y-%m-%dT11:00:00Z")
        late_da_cutoff = (d_obj - timedelta(days=1)).strftime("%Y-%m-%dT17:00:00Z")
        
        # 1. Actuals for the day
        actuals_df = pd.read_sql("""
            SELECT settlementDate, settlementPeriod, startTime, generation as actual_mw
            FROM actuals
            WHERE settlementDate = ?
            ORDER BY settlementPeriod
        """, conn, params=(delivery_date,))
        
        if actuals_df.empty:
            conn.close()
            return []
            
        actuals_df['hour_start'] = actuals_df['startTime'].str.slice(0, 14) + "00:00Z"
        
        # 2. Get all forecasts targeting this date
        t_min = f"{delivery_date}T00:00:00Z"
        t_max = f"{delivery_date}T23:00:00Z"
        
        all_fc = pd.read_sql("""
            SELECT startTime, publishTime, generation as forecast_mw
            FROM forecasts
            WHERE startTime >= ? AND startTime <= ?
            ORDER BY startTime, publishTime
        """, conn, params=(t_min, t_max))
        conn.close()
        
        results = []
        for idx, row in actuals_df.iterrows():
            target_hour = row['hour_start']
            hour_fcs = all_fc[all_fc['startTime'] == target_hour]
            
            # D-2 forecast (published <= d2_cutoff)
            f_d2 = hour_fcs[hour_fcs['publishTime'] <= d2_cutoff]
            val_d2 = float(f_d2.iloc[-1]['forecast_mw']) if not f_d2.empty else None
            
            # Day-Ahead (published <= da_cutoff)
            f_da = hour_fcs[hour_fcs['publishTime'] <= da_cutoff]
            val_da = float(f_da.iloc[-1]['forecast_mw']) if not f_da.empty else None
            
            # Late Day-Ahead (published <= late_da_cutoff)
            f_late = hour_fcs[hour_fcs['publishTime'] <= late_da_cutoff]
            val_late = float(f_late.iloc[-1]['forecast_mw']) if not f_late.empty else None
            
            # Intra-Day 4h ahead (published <= target - 4h)
            try:
                target_dt = datetime.strptime(row['startTime'], "%Y-%m-%dT%H:%M:%SZ")
                id_4h_cutoff = (target_dt - timedelta(hours=4)).strftime("%Y-%m-%dT%H:%M:%SZ")
                f_id4 = hour_fcs[hour_fcs['publishTime'] <= id_4h_cutoff]
                val_id4 = float(f_id4.iloc[-1]['forecast_mw']) if not f_id4.empty else val_late
            except Exception:
                val_id4 = val_late

            # Latest forecast published before target startTime
            f_latest = hour_fcs[hour_fcs['publishTime'] <= row['startTime']]
            val_latest = float(f_latest.iloc[-1]['forecast_mw']) if not f_latest.empty else val_da
            
            # Format time label
            sp = int(row['settlementPeriod'])
            minutes_total = (sp - 1) * 30
            hours = minutes_total // 60
            mins = minutes_total % 60
            time_label = f"{hours:02d}:{mins:02d}"
            
            results.append({
                "settlementDate": row['settlementDate'],
                "settlementPeriod": sp,
                "startTime": row['startTime'],
                "timeLabel": time_label,
                "actual_mw": round(float(row['actual_mw']), 2),
                "forecast_da_mw": round(val_da, 2) if val_da is not None else None,
                "forecast_d2_mw": round(val_d2, 2) if val_d2 is not None else None,
                "forecast_late_da_mw": round(val_late, 2) if val_late is not None else None,
                "forecast_intraday_4h_mw": round(val_id4, 2) if val_id4 is not None else None,
                "forecast_latest_mw": round(val_latest, 2) if val_latest is not None else None,
                "error_da_mw": round(val_da - row['actual_mw'], 2) if val_da is not None else None,
                "is_peak": bool(33 <= sp <= 39)
            })
            
        return results

    @staticmethod
    def get_lead_time_decay_metrics() -> List[Dict[str, Any]]:
        """
        Calculates forecast error decay across standard lead times for all January 2026.
        Lead times analyzed:
        - 48h ahead (D-2 11:00)
        - 24h ahead (Day-Ahead D-1 11:00)
        - 17h ahead (Late Day-Ahead D-1 17:00)
        - 6h ahead (Intra-Day)
        - 2h ahead (Near real-time gate closure)
        """
        conn = get_db_connection()
        cur = conn.cursor()
        
        lead_time_specs = [
            ("48 Hours Ahead (D-2 11:00)", 48, "f.publishTime <= (date(a.settlementDate, '-2 days') || 'T11:00:00Z')"),
            ("24 Hours Ahead (Day-Ahead D-1 11:00)", 24, "f.publishTime <= (date(a.settlementDate, '-1 day') || 'T11:00:00Z')"),
            ("17 Hours Ahead (Late D-1 17:00)", 17, "f.publishTime <= (date(a.settlementDate, '-1 day') || 'T17:00:00Z')"),
            ("6 Hours Ahead (Intraday)", 6, "datetime(f.publishTime) <= datetime(f.startTime, '-6 hours')"),
            ("2 Hours Ahead (Pre-Gate Closure)", 2, "datetime(f.publishTime) <= datetime(f.startTime, '-2 hours')"),
        ]
        
        metrics_list = []
        for name, horizon_h, where_cond in lead_time_specs:
            query = f"""
            WITH ranked AS (
                SELECT a.settlementDate, a.settlementPeriod, a.generation as actual_mw, f.generation as forecast_mw,
                       ROW_NUMBER() OVER (PARTITION BY a.startTime ORDER BY f.publishTime DESC) as rn
                FROM actuals a
                JOIN forecasts f ON f.startTime = (substr(a.startTime, 1, 14) || '00:00Z')
                WHERE {where_cond}
                  AND a.settlementDate BETWEEN '2026-01-01' AND '2026-01-31'
            )
            SELECT actual_mw, forecast_mw
            FROM ranked
            WHERE rn = 1
            """
            cur.execute(query)
            rows = cur.fetchall()
            if rows:
                a_arr = np.array([r[0] for r in rows if r[0] is not None and r[1] is not None])
                f_arr = np.array([r[1] for r in rows if r[0] is not None and r[1] is not None])
                if len(a_arr) > 0:
                    err = f_arr - a_arr
                    mae = float(np.mean(np.abs(err)))
                    rmse = float(np.sqrt(np.mean(err ** 2)))
                    bias = float(np.mean(err))
                    mean_a = float(np.mean(a_arr))
                    metrics_list.append({
                        "horizon_name": name,
                        "horizon_hours": horizon_h,
                        "sample_count": len(a_arr),
                        "mae": round(mae, 2),
                        "rmse": round(rmse, 2),
                        "bias": round(bias, 2),
                        "nmae_pct": round((mae / mean_a * 100) if mean_a > 0 else 0.0, 2)
                    })
        conn.close()
        return metrics_list

    @staticmethod
    def get_daily_breakdown(start_date: str = "2026-01-01", 
                            end_date: str = "2026-01-31", 
                            cutoff_time: str = "11:00") -> List[Dict[str, Any]]:
        """
        Computes day-by-day accuracy metrics for calendar view.
        """
        df = DataService.get_day_ahead_dataset(start_date, end_date, cutoff_time)
        if df.empty:
            return []
            
        daily_list = []
        for d_str, day_df in df.groupby('settlementDate'):
            act = day_df['actual_mw'].values
            fc = day_df['forecast_mw'].values
            valid = ~np.isnan(fc) & ~np.isnan(act)
            if not np.any(valid):
                continue
            
            a = act[valid]
            f = fc[valid]
            err = f - a
            abs_err = np.abs(err)
            
            mae = float(np.mean(abs_err))
            rmse = float(np.sqrt(np.mean(err ** 2)))
            bias = float(np.mean(err))
            mean_act = float(np.mean(a))
            mean_fc = float(np.mean(f))
            
            # Characterize day regime
            if mean_act > 14000:
                regime = "High Wind Event"
            elif mean_act < 6000:
                regime = "Low Wind (Calm)"
            else:
                regime = "Moderate Wind"
                
            daily_list.append({
                "date": d_str,
                "mean_actual_mw": round(mean_act, 2),
                "mean_forecast_mw": round(mean_fc, 2),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
                "bias_direction": "OVER" if bias > 0 else "UNDER",
                "max_actual_mw": round(float(np.max(a)), 2),
                "min_actual_mw": round(float(np.min(a)), 2),
                "regime": regime
            })
            
        return sorted(daily_list, key=lambda x: x['date'])

    @staticmethod
    def live_sync_elexon(settlement_date_from: str, settlement_date_to: str) -> Dict[str, Any]:
        """
        Live query directly to Elexon BMRS API endpoints to ingest recent data.
        """
        conn = get_db_connection()
        actuals_added = 0
        forecasts_added = 0
        
        # 1. Fetch FUELHH
        try:
            url_fuel = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom={settlement_date_from}&settlementDateTo={settlement_date_to}"
            req = urllib.request.Request(url_fuel, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                
            wind_items = [x for x in data if x.get('fuelType') == 'WIND']
            rows = [
                (x['startTime'], x.get('settlementDate'), x.get('settlementPeriod'), x.get('generation'), x.get('publishTime'))
                for x in wind_items if x.get('startTime')
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO actuals (startTime, settlementDate, settlementPeriod, generation, publishTime)
                VALUES (?, ?, ?, ?, ?)
            """, rows)
            actuals_added = len(rows)
        except Exception as e:
            logger.error(f"Error syncing FUELHH: {e}")

        # 2. Fetch WINDFOR
        try:
            p_from = f"{settlement_date_from}T00:00:00Z"
            p_to = f"{settlement_date_to}T23:59:59Z"
            url_wind = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom={p_from}&publishDateTimeTo={p_to}"
            req = urllib.request.Request(url_wind, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                
            rows_fc = [
                (x['startTime'], x['publishTime'], x.get('generation'))
                for x in data if x.get('startTime') and x.get('publishTime')
            ]
            conn.executemany("""
                INSERT OR REPLACE INTO forecasts (startTime, publishTime, generation)
                VALUES (?, ?, ?)
            """, rows_fc)
            forecasts_added = len(rows_fc)
        except Exception as e:
            logger.error(f"Error syncing WINDFOR: {e}")

        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "settlement_range": f"{settlement_date_from} to {settlement_date_to}",
            "actuals_ingested": actuals_added,
            "forecasts_ingested": forecasts_added
        }
