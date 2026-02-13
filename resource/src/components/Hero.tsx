import React from 'react';
import { ArrowRight, Trophy, Zap, Award } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white rounded-2xl shadow-xl mx-4 sm:mx-0">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/50 border border-blue-700/50 text-blue-200 text-xs font-semibold uppercase tracking-wide">
            <Zap className="h-3 w-3 text-yellow-400" /> New Season Available
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            The World's Largest <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Board Game Table</span>
          </h1>
          
          <p className="text-lg text-blue-100 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Join millions of players worldwide. Play thousands of board games online from your browser. No download necessary.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
            <button className="px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Play Now for Free
            </button>
            <button className="px-8 py-3.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-white font-medium rounded-lg backdrop-blur-sm transition-all flex items-center justify-center gap-2">
              Browse Games <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="pt-6 flex items-center justify-center md:justify-start gap-8 opacity-80">
            <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium">Ranked Play</span>
            </div>
            <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium">Tournaments</span>
            </div>
          </div>
        </div>
        
        {/* Right side illustration - 3D card effect */}
        <div className="flex-1 relative w-full max-w-md perspective-1000 hidden md:block">
            <div className="relative transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out preserve-3d">
                <div className="absolute inset-0 bg-black/20 rounded-xl transform translate-x-4 translate-y-4 blur-md"></div>
                <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1769576787092-5ffea8649c3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBib2FyZCUyMGdhbWUlMjB0YWJsZXRvcHxlbnwxfHx8fDE3NzA5MjM1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                    alt="Board Game Highlight" 
                    className="rounded-xl shadow-2xl border-4 border-slate-800/50 relative z-10 w-full h-auto object-cover aspect-video"
                />
                 {/* Floating elements */}
                 <div className="absolute -top-6 -right-6 bg-white p-3 rounded-lg shadow-xl z-20 animate-bounce-slow">
                    <Dice5 size={32} className="text-blue-600" />
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Dice icon since it wasn't imported
import { Dice5 } from 'lucide-react';
