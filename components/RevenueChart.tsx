"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipContentProps,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ChartData {
  name: string;
  revenue: number;
}

function CustomTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-indigo-600 font-bold text-base">
          {(payload[0].value ?? 0).toLocaleString()} AED
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Revenue Overview</h3>
            <p className="text-xs text-slate-400">Monthly breakdown</p>
          </div>
        </div>
        <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm">No revenue data available yet.</p>
          <p className="text-xs text-slate-300">Revenue will appear here after bookings are made</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Revenue Overview</h3>
            <p className="text-xs text-slate-400">Monthly breakdown (AED)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
          Revenue (AED)
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            barSize={32}
          >
            <CartesianGrid
              strokeDasharray="0"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(v) => `${v.toLocaleString()}`}
            />
            <Tooltip
              content={CustomTooltip}
              cursor={{ fill: "#f1f5f9", radius: 8 }}
            />
            <Bar
              dataKey="revenue"
              fill="#6366f1"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
