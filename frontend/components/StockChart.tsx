'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { createChart, IChartApi, UTCTimestamp, ColorType } from 'lightweight-charts';
import type { Candle } from './types';

export default function StockChart({ candles }: { candles: Candle[] }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const seriesData = useMemo(() => {
    return candles
      .map((c) => ({
        time: (Math.floor(new Date(c.time).getTime() / 1000) as UTCTimestamp),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .sort((a, b) => a.time - b.time);
  }, [candles]);

  const volumeData = useMemo(() => {
    return candles
      .map((c) => ({
        time: (Math.floor(new Date(c.time).getTime() / 1000) as UTCTimestamp),
        value: c.volume ?? 0,
        color: c.close >= c.open
          ? 'rgba(16, 185, 129, 0.3)'
          : 'rgba(239, 68, 68, 0.3)',
      }))
      .sort((a, b) => a.time - b.time);
  }, [candles]);

  useEffect(() => {
    if (!elRef.current) return;

    const chart = createChart(elRef.current, {
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(200, 210, 230, 0.7)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(99, 130, 191, 0.06)' },
        horzLines: { color: 'rgba(99, 130, 191, 0.06)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(99, 130, 191, 0.12)',
      },
      rightPriceScale: {
        borderColor: 'rgba(99, 130, 191, 0.12)',
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          labelBackgroundColor: '#3b82f6',
        },
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candleSeries.setData(seriesData);

    // Volume histogram
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    const onResize = () => {
      if (!elRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: elRef.current.clientWidth });
    };
    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [seriesData, volumeData]);

  return <div ref={elRef} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />;
}
