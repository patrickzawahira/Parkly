import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WEEKLY_DATA = [
  { name: 'Mon', occupancy: 65, revenue: 1200 },
  { name: 'Tue', occupancy: 75, revenue: 1350 },
  { name: 'Wed', occupancy: 85, revenue: 1600 },
  { name: 'Thu', occupancy: 80, revenue: 1500 },
  { name: 'Fri', occupancy: 95, revenue: 2100 },
  { name: 'Sat', occupancy: 60, revenue: 1800 },
  { name: 'Sun', occupancy: 40, revenue: 900 },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="h-full bg-slate-50 overflow-y-auto pb-20 p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Parking Trends</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Weekly Occupancy (%)</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={WEEKLY_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="occupancy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Revenue Estimate ($)</h2>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={WEEKLY_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};