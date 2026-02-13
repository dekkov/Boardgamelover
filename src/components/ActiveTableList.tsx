import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';

export function ActiveTableList() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PlayCircle size={18} className="text-blue-600" />
          <h3 className="font-bold text-slate-800">Active Tables</h3>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <Clock size={20} className="text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">Coming Soon</p>
        <p className="text-xs text-slate-400 mt-1">Live table browsing is on its way</p>
      </div>
    </div>
  );
}
