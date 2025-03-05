import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface BarChartProps {
  data: any[];
  title?: string;
  xAxisKey: string;
  yAxisKey: string;
  barColor?: string;
  height?: number;
  width?: string | number;
  className?: string;
  tooltipFormatter?: (value: number) => string;
}

export function BarChart({
  data,
  title,
  xAxisKey,
  yAxisKey,
  barColor = "hsl(var(--primary))",
  height = 300,
  width = "100%",
  className,
  tooltipFormatter,
}: BarChartProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width={width} height={height}>
          <RechartsBarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Bar dataKey={yAxisKey} fill={barColor} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
