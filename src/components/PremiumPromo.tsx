import React from 'react';
import { Star, Clock } from 'lucide-react';

export function PremiumPromo() {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <Star size={120} className="absolute -top-6 -right-6 text-white/5" />

      <div className="relative flex flex-col items-center justify-center text-center py-2">
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mb-3">
          <Clock size={20} className="text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-yellow-400">Premium</h3>
        <p className="text-sm text-slate-400 mt-1">Coming Soon</p>
      </div>
    </div>
  );
}
