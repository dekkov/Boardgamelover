import React from 'react';
import { GameConfig, PLAYABLE_GAME_IDS } from '../types';
import { Link } from 'react-router-dom';
import { Users, Clock, Star, Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface GameCardProps {
  game: GameConfig;
}

export function GameCard({ game }: GameCardProps) {
  const rating = 4.5; // Mock rating for display
  const isPlayable = PLAYABLE_GAME_IDS.includes(game.gameId);

  return (
    <Link to={`/games/${game.gameId}`} className="group">
      <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full ${!isPlayable ? 'opacity-75' : ''}`}>
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={game.imageUrl}
            alt={game.name}
            className={`w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500 ${!isPlayable ? 'grayscale-[30%]' : ''}`}
          />
          {/* Coming Soon overlay for unplayable games */}
          {!isPlayable && (
            <div className="absolute top-3 right-3 z-10">
              <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2.5 py-1 shadow-sm border border-amber-200">
                Coming Soon
              </span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2">
          {/* Category Tag */}
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
              {game.tags[0]}
            </span>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-slate-600">{rating}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-1">{game.name}</h3>

          {/* Meta Row */}
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-auto">
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{game.minPlayers}-{game.maxPlayers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{game.avgTime}m</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
