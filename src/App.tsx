import React, { useState, useEffect, useRef } from 'react';
import { VOICES, SPEED_PRESETS, MOOD_PRESETS, SAMPLE_TEXTS, SampleTextItem } from './data/voices';
import { VoicePersona, SpeedPreset, MoodPreset, GeneratedAudioItem } from './types/tts';
import { VoiceSelector } from './components/VoiceSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { AudioControls } from './components/AudioControls';
import { AmharicKeyboard } from './components/AmharicKeyboard';
import { AudioHistory } from './components/AudioHistory';
import {
  Mic,
  Play,
  Volume2,
  Sparkles,
  RefreshCw,
  History,
  Keyboard,
  Wand2,
  Copy,
  Check,
  Info,
  Trash2,
  Send,
  Sliders,
  AlertCircle,
  FileText,
  VolumeX,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'amharic_voice_studio_history_v1';

export default function App() {
  // Primary state
  const [inputText, setInputText] = useState<string>(
    'እንኳን ወደ አማርኛ ድምፅ ማስተር ስቱዲዮ በደህና መጡ! ማንኛውንም ጽሑፍ እዚህ በማስገባት በወንድ ወይም በሴት በተለያዩ ውብ የድምፅ ስልቶች እና ፍጥነቶች ወደ ንግግር መቀየር ይችላሉ።'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(VOICES[0]); // ሳራ
  const [speedRate, setSpeedRate] = useState<number>(1.0);
  const [selectedMood, setSelectedMood] = useState<MoodPreset>(MOOD_PRESETS[0]);
  const [pitchSemitones, setPitchSemitones] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts'>(
    'gemini-3.8-flash-lite-tts'
  );

  // Keyboard & AI Writer Modal state
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const [isAiWriterOpen, setIsAiWriterOpen] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiCategory, setAiCategory] = useState<string>('ዜና');
  const [isComposingAi, setIsComposingAi] = useState<boolean>(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active audio player state
  const [currentAudio, setCurrentAudio] = useState<{
    audioBase64: string;
    mimeType: string;
    voiceName: string;
    text: string;
    speedRate: number;
    id?: string;
  } | null>(null);

  // Voice sample previewing
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // History state
  const [historyItems, setHistoryItems] = useState<GeneratedAudioItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyItems));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [historyItems]);

  // Insert character from virtual Amharic keyboard
  const handleInsertChar = (char: string) => {
    setInputText((prev) => prev + char);
  };

  const handleBackspace = () => {
    setInputText((prev) => prev.slice(0, -1));
  };

  // Quick preset loader
  const handleSelectSample = (sample: SampleTextItem) => {
    setInputText(sample.text);
  };

  // Instant Voice Sample Preview
  const handlePreviewVoiceSample = async (voice: VoicePersona) => {
    setPreviewingVoiceId(voice.id);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          geminiVoice: voice.geminiVoice,
          style: voice.stylePrompt,
          speedStyle: 'natural pacing',
          mood: 'expressive and clear',
          model: 'gemini-3.8-flash-lite-tts',
        }),
      });

      const data = await res.json();
      if (res.ok && data.audioBase64) {
        setCurrentAudio({
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voiceName: voice.name,
          text: voice.sampleText,
          speedRate: 1.0,
        });
      } else {
        // Fallback to Web Speech Synthesis if available
        playWebSpeechFallback(voice.sampleText, voice.gender === 'female' ? 1.1 : 0.9, 1.0);
      }
    } catch (err) {
      console.warn('Preview fallback:', err);
      playWebSpeechFallback(voice.sampleText, voice.gender === 'female' ? 1.1 : 0.9, 1.0);
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  // Browser Web Speech fallback when server unavailable
  const playWebSpeechFallback = (text: string, pitch = 1.0, rate = 1.0) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;
      const voices = window.speechSynthesis.getVoices();
      const amVoice = voices.find((v) => v.lang.startsWith('am') || v.lang.includes('ET'));
      if (amVoice) utterance.voice = amVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Main Audio Generation
  const handleGenerateSpeech = async () => {
    if (!inputText.trim()) {
      setGenerationError('እባክዎ መጀመሪያ ጽሑፍ ያስገቡ (Please enter text to speak)');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    // Formulate speed instructions
    const currentSpeedObj = SPEED_PRESETS.find(
      (p) => Math.abs(p.rate - speedRate) < 0.05
    );
    const speedPrompt = currentSpeedObj
      ? currentSpeedObj.promptPacing
      : `speech pacing rate approximately ${speedRate.toFixed(2)}x`;

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          geminiVoice: selectedVoice.geminiVoice,
          style: selectedVoice.stylePrompt,
          speedStyle: speedPrompt,
          mood: selectedMood.promptMood,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.audioBase64) {
        throw new Error(data.error || 'ድምፅ ማመንጨት አልተቻለም');
      }

      const newId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAudioItem: GeneratedAudioItem = {
        id: newId,
        text: inputText.trim(),
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.name,
        gender: selectedVoice.gender,
        badge: selectedVoice.badge,
        speedRate,
        speedLabel: currentSpeedObj ? currentSpeedObj.name : `${speedRate.toFixed(2)}x`,
        moodLabel: selectedMood.name.split(' ')[0],
        pitchSemitones,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: Date.now(),
      };

      // Set active audio
      setCurrentAudio({
        id: newId,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        voiceName: selectedVoice.name,
        text: inputText.trim(),
        speedRate,
      });

      // Add to history (keep top 30)
      setHistoryItems((prev) => [newAudioItem, ...prev.slice(0, 29)]);
    } catch (err: any) {
      console.error('TTS Generation error:', err);
      setGenerationError(err?.message || 'በድምፅ አመነጫ ወቅት ስህተት አጋጥሟል።');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Amharic Script with AI
  const handleComposeWithAi = async () => {
    setIsComposingAi(true);
    try {
      const res = await fetch('/api/ai/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: aiCategory,
          topic: aiTopic || 'የቴክኖሎጂ እና የሀገር እድገት',
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setInputText(data.text);
        setIsAiWriterOpen(false);
      } else {
        alert(data.error || 'ጽሑፍ ማመንጨት አልተሳካም');
      }
    } catch (err: any) {
      console.error('AI Composer error:', err);
      alert('ጽሑፍ ማመንጨት አልተሳካም');
    } finally {
      setIsComposingAi(false);
    }
  };

  // Play item from history
  const handlePlayHistoryItem = (item: GeneratedAudioItem) => {
    setCurrentAudio({
      id: item.id,
      audioBase64: item.audioBase64,
      mimeType: item.mimeType,
      voiceName: item.voiceName,
      text: item.text,
      speedRate: item.speedRate,
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    if (currentAudio?.id === id) {
      setCurrentAudio(null);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('ሁሉንም የተቀመጡ ድምፆች ማጥፋት ይፈልጋሉ?')) {
      setHistoryItems([]);
      setCurrentAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* TOP HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Mic className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight">
                  ድምፅ ማስተር
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Amharic Voice Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                የላቀ የአማርኛ ጽሑፍ ወደ ድምፅ መቀየሪያ • 16+ የድምፅ አይነቶች በወንድና በሴት
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gemini 3.8 AI Audio</span>
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TOP INTRO CARD */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-900/50 rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>የአማርኛ ንግግር ስቱዲዮ (Ethiopian Amharic Text to Speech)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              ጽሑፍዎን በወንድ ወይም በሴት በተለያዩ ውብ የድምፅ ስልቶች እና ፍጥነቶች ያዳምጡ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              የዜና አቅራቢ፣ ታሪክ ተራኪ፣ ሬዲዮ ጋዜጠኛ፣ አስተማሪ፣ አረጋጊ፣ ጥበበኛ አዛውንት እና ሌሎችም! ፍጥነቱን ከእጅግ ዝግምተኛ እስከ ፈጣን በማስተካከል 24kHz ጥራት ያለው ድምፅ ያመነጩ።
            </p>
          </div>
        </div>

        {/* SECTION 1: TEXT INPUT & TOOLS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                የሚነበበው የአማርኛ ጽሑፍ (Input Text)
              </h3>
            </div>

            {/* Quick helper buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isKeyboardOpen
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80'
                }`}
                title="የአማርኛ ፊደላት ሰሌዳ ክፈት"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{isKeyboardOpen ? 'ኪቦርድ ዝጋ' : 'ፊደል ሰሌዳ (Keyboard)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAiWriterOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>በ AI ጽሑፍ ጻፍልኝ</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText('')}
                className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                title="ጽሑፍ አፅዳ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Virtual Fidel Keyboard (Conditional) */}
          <AmharicKeyboard
            isOpen={isKeyboardOpen}
            onClose={() => setIsKeyboardOpen(false)}
            onInsertChar={handleInsertChar}
            onBackspace={handleBackspace}
          />

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="የሚነበበውን የአማርኛ ጽሑፍ እዚህ ይጻፉ ወይም ይለጥፉ..."
              className="w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm sm:text-base leading-relaxed placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 px-1">
              <span>ቃላት: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} | ፊደላት: {inputText.length}</span>
              <span>የፊደል ቅርጸት፡ አማርኛ (Fidel / Ge'ez)</span>
            </div>
          </div>

          {/* Sample Presets Quick Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">የናሙና ጽሑፎች (Sample Presets):</span>
              <span className="text-[11px]">ለመሞከር አንዱን ይምረጡ</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {SAMPLE_TEXTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="px-3 py-2 rounded-xl text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 line-clamp-1">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {sample.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: VOICE SELECTOR (ወንድ እና ሴት - 16+ የድምፅ አይነቶች) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Mic className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  የድምፅ ባህሪና አይነት ይምረጡ (Select Voice Persona)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                በወንድ እና በሴት የተከፋፈሉ በርካታ የድምፅ ስልቶች (ዜና፣ ተራኪ፣ ሬዲዮ፣ አረጋጊ፣ አስተማሪ፣ ወዘተ)
              </p>
            </div>

            {/* Currently Selected Voice Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-950/70 border border-indigo-700/50 text-indigo-200 text-xs font-semibold">
              <span>የተመረጠው:</span>
              <span className="font-bold text-white">{selectedVoice.name}</span>
              <span className="opacity-80">({selectedVoice.badge})</span>
            </div>
          </div>

          <VoiceSelector
            voices={VOICES}
            selectedVoiceId={selectedVoice.id}
            onSelectVoice={(voice) => setSelectedVoice(voice)}
            onPreviewVoiceSample={handlePreviewVoiceSample}
            previewingVoiceId={previewingVoiceId}
          />
        </div>

        {/* SECTION 3: AUDIO CONTROLS (SPEED, MOOD, PITCH, MODEL) */}
        <AudioControls
          currentSpeedRate={speedRate}
          onSpeedChange={(val) => setSpeedRate(val)}
          selectedMood={selectedMood}
          onMoodChange={(mood) => setSelectedMood(mood)}
          pitchSemitones={pitchSemitones}
          onPitchChange={(pitch) => setPitchSemitones(pitch)}
          selectedModel={selectedModel}
          onModelChange={(m) => setSelectedModel(m)}
        />

        {/* GENERATE BUTTON & ERROR DISPLAY */}
        <div className="space-y-3">
          {generationError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{generationError}</p>
                <p className="text-[11px] opacity-80 mt-1">
                  የ Gemini API ቁልፍ በ Settings &gt; Secrets ትክክል መሆኑን ያረጋግጡ።
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={isGenerating || !inputText.trim()}
            onClick={handleGenerateSpeech}
            className={`w-full py-4 sm:py-5 px-6 rounded-3xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-2xl transition-all duration-200 ${
              isGenerating || !inputText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] border border-indigo-400/30 ring-4 ring-indigo-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-300" />
                <span>ድምፅ በማዘጋጀት ላይ ነው... እባክዎ ይጠብቁ (Generating 24kHz Voice...)</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
                <span>
                  ድምፅ ፍጠር ({selectedVoice.name} - {selectedVoice.gender === 'female' ? 'ሴት' : 'ወንድ'} • {speedRate}x)
                </span>
              </>
            )}
          </button>
        </div>

        {/* ACTIVE AUDIO PLAYER */}
        {currentAudio && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <AudioPlayer
              audioBase64={currentAudio.audioBase64}
              mimeType={currentAudio.mimeType}
              voiceName={currentAudio.voiceName}
              textSnippet={currentAudio.text}
              initialSpeed={currentAudio.speedRate}
            />
          </div>
        )}

        {/* AUDIO LIBRARY / HISTORY */}
        <AudioHistory
          items={historyItems}
          currentPlayingId={currentAudio?.id || null}
          onPlayItem={handlePlayHistoryItem}
          onDeleteItem={handleDeleteHistoryItem}
          onClearAll={handleClearHistory}
        />
      </main>

      {/* AI COMPOSER MODAL */}
      {isAiWriterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">በ AI የአማርኛ ጽሑፍ ማመንጫ</h4>
                  <p className="text-[11px] text-slate-400">የሚፈልጉትን ርዕስ ይንገሩን፤ Gemini ጽሑፉን ያዘጋጅልዎታል</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiWriterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                የጽሑፉ ዘውግ (Category)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['ዜና', 'ተረትና ታሪክ', 'ምሳሌያዊ አነጋገር', 'ግጥም', 'ማስታወቂያ', 'የህይወት ምክር'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAiCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      aiCategory === cat
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-800/70 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                የጽሑፉ ርዕስ ወይም ዝርዝር ሃሳብ (Topic / Prompt)
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="ለምሳሌ፡ ስለ ኢትዮጵያ ታሪክ፣ ስለ ንግድ ስራ ቅናሽ፣ ስለ ጓደኝነት..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAiWriterOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                ይቅር
              </button>
              <button
                type="button"
                disabled={isComposingAi}
                onClick={handleComposeWithAi}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
              >
                {isComposingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>በመጻፍ ላይ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ጽሑፍ አመንጭ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© ድምፅ ማስተር - Amharic AI Voice Studio • በ Gemini 3.8 Audio የተጎለበተ</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>24kHz Studio Audio</span>
            <span>•</span>
            <span>ሴት እና ወንድ ድምፆች</span>
            <span>•</span>
            <span>ዝግምተኛ እና ፈጣን ፍጥነቶች</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
