import React from 'react';
import { SPEED_PRESETS, MOOD_PRESETS } from '../data/voices';
import { SpeedPreset, MoodPreset } from '../types/tts';
import {
  Gauge,
  Sparkles,
  Sun,
  Flame,
  Wind,
  Heart,
  Zap,
  Sliders,
  AudioWaveform,
  Volume2,
} from 'lucide-react';

interface AudioControlsProps {
  currentSpeedRate: number;
  onSpeedChange: (speed: number) => void;
  selectedMood: MoodPreset;
  onMoodChange: (mood: MoodPreset) => void;
  pitchSemitones: number;
  onPitchChange: (pitch: number) => void;
  selectedModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';
  onModelChange: (model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts') => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  currentSpeedRate,
  onSpeedChange,
  selectedMood,
  onMoodChange,
  pitchSemitones,
  onPitchChange,
  selectedModel,
  onModelChange,
}) => {
  // Get active speed preset if closely matching
  const activePreset = SPEED_PRESETS.find(
    (p) => Math.abs(p.rate - currentSpeedRate) < 0.05
  );

  const getMoodIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'Wind': return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Heart': return <Heart className="w-3.5 h-3.5 text-pink-400" />;
      case 'Zap': return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
      {/* SECTION 1: SPEED (የንባብ ፍጥነት) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                የድምፅ ንባብ ፍጥነት (Speech Pacing)
              </h4>
              <span className="text-[11px] text-slate-400">
                {activePreset
                  ? `${activePreset.name} (${activePreset.description})`
                  : `ብጁ ፍጥነት: ${currentSpeedRate.toFixed(2)}x`}
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
            {currentSpeedRate.toFixed(2)}x
          </span>
        </div>

        {/* Speed Preset Quick Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 mb-3">
          {SPEED_PRESETS.map((preset) => {
            const isMatch = Math.abs(preset.rate - currentSpeedRate) < 0.05;
            return (
              <button
                key={preset.id}
                onClick={() => onSpeedChange(preset.rate)}
                className={`px-2 py-2 rounded-xl text-left transition-all border flex flex-col justify-between ${
                  isMatch
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold leading-tight line-clamp-1">{preset.name}</span>
                  <span className={`text-[10px] font-mono ${isMatch ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {preset.rate}x
                  </span>
                </div>
                <span className={`text-[9px] line-clamp-1 mt-0.5 ${isMatch ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.latinName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fine-tuning Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">0.5x (ዝግምተኛ)</span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={currentSpeedRate}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">2.0x (ፈጣን)</span>
        </div>
      </div>

      <div className="h-px bg-slate-800/80" />

      {/* SECTION 2: MOOD & EMOTION (የስሜት ቃና) */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              የስሜት ቃና እና ድባብ (Emotion & Tone)
            </h4>
            <span className="text-[11px] text-slate-400">
              ድምፁ የሚኖረው ስሜታዊ ቅላጼ እና አገላለጽ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {MOOD_PRESETS.map((mood) => {
            const isSelected = selectedMood.id === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => onMoodChange(mood)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                  isSelected
                    ? 'bg-purple-600/30 text-purple-200 border-purple-500 ring-1 ring-purple-500/50 shadow-md shadow-purple-900/30'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
                }`}
              >
                {getMoodIcon(mood.icon)}
                <span className="truncate">{mood.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-800/80" />

      {/* SECTION 3: PITCH & AI ENGINE MODEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pitch (ድምፅ ውፍረት/ቅጥነት) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-200">
                ድምፅ ውፍረት / ቅጥነት (Pitch Tuning)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {pitchSemitones === 0
                ? 'መደበኛ (0)'
                : pitchSemitones < 0
                ? `ወፍራም (${pitchSemitones})`
                : `ቀጭን (+${pitchSemitones})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPitchChange(-3)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                pitchSemitones === -3
                  ? 'bg-teal-600 text-white border-teal-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              ወፍራም
            </button>
            <input
              type="range"
              min="-6"
              max="6"
              step="1"
              value={pitchSemitones}
              onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <button
              onClick={() => onPitchChange(3)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                pitchSemitones === 3
                  ? 'bg-teal-600 text-white border-teal-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              ቀጭን
            </button>
          </div>
        </div>

        {/* AI TTS Model Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <AudioWaveform className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200">
              የሞዴል ሞተር (Gemini AI Engine)
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onModelChange('gemini-3.8-flash-lite-tts')}
              className={`p-2 rounded-xl text-left border transition-all ${
                selectedModel === 'gemini-3.8-flash-lite-tts'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">Flash-Lite TTS</div>
              <div className="text-[10px] opacity-75">ፈጣን እና ቅልጥፍ ያለ</div>
            </button>
            <button
              onClick={() => onModelChange('gemini-3.8-flash-tts')}
              className={`p-2 rounded-xl text-left border transition-all ${
                selectedModel === 'gemini-3.8-flash-tts'
                  ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">Flash TTS Studio</div>
              <div className="text-[10px] opacity-75">ከፍተኛ ጥራት እና ስሜት</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
