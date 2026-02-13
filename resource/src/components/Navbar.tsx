import React from 'react';
import { Search, Bell, Menu, User, Grid, Dice5, Zap } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="bg-blue-600 p-1.5 rounded-lg transform rotate-3 shadow-sm">
                <Dice5 className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">BoardArena</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-1">
              <NavLink active>Play Now</NavLink>
              <NavLink>Games</NavLink>
              <NavLink>Community</NavLink>
              <NavLink>Forums</NavLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              />
            </div>

            {/* Actions */}
            <button className="p-2 text-slate-500 hover:text-blue-600 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 cursor-pointer overflow-hidden">
               <User className="h-5 w-5 text-slate-500" />
            </div>
            
            <button className="md:hidden p-2 text-slate-500">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ children, active = false }: { children: React.ReactNode; active?: boolean }) => {
  return (
    <a
      href="#"
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'text-blue-600 bg-blue-50'
          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </a>
  );
};
