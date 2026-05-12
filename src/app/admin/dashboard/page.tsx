"use client";

import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/api/adminService';
import { 
  Users, FileText, CheckCircle2, TrendingUp, 
  BarChart3, Target, Clock, AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 128,
    totalTests: 45,
    activeAttempts: 12,
    avgScore: 74.5,
    completionRate: 88,
  });

  const chartData = [
    { name: 'Physics', value: 85 },
    { name: 'Chemistry', value: 72 },
    { name: 'Maths', value: 68 },
    { name: 'Biology', value: 91 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administrative Console</h1>
        <p className="text-muted-foreground">Global overview of platform performance and student engagement.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users className="w-5 h-5 text-blue-600" />} 
          trend="+12% this month"
          color="blue"
        />
        <StatCard 
          title="Active Tests" 
          value={stats.totalTests} 
          icon={<FileText className="w-5 h-5 text-indigo-600" />} 
          trend="8 new added"
          color="indigo"
        />
        <StatCard 
          title="Avg. Performance" 
          value={`${stats.avgScore}%`} 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          trend="+2.4% vs last week"
          color="emerald"
        />
        <StatCard 
          title="Live Attempts" 
          value={stats.activeAttempts} 
          icon={<Clock className="w-5 h-5 text-amber-600" />} 
          trend="Real-time tracking"
          color="amber"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Analytics Chart */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Engagement Trends
            </h2>
            <select className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-primary">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  cursor={{fill: '#f4f4f5'}}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health / Alerts */}
        <div className="space-y-6">
          <div className="p-8 bg-zinc-950 text-white rounded-3xl shadow-xl shadow-zinc-200 dark:shadow-none overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-6">Integrity Overview</h2>
              <div className="space-y-4">
                <IntegrityItem title="Tab Switches" count={42} severity="high" />
                <IntegrityItem title="Multiple Logins" count={5} severity="medium" />
                <IntegrityItem title="Rapid Responses" count={128} severity="low" />
              </div>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
                View All Security Logs
              </button>
            </div>
            {/* Background Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Database Ingestion</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Questions</span>
                <span className="text-sm font-bold">12,482</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Subjects</span>
                <span className="text-sm font-bold">12</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2">
                <div className="h-full bg-primary rounded-full w-3/4"></div>
              </div>
              <p className="text-[10px] text-muted-foreground">75% of ingestion capacity utilized.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </div>
      <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
        {trend}
      </p>
    </div>
  );
}

function IntegrityItem({ title, count, severity }: any) {
  const dotColor = severity === 'high' ? 'bg-red-500' : severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></div>
        <span className="text-sm font-medium opacity-80">{title}</span>
      </div>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
