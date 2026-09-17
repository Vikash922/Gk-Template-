import React from 'react';

interface OptionInputProps {
  letter: 'A' | 'B' | 'C' | 'D';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isCorrect?: boolean;
  onMarkCorrect?: () => void;
}

export const OptionInput: React.FC<OptionInputProps> = ({
  letter,
  value,
  onChange,
  placeholder = 'Enter option text...',
  isCorrect = false,
  onMarkCorrect,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Letter Badge [A], [B], [C], [D] */}
      <button
        type="button"
        onClick={onMarkCorrect}
        title={isCorrect ? 'Correct answer (selected). Click to unmark' : 'Click to mark as correct answer'}
        className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
          isCorrect
            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300/60'
            : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200/90'
        }`}
      >
        <span>[{letter}]</span>
      </button>

      {/* Input Field */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3 pr-8 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
        />
        {value && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono pointer-events-none hidden sm:inline">
            {value.length}
          </span>
        )}
      </div>
    </div>
  );
};
