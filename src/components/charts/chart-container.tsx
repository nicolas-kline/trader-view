'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type DeepPartial,
  type ChartOptions,
  type AreaSeriesPartialOptions,
  type CandlestickSeriesPartialOptions,
  type HistogramSeriesPartialOptions,
  type AreaData,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';

export const DARK_THEME: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#9ca3af',
  },
  grid: {
    vertLines: { color: '#1f2937' },
    horzLines: { color: '#1f2937' },
  },
  rightPriceScale: { borderColor: '#374151' },
  timeScale: { borderColor: '#374151' },
};

type ChartType = 'area' | 'candlestick' | 'histogram';

type ChartDataMap = {
  area: AreaData<Time>[];
  candlestick: CandlestickData<Time>[];
  histogram: HistogramData<Time>[];
};

interface ChartContainerProps<T extends ChartType> {
  data: ChartDataMap[T];
  chartType: T;
  title?: string;
  height?: number;
  seriesOptions?: T extends 'area'
    ? AreaSeriesPartialOptions
    : T extends 'candlestick'
      ? CandlestickSeriesPartialOptions
      : HistogramSeriesPartialOptions;
}

export function ChartContainer<T extends ChartType>({
  data,
  chartType,
  height = 300,
  seriesOptions,
}: ChartContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const [ready, setReady] = useState(false);

  // Dynamic import and chart creation
  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;

    import('lightweight-charts').then((lc) => {
      if (disposed || !containerRef.current) return;

      const chart = lc.createChart(containerRef.current, {
        ...DARK_THEME,
        width: containerRef.current.clientWidth,
        height,
        handleScroll: { vertTouchDrag: false },
      });

      let series: ISeriesApi<SeriesType>;
      if (chartType === 'area') {
        series = chart.addSeries(lc.AreaSeries, {
          lineColor: '#22c55e',
          topColor: 'rgba(34,197,94,0.3)',
          bottomColor: 'rgba(34,197,94,0.02)',
          lineWidth: 2,
          ...(seriesOptions as AreaSeriesPartialOptions),
        });
      } else if (chartType === 'candlestick') {
        series = chart.addSeries(lc.CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          ...(seriesOptions as CandlestickSeriesPartialOptions),
        });
      } else {
        series = chart.addSeries(lc.HistogramSeries, {
          color: '#22c55e',
          ...(seriesOptions as HistogramSeriesPartialOptions),
        });
      }

      chartRef.current = chart;
      seriesRef.current = series;
      setReady(true);
    });

    return () => {
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, height]);

  // Update data when ready or data changes
  useEffect(() => {
    if (!ready || !seriesRef.current || !data.length) return;

    // lightweight-charts expects data sorted by time ascending
    seriesRef.current.setData(data as Parameters<typeof seriesRef.current.setData>[0]);
    chartRef.current?.timeScale().fitContent();
  }, [data, ready]);

  // ResizeObserver for responsiveness
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (chartRef.current && width > 0) {
          chartRef.current.applyOptions({ width });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
