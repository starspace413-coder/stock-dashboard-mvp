from __future__ import annotations

import pandas as pd


def compute_indicators(candles: list[dict], types: list[str]) -> dict:
    """Compute basic indicators from candles.

    Input candles: [{time, open, high, low, close, volume}]
    Returns a dict of indicator series (lists aligned to candles).

    MVP supports: ma, rsi, macd.
    """

    if not candles:
        return {}

    df = pd.DataFrame(candles)
    df = df.sort_values("time")
    close = df["close"].astype(float)

    out: dict = {}

    if "ma" in types:
        for n in (5, 10, 20, 60, 120, 240):
            out[f"ma_{n}"] = close.rolling(n).mean().tolist()

    if "rsi" in types:
        n = 14
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(n).mean()
        loss = (-delta.clip(upper=0)).rolling(n).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        out[f"rsi_{n}"] = rsi.tolist()

    if "macd" in types:
        fast, slow, signal = 12, 26, 9
        ema_fast = close.ewm(span=fast, adjust=False).mean()
        ema_slow = close.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        hist = macd_line - signal_line
        key = f"macd_{fast}_{slow}_{signal}"
        out[key] = {
            "macd": macd_line.tolist(),
            "signal": signal_line.tolist(),
            "hist": hist.tolist(),
        }

    return out
