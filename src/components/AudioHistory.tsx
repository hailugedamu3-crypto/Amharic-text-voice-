import React, { useState } from 'react';
import { GeneratedAudioItem } from '../types/tts';
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Copy,
  Check,
  Clock,
  Sparkles,
  Music,
} from 'lucide-react';

interface AudioHistoryProps {
  items: GeneratedAudioItem[];
  currentPlayingId: string | null;
  onPlayItem: (item: GeneratedAudioItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  items,
  currentPlayingId,
  onPlayItem,
  onDeleteItem,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: GeneratedAudioItem) => {
    const link = document.createElement('a');
    link.href = `data:${item.mimeType || 'audio/wav'};base64,${item.audioBase64}`;
    link.download = `amharic-${item.voiceName}-${item.id.slice(0, 6)}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (items.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
        <History className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-semibold text-slate-300">እስካሁን የተፈጠረ የድምፅ ታሪክ የለም</h4>
        <p className="text-xs text-slate-500 mt-1">
          ጽሑፍ ጽፈው “ድምፅ ፍጠር” ሲሉ ያመነጩት ድምፅ እዚህ ተቀምጦ በቀላሉ እንደገና ያዳምጡታል ወይም ያወርዱታል።
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-slate-200">
            የተዘጋጁ ድምፆች ታሪክ (Library - {items.length})
          </h4>
        </div>
        <button
          onClick={onClearAll}
          className="text-[11px] text-red-400 hover:text-red-300 hover:underline transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          <span>ሁሉንም አፅዳ</span>
        </button>
      </div>

      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {items.map((item) => {
          const isPlaying = currentPlayingId === item.id;
          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                isPlaying
                  ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                  : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60'
              }`}
            >
              {/* Info & Text */}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-300">
                    {item.voiceName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.speedRate}x • {item.moodLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto sm:ml-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimestamp(item.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {item.text}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onPlayItem(item)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all ${
                    isPlaying
                      ? 'bg-indigo-500 text-white shadow-indigo-500/30'
                      : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                  }`}
                  title={isPlaying ? 'አቁም' : 'አጫውት'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>አቁም</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>አጫውት</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(item)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  title="አውርድ (WAV)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleCopy(item.id, item.text)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                  title="ጽሑፍ ኮፒ አድርግ"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors border border-slate-700"
                  title="ሰርዝ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
