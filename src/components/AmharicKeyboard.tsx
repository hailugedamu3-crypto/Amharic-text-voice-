import React, { useState } from 'react';
import { Delete, CornerDownLeft, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AmharicKeyboardProps {
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Ethiopic fidel matrix: Base + 7 orders
const FIDEL_FAMILIES = [
  ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ'],
  ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ'],
  ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ'],
  ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ'],
  ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ'],
  ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ'],
  ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ'],
  ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ'],
  ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ'],
  ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ'],
  ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ'],
  ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ'],
  ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ'],
  ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ'],
  ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ'],
  ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ'],
  ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ'],
  ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ'],
  ['ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ'],
  ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ'],
  ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ'],
  ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ'],
  ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ'],
  ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ'],
  ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ'],
  ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ'],
  ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ'],
  ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ'],
  ['ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ'],
  ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ'],
  ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ'],
  ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ'],
];

const PUNCTUATIONS = ['።', '፣', '፤', '፦', '፥', '፧', '!', '?', '(', ')', '“', '”'];

export const AmharicKeyboard: React.FC<AmharicKeyboardProps> = ({
  onInsertChar,
  onBackspace,
  isOpen,
  onClose,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string[] | null>(null);

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h4 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            የአማርኛ ፊደላት መጻፊያ ሰሌዳ (Virtual Fidel Keyboard)
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="ዝጋ"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Base Letter Expansion (7 Orders - ግዕዝ እስከ ሳብዕ) */}
      {selectedFamily ? (
        <div className="mb-3 p-2.5 bg-indigo-950/60 border border-indigo-700/60 rounded-xl flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-indigo-300 font-medium">
            <span>ቅጥያዎች ({selectedFamily[0]}):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedFamily.map((fidel, idx) => (
              <button
                key={fidel}
                onClick={() => {
                  onInsertChar(fidel);
                  setSelectedFamily(null);
                }}
                className="w-9 h-10 sm:w-10 sm:h-11 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base sm:text-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <span>{fidel}</span>
                <span className="text-[9px] opacity-70 leading-none">
                  {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : idx === 3 ? '4' : idx === 4 ? '5' : idx === 5 ? '6' : '7'}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedFamily(null)}
            className="text-xs text-slate-400 hover:text-slate-200 underline ml-auto"
          >
            ዝጋ
          </button>
        </div>
      ) : (
        <div className="mb-2 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>ማስታወሻ፡ ማንኛውንም ፊደል ሲጫኑ 7ቱንም ቅጥያዎች (ካዕብ እስከ ሳብዕ) ይዘረዝርልዎታል።</span>
        </div>
      )}

      {/* Base Consonant Grid */}
      <div className="grid grid-cols-8 sm:grid-cols-11 md:grid-cols-16 gap-1 max-h-44 overflow-y-auto p-1">
        {FIDEL_FAMILIES.map((family) => {
          const baseChar = family[0];
          const isSelected = selectedFamily?.[0] === baseChar;
          return (
            <button
              key={baseChar}
              onClick={() => setSelectedFamily(family)}
              className={`h-9 rounded-lg font-bold text-sm sm:text-base transition-all flex items-center justify-center border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400'
                  : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border-slate-700/60 hover:text-white'
              }`}
            >
              {baseChar}
            </button>
          );
        })}
      </div>

      {/* Punctuations & Action Row */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {PUNCTUATIONS.map((punct) => (
            <button
              key={punct}
              onClick={() => onInsertChar(punct)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-colors"
            >
              {punct}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => onInsertChar(' ')}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700"
          >
            ክፍተት (Space)
          </button>
          <button
            onClick={onBackspace}
            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/50 flex items-center gap-1 text-xs sm:text-sm transition-colors"
            title="አጥፋ (Backspace)"
          >
            <Delete className="w-4 h-4" />
            <span className="hidden sm:inline">አጥፋ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
