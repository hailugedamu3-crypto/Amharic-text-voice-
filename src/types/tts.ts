export type VoiceGender = 'female' | 'male';

export interface VoicePersona {
  id: string;
  name: string;
  latinName: string;
  gender: VoiceGender;
  geminiVoice: 'Kore' | 'Charon' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Aoede';
  badge: string;
  category: 'news' | 'story' | 'casual' | 'radio' | 'calm' | 'education' | 'elder' | 'kids' | 'poetry';
  categoryLabel: string;
  description: string;
  stylePrompt: string;
  accentColor: string;
  avatarIcon: string;
  sampleText: string;
  tags: string[];
}

export interface SpeedPreset {
  id: string;
  name: string;
  latinName: string;
  rate: number;
  description: string;
  promptPacing: string;
}

export interface MoodPreset {
  id: string;
  name: string;
  icon: string;
  promptMood: string;
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  gender: VoiceGender;
  badge: string;
  speedRate: number;
  speedLabel: string;
  moodLabel: string;
  pitchSemitones: number;
  audioBase64: string;
  mimeType: string;
  createdAt: number;
  durationSeconds?: number;
}
