
export enum AppMode {
  CHAT = 'CHAT',
  VOICE = 'VOICE',
  SEARCH = 'SEARCH'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface VoiceState {
  isActive: boolean;
  isConnecting: boolean;
  transcription: string;
  aiTranscription: string;
}
