import React, { useState } from 'react';
import { AVAILABLE_GAMES } from '../types';
import { GameCard } from '../components/GameCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { Search, Gamepad2 } from 'lucide-react';

export function GamesPage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredGames = AVAILABLE_GAMES.filter(g => {
    const matchesCategory = category === 'All' || g.tags.some(t => t.toLowerCase() === category.toLowerCase());
    const matchesSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-blue-600" />
            All Games
          </h1>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="w-full bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter selected={category} onSelect={setCategory} />

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map(game => (
              <GameCard key={game.gameId} game={game} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-xl bg-white">
            <p className="text-slate-500 text-lg">No games found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
