import React from 'react';
import { PlayCircle, Globe, Lock, Clock, UserPlus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface TableProps {
  gameName: string;
  hostName: string;
  playersCurrent: number;
  playersMax: number;
  elo: string;
  status: 'Waiting' | 'In Progress';
  image: string;
}

export const ActiveTableList = () => {
  const tables: TableProps[] = [
    {
      gameName: "Terraforming Mars",
      hostName: "SpaceCadet99",
      playersCurrent: 3,
      playersMax: 4,
      elo: "1500+",
      status: "Waiting",
      image: "https://images.unsplash.com/photo-1762068383473-f59f4dc614e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhdGVneSUyMGJvYXJkJTIwZ2FtZSUyMG1hcHxlbnwxfHx8fDE3NzA5MjM1Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      gameName: "Wingspan",
      hostName: "BirdWatcher",
      playersCurrent: 1,
      playersMax: 5,
      elo: "Any",
      status: "Waiting",
      image: "https://images.unsplash.com/photo-1642284474435-aba7be889406?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWNlJTIwYW5kJTIwbWVlcGxlfGVufDF8fHx8MTc3MDkyMzUzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      gameName: "Carcassonne",
      hostName: "TileMaster",
      playersCurrent: 2,
      playersMax: 4,
      elo: "1200-1400",
      status: "Waiting",
      image: "https://images.unsplash.com/photo-1769576787092-5ffea8649c3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBib2FyZCUyMGdhbWUlMjB0YWJsZXRvcHxlbnwxfHx8fDE3NzA5MjM1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      gameName: "7 Wonders Duel",
      hostName: "CivBuilder",
      playersCurrent: 1,
      playersMax: 2,
      elo: "Expert",
      status: "Waiting",
      image: "https://images.unsplash.com/photo-1762838362179-1718fce76d22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkJTIwZ2FtZSUyMGZhbnRhc3klMjBhcnR8ZW58MXx8fHwxNzcwOTIzNTM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-600" />
          Live Tables
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
      </div>
      
      <div className="divide-y divide-slate-100">
        {tables.map((table, i) => (
          <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer">
            {/* Game Thumb */}
            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
               <ImageWithFallback src={table.image} alt={table.gameName} className="w-full h-full object-cover" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                 <h4 className="font-bold text-slate-800 truncate">{table.gameName}</h4>
                 <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                    {table.status}
                 </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">{table.hostName}</span> is hosting
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Elo: {table.elo}</span>
              </div>
            </div>
            
            {/* Players Status */}
            <div className="text-center px-4 hidden sm:block">
                <div className="text-sm font-bold text-slate-700">{table.playersCurrent} / {table.playersMax}</div>
                <div className="text-xs text-slate-400">Players</div>
            </div>
            
            {/* Action */}
            <button className="p-2 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors group-hover:scale-110">
                <UserPlus className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
