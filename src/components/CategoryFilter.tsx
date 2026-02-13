import React from 'react';

const CATEGORIES = ['All', 'Strategy', 'Party', 'Quick', 'Bluffing', 'Economy', 'Classic'];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === cat
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
