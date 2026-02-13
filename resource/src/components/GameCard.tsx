import React from 'react';
import { Star, Users, Clock, Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface GameProps {
  title: string;
  image: string;
  rating: number;
  players: string;
  time: string;
  category: string;
  isPremium?: boolean;
}

export const GameCard = ({ title, image, rating, players, time, category, isPremium }: GameProps) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden">
        <ImageWithFallback 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {isPremium && (
           <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm z-10">
             PREMIUM
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                <Play className="h-4 w-4 fill-current" /> Play Now
            </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {category}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-sm font-bold text-slate-700">{rating}</span>
            </div>
        </div>
        
        <h3 className="font-bold text-slate-800 text-lg mb-3 line-clamp-1" title={title}>{title}</h3>
        
        <div className="flex items-center gap-4 text-slate-500 text-sm">
            <div className="flex items-center gap-1.5" title="Players">
                <Users className="h-4 w-4" />
                <span>{players}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Play time">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
