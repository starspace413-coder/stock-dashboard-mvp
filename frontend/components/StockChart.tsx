'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createChart, IChartApi, UTCTimestamp } from 'lightweight-charts';
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
        close: c.close
      }))
      .sort((a, b) => a.time - b.time);
  }, [candles]);

  useEffect(() => {
    if (!elRef.current) return;

    const chart = createChart(elRef.current, {
      height: 360,
      layout: { background: { color: '#0b0f19' }, textColor: '#e6e8ef' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.06)' }, horzLines: { color: 'rgba(255,255,255,0.06)' } },
      timeScale: { timeVisible: true, secondsVisible: false }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626'
    });

    candleSeries.setData(seriesData);
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
  }, [seriesData]);

  return <div ref={elRef} style={{ width: '100%' }} />;
}
