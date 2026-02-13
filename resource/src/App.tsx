import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GameCard } from './components/GameCard';
import { ActiveTableList } from './components/ActiveTableList';
import { Flame, Star, Coffee, Zap, MessageSquare, Heart, ChevronRight } from 'lucide-react';

export default function App() {
  const featuredGames = [
    {
      title: "Wingspan",
      category: "Strategy",
      rating: 8.1,
      players: "1-5",
      time: "40-70m",
      image: "https://images.unsplash.com/photo-1642284474435-aba7be889406?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWNlJTIwYW5kJTIwbWVlcGxlfGVufDF8fHx8MTc3MDkyMzUzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      isPremium: true
    },
    {
      title: "Terraforming Mars",
      category: "Sci-Fi",
      rating: 8.4,
      players: "1-5",
      time: "120m",
      image: "https://images.unsplash.com/photo-1762068383473-f59f4dc614e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhdGVneSUyMGJvYXJkJTIwZ2FtZSUyMG1hcHxlbnwxfHx8fDE3NzA5MjM1Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      isPremium: true
    },
    {
      title: "Azul",
      category: "Abstract",
      rating: 7.8,
      players: "2-4",
      time: "30-45m",
      image: "https://images.unsplash.com/photo-1769576787092-5ffea8649c3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBib2FyZCUyMGdhbWUlMjB0YWJsZXRvcHxlbnwxfHx8fDE3NzA5MjM1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      title: "Gloomhaven",
      category: "Adventure",
      rating: 8.7,
      players: "1-4",
      time: "60-120m",
      image: "https://images.unsplash.com/photo-1762838362179-1718fce76d22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkJTIwZ2FtZSUyMGZhbnRhc3klMjBhcnR8ZW58MXx8fHwxNzcwOTIzNTM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      isPremium: true
    },
    {
      title: "Catan",
      category: "Family",
      rating: 7.1,
      players: "3-4",
      time: "60-120m",
      image: "https://images.unsplash.com/photo-1758691031197-3ce709db9640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBwbGF5aW5nJTIwYm9hcmQlMjBnYW1lcyUyMGhhcHB5fGVufDF8fHx8MTc3MDkyMzUzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    },
    {
      title: "Ticket to Ride",
      category: "Family",
      rating: 7.4,
      players: "2-5",
      time: "30-60m",
      image: "https://images.unsplash.com/photo-1769576787092-5ffea8649c3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBib2FyZCUyMGdhbWUlMjB0YWJsZXRvcHxlbnwxfHx8fDE3NzA5MjM1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Hero Section */}
        <section>
          <Hero />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Games Browser */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Quick Categories */}
            <div className="flex flex-wrap gap-2">
              {['All Games', 'Popular', 'Hot Now', 'Strategy', 'Card Games', 'Dice', 'Family'].map((cat, i) => (
                <button 
                  key={cat} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    i === 0 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Hot Games Grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                  <Flame className="text-orange-500 fill-current" /> Hot Right Now
                </h2>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 group">
                  View all 743 games <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {featuredGames.map((game, i) => (
                  <GameCard key={i} {...game} />
                ))}
              </div>
            </section>

            {/* New Releases or other categories could go here */}
             <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Daily Challenge</h3>
                        <p className="text-sm text-slate-600">Complete today's puzzle in <span className="font-semibold text-indigo-600">Azul</span> to win exclusive badges.</p>
                    </div>
                    <button className="ml-auto px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm">
                        Start
                    </button>
                </div>
            </section>
          </div>

          {/* Right Column: Sidebar (Community/Lobby) */}
          <div className="space-y-8">
            
            {/* Active Tables Widget */}
            <ActiveTableList />
            
            {/* Community/Social Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" /> Community
              </h3>
              <div className="space-y-4">
                 <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">MK</div>
                    <div>
                        <p className="text-sm text-slate-800"><span className="font-bold">MikeK</span> just won a game of <span className="text-blue-600">Wingspan</span>!</p>
                        <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">AL</div>
                    <div>
                        <p className="text-sm text-slate-800"><span className="font-bold">AliceL</span> is looking for players for <span className="text-blue-600">Ark Nova</span>.</p>
                        <p className="text-xs text-slate-400 mt-1">5 minutes ago</p>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Open Chat
              </button>
            </div>

            {/* Premium Promo */}
            <div className="bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Star size={100} />
                </div>
                <h3 className="font-bold text-lg mb-2 relative z-10 text-yellow-400">Go Premium</h3>
                <p className="text-sm text-slate-300 mb-4 relative z-10">Host premium games, no ads, and integrated voice chat.</p>
                <button className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-lg shadow-lg relative z-10 hover:brightness-110 transition-all">
                    Upgrade Now
                </button>
            </div>

          </div>
        </div>
      </main>
      
      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
            <div className="flex justify-center gap-6 mb-6">
                <a href="#" className="hover:text-blue-600">About</a>
                <a href="#" className="hover:text-blue-600">Games</a>
                <a href="#" className="hover:text-blue-600">Contact</a>
                <a href="#" className="hover:text-blue-600">Privacy</a>
            </div>
            <p>© 2024 BoardArena Clone. Not affiliated with the real Board Game Arena.</p>
        </div>
      </footer>
    </div>
  );
}
