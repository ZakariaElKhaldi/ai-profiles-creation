import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Mock data for demonstration
const mockModels = [
  { id: 'model1', name: 'GPT-3.5 Turbo', totalCalls: 1287, avgResponseTime: 2.4, totalTokens: 145870 },
  { id: 'model2', name: 'Gemini Pro', totalCalls: 932, avgResponseTime: 1.8, totalTokens: 98420 },
  { id: 'model3', name: 'Claude Instant', totalCalls: 753, avgResponseTime: 2.1, totalTokens: 82650 },
];

const mockTimeSeries = [
  { date: '2023-08-01', calls: 42, tokens: 4350 },
  { date: '2023-08-02', calls: 56, tokens: 5840 },
  { date: '2023-08-03', calls: 38, tokens: 3920 },
  { date: '2023-08-04', calls: 61, tokens: 6320 },
  { date: '2023-08-05', calls: 47, tokens: 4980 },
  { date: '2023-08-06', calls: 52, tokens: 5430 },
  { date: '2023-08-07', calls: 64, tokens: 6780 },
];

export default function MetricsPage() {
  const { availableModels } = useApp();
  const [timeRange, setTimeRange] = useState('7d');
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Performance Metrics</h1>
        
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1 rounded-lg text-sm ${timeRange === '7d' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={`px-3 py-1 rounded-lg text-sm ${timeRange === '30d' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={`px-3 py-1 rounded-lg text-sm ${timeRange === '90d' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total API Calls</h2>
          <p className="text-3xl font-bold">2,972</p>
          <p className="text-sm text-zinc-400 mt-1">+18% from last period</p>
        </div>
        
        <div className="bg-zinc-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Average Response Time</h2>
          <p className="text-3xl font-bold">2.1s</p>
          <p className="text-sm text-zinc-400 mt-1">-0.3s from last period</p>
        </div>
        
        <div className="bg-zinc-900 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Tokens Used</h2>
          <p className="text-3xl font-bold">326,940</p>
          <p className="text-sm text-zinc-400 mt-1">+22% from last period</p>
        </div>
      </div>
      
      {/* Usage Chart (Mock) */}
      <div className="bg-zinc-900 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
        <div className="bg-zinc-800 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-zinc-400">API Calls and Token Usage</span>
              <span className="text-xs text-zinc-400">{timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}</span>
            </div>
            
            {/* Simple mock chart visualization */}
            <div className="flex-1 flex items-end">
              {mockTimeSeries.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-5/6 bg-blue-600 rounded-t" 
                    style={{ height: `${day.calls * 100 / 70}%` }}
                  ></div>
                  <span className="text-xs text-zinc-500 mt-1">{day.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Model Comparison */}
      <div className="bg-zinc-900 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Model Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4">Model</th>
                <th className="text-right py-3 px-4">API Calls</th>
                <th className="text-right py-3 px-4">Avg. Response Time</th>
                <th className="text-right py-3 px-4">Total Tokens</th>
                <th className="text-right py-3 px-4">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {mockModels.map((model) => (
                <tr key={model.id} className="border-b border-zinc-800">
                  <td className="py-3 px-4 font-medium">{model.name}</td>
                  <td className="text-right py-3 px-4">{model.totalCalls.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{model.avgResponseTime}s</td>
                  <td className="text-right py-3 px-4">{model.totalTokens.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">${(model.totalTokens * 0.000015).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 mt-4">
          Note: Cost estimates are approximations based on average token pricing and may not reflect actual billing.
        </p>
      </div>
    </div>
  );
} 