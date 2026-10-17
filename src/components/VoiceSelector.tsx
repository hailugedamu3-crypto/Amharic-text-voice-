import React, { useState, useMemo } from 'react';
import { VoicePersona, VoiceGender } from '../types/tts';
import {
  Search,
  Users,
  Mic,
  BookOpen,
  Smile,
  Radio,
  Wind,
  GraduationCap,
  Sparkles,
  Heart,
  Film,
  Zap,
  Flame,
  Headphones,
  Compass,
  Laptop,
  Feather,
  Check,
  Volume2,
} from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoicePersona[];
  selectedVoiceId: string;
  onSelectVoice: (voice: VoicePersona) => void;
  onPreviewVoiceSample?: (voice: VoicePersona) => void;
  previewingVoiceId?: string | null;
}

// Icon helper
const getVoiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'Mic': return <Mic className="w-5 h-5" />;
    case 'BookOpen': return <BookOpen className="w-5 h-5" />;
    case 'Smile': return <Smile className="w-5 h-5" />;
    case 'Radio': return <Radio className="w-5 h-5" />;
    case 'Wind': return <Wind className="w-5 h-5" />;
    case 'GraduationCap': return <GraduationCap className="w-5 h-5" />;
    case 'Sparkles': return <Sparkles className="w-5 h-5" />;
    case 'Heart': return <Heart className="w-5 h-5" />;
    case 'Film': return <Film className="w-5 h-5" />;
    case 'Zap': return <Zap className="w-5 h-5" />;
    case 'Flame': return <Flame className="w-5 h-5" />;
    case 'Headphones': return <Headphones className="w-5 h-5" />;
    case 'Compass': return <Compass className="w-5 h-5" />;
    case 'Laptop': return <Laptop className="w-5 h-5" />;
    case 'Feather': return <Feather className="w-5 h-5" />;
    default: return <Mic className="w-5 h-5" />;
  }
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoiceSample,
  previewingVoiceId,
}) => {
  const [genderFilter, setGenderFilter] = useState<'all' | VoiceGender>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    map.set('all', 'ሁሉም');
    voices.forEach((v) => {
      map.set(v.category, v.categoryLabel);
    });
    return Array.from(map.entries());
  }, [voices]);

  // Filtered voice list
  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      // Gender filter
      if (genderFilter !== 'all' && v.gender !== genderFilter) return false;
      // Category filter
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q) || v.latinName.toLowerCase().includes(q);
        const matchesDesc = v.description.toLowerCase().includes(q);
        const matchesBadge = v.badge.toLowerCase().includes(q);
        const matchesTags = v.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesBadge && !matchesTags) return false;
      }
      return true;
    });
  }, [voices, genderFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Gender & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Gender Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              genderFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            ሁሉም ({voices.length})
          </button>
          <button
            onClick={() => setGenderFilter('female')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              genderFilter === 'female'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>👩 ሴት ድምፆች</span>
            <span className="text-[11px] opacity-80 font-normal">
              ({voices.filter((v) => v.gender === 'female').length})
            </span>
          </button>
          <button
            onClick={() => setGenderFilter('male')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              genderFilter === 'male'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>👨 ወንድ ድምፆች</span>
            <span className="text-[11px] opacity-80 font-normal">
              ({voices.filter((v) => v.gender === 'male').length})
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ድምፅ ፈልግ (በስም ወይም በአይነት)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Category Pills (Horizontal scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(([catKey, catLabel]) => (
          <button
            key={catKey}
            onClick={() => setCategoryFilter(catKey)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              categoryFilter === catKey
                ? 'bg-indigo-950/70 border-indigo-500/80 text-indigo-300'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {catLabel}
          </button>
        ))}
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/90 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-950/40'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700 hover:shadow-lg'
              }`}
            >
              <div>
                {/* Header: Avatar, Name, Gender Badge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${voice.accentColor} flex items-center justify-center text-white shadow-md shadow-black/20 group-hover:scale-105 transition-transform`}
                    >
                      {getVoiceIcon(voice.avatarIcon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-100 text-base leading-tight">
                          {voice.name}
                        </h4>
                        <span className="text-xs text-slate-400">({voice.latinName})</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {voice.gender === 'female' ? '👩 ሴት' : '👨 ወንድ'}
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/40">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
                      {voice.badge.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Badge & Description */}
                <div className="mb-2">
                  <span className="inline-block text-[11px] font-semibold text-indigo-300 bg-indigo-950/50 px-2.5 py-0.5 rounded-lg border border-indigo-800/40 mb-1.5">
                    {voice.badge}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {voice.description}
                  </p>
                </div>
              </div>

              {/* Tags & Sample Preview Button */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  {voice.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {onPreviewVoiceSample && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoiceSample(voice);
                    }}
                    className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all border ${
                      isPreviewing
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                    }`}
                    title="የድምፅ ናሙና አድምጥ"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isPreviewing ? 'በማጫወት ላይ...' : 'ናሙና'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">ምንም ድምፅ አልተገኘም። እባክዎ የፍለጋ ቃሉን ወይም ማጣሪያውን ይቀይሩ።</p>
        </div>
      )}
    </div>
  );
};
