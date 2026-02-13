import React from 'react';
import { Trophy, Clock } from 'lucide-react';

export function DailyChallenge() {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <Trophy size={24} className="text-blue-600" />
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h3 className="font-bold text-slate-800">Daily Challenge</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1.5 justify-center sm:justify-start mt-1">
          <Clock size={14} className="text-slate-400" />
          Coming Soon
        </p>
      </div>
    </div>
  );
}
