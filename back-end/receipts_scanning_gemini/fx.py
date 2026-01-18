import requests
from datetime import datetime, timedelta

def rate_to_cad(currency: str, on_date_iso: str | None, max_back_days: int = 365) -> float:
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

    # if we have a date, search 
    if on_date_iso:
        try:
            end_date = datetime.strptime(on_date_iso, "%Y-%m-%d").date()
        except Exception:
            end_date = None

        if end_date:
            # progressively bigger places to search
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

    # fallback
    obs = fetch({"recent": 1})
    if obs:
        last = obs[-1]
        try:
            return float(last[series]["v"])
        except Exception:
            return 1.0

    return 1.0
