import React, { useState } from 'react';
import { AVAILABLE_GAMES } from '../types';
import { GameCard } from '../components/GameCard';
import { Hero } from '../components/Hero';
import { CategoryFilter } from '../components/CategoryFilter';
import { ActiveTableList } from '../components/ActiveTableList';
import { CommunityFeed } from '../components/CommunityFeed';
import { PremiumPromo } from '../components/PremiumPromo';
import { DailyChallenge } from '../components/DailyChallenge';
import { Flame } from 'lucide-react';

export function HomePage() {
  const [category, setCategory] = useState("All");

  const filteredGames = AVAILABLE_GAMES.filter(g => {
    if (category === 'All') return true;
    return g.tags.some(t => t.toLowerCase() === category.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section - full width */}
      <Hero />

      {/* Main Content */}
      <div id="browse" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <CategoryFilter selected={category} onSelect={setCategory} />

            {/* Hot Games Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  Hot Games
                </h2>
                <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  View All →
                </button>
              </div>

              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredGames.map(game => (
                    <GameCard key={game.gameId} game={game} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-xl bg-white">
                  <p className="text-slate-500 text-lg">No games found in "{category}"</p>
                </div>
              )}
            </section>

            <DailyChallenge />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <ActiveTableList />
            <CommunityFeed />
            <PremiumPromo />
          </div>

        </div>
      </div>
    </div>
  );
}
