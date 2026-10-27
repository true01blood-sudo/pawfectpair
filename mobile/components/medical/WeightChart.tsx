/**
 * Chart evoluție greutate — implementat cu react-native-svg (fără victory-native,
 * care necesită React 19 + Skia, incompatibil cu Expo SDK 52 / React 18).
 * Linie + puncte + gridline-uri; auto-scale pe min/max cu 10% margin.
 */
import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../theme-provider';
import { Card } from '../ui/Card';
import type { WeightLog } from '@pawfectpair/shared';
import { formatDateShortRO } from '@pawfectpair/shared';

interface WeightChartProps {
  logs: WeightLog[];
}

const PAD = { top: 14, right: 14, bottom: 30, left: 40 };
const CHART_HEIGHT = 220;

export function WeightChart({ logs }: WeightChartProps) {
  const t = useAppTheme();
  const { width: screenW } = useWindowDimensions();

  const width = Math.max(280, Math.min(screenW - 48, 640));
  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const geometry = useMemo(() => {
    const sorted = [...logs].sort(
      (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
    );
    if (sorted.length < 2) return null;

    const ys = sorted.map((l) => l.weight_kg);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (yMax - yMin < 1) {
      // variație mică — extinde simetric pentru lizibilitate
      const mid = (yMax + yMin) / 2;
      yMin = mid - 0.6;
      yMax = mid + 0.6;
    }
    const marginY = (yMax - yMin) * 0.1;
    yMin -= marginY;
    yMax += marginY;

    const xAt = (i: number) => PAD.left + (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW);
    const yAt = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    const points = sorted.map((l, i) => ({
      x: xAt(i),
      y: yAt(l.weight_kg),
      log: l,
    }));

    const gridVals = [0, 0.5, 1].map((f) => yMin + f * (yMax - yMin));

    return { points, gridVals, yMin, yMax, first: sorted[0], last: sorted[sorted.length - 1] };
  }, [logs, plotH, plotW]);

  if (!geometry) {
    return (
      <Card>
        <Text style={{ color: t.colors.textMuted, textAlign: 'center' }}>
          Adaugă cel puțin 2 cântăriri pentru a vedea evoluția.
        </Text>
      </Card>
    );
  }

  const { points, gridVals } = geometry;
  const lineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Card style={{ padding: t.spacing.xs, height: CHART_HEIGHT + 16 }}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* gridlines + etichete Y */}
        {gridVals.map((v, i) => {
          const y = PAD.top + (i / (gridVals.length - 1)) * plotH;
          return (
            <React.Fragment key={`grid-${i}`}>
              <Line
                x1={PAD.left}
                y1={y}
                x2={width - PAD.right}
                y2={y}
                stroke={t.colors.border}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText x={PAD.left - 6} y={y + 4} fontSize={10} fill={t.colors.textMuted} textAnchor="end">
                {v.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* linia evoluției */}
        <Polyline
          points={lineStr}
          fill="none"
          stroke={t.colors.primary}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* punctele */}
        {points.map((p, i) => (
          <Circle
            key={`pt-${i}`}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill={t.colors.accent}
            stroke={t.colors.primary}
            strokeWidth={2}
          />
        ))}

        {/* etichete X — prima și ultima cântărire */}
        <SvgText x={points[0].x} y={CHART_HEIGHT - 8} fontSize={10} fill={t.colors.textMuted} textAnchor="middle">
          {formatDateShortRO(points[0].log.measured_at)}
        </SvgText>
        <SvgText
          x={points[points.length - 1].x}
          y={CHART_HEIGHT - 8}
          fontSize={10}
          fill={t.colors.textMuted}
          textAnchor="middle"
        >
          {formatDateShortRO(points[points.length - 1].log.measured_at)}
        </SvgText>
      </Svg>
    </Card>
  );
}
