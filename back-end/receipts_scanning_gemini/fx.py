import requests
from datetime import datetime, timedelta

def rate_to_cad(currency: str, on_date_iso: str | None, max_back_days: int = 365) -> float:
    """
    ALWAYS returns a float and NEVER raises.
    Strategy:
      - Try exact day (via window) then progressively widen backwards
      - If still nothing, use Bank of Canada "recent=1" (latest available)
      - If currency unsupported or still nothing, return 1.0
    """
    currency = (currency or "").upper().strip()
    if currency in ("", "CAD"):
        return 1.0

    series = f"FX{currency}CAD"
    url = f"https://www.bankofcanada.ca/valet/observations/{series}/json"

    def fetch(params: dict) -> list:
        try:
            r = requests.get(url, params=params, timeout=10)
            r.raise_for_status()
            return (r.json().get("observations") or [])
        except Exception:
            return []

    # 1) If we have a date, search backwards up to max_back_days
    if on_date_iso:
        try:
            end_date = datetime.strptime(on_date_iso, "%Y-%m-%d").date()
        except Exception:
            end_date = None

        if end_date:
            # progressively widen window: 0d, 7d, 30d, 90d, 180d, 365d (or max_back_days)
            windows = [0, 7, 30, 90, 180, max_back_days]
            for back in windows:
                start_date = end_date - timedelta(days=back)
                obs = fetch({
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                })
                if obs:
                    # take the last available in the window
                    last = obs[-1]
                    try:
                        return float(last[series]["v"])
                    except Exception:
                        pass

    # 2) Fallback: latest available rate overall (Bank of Canada supports recent=1)
    obs = fetch({"recent": 1})
    if obs:
        last = obs[-1]
        try:
            return float(last[series]["v"])
        except Exception:
            return 1.0

    # 3) Last resort: never crash
    return 1.0
