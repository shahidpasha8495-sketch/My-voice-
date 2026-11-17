export type SupportedLanguage =
  | 'en-US'
  | 'hi-IN'
  | 'kn-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'ml-IN'
  | 'bn-IN'
  | 'es-ES'
  | 'fr-FR'
  | 'de-DE'
  | 'ar-SA';

export type BackgroundThemeId =
  | 'aurora-galaxy'
  | 'deep-space'
  | 'neon-cyberpunk'
  | 'ocean-dreams'
  | 'sunset-gradient'
  | 'minimal-light';

export type CompanionExpression =
  | 'happy'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'confused'
  | 'sad'
  | 'sleeping'
  | 'celebrating';

export type ConnectionState = 'online' | 'connecting' | 'offline';

export type InputMode = 'text' | 'voice';

export type ConversationStyleMode =
  | 'turbo'
  | 'tutor'
  | 'brainstorm'
  | 'calm'
  | 'coder';

export type SoundscapeType = 'off' | 'rain' | 'aurora';

export type MessageRole = 'user' | 'assistant';

/**
 * Synchronized voice & mobile recording interaction states:
 * 1. idle
 * 2. requesting_permission (Permission requested)
 * 3. listening (Web Speech API active)
 * 4. speech_detected (Speech captured)
 * 5. recording (MediaRecorder mobile audio fallback)
 * 6. transcribing (Uploading & Gemini audio transcription)
 * 7. processing (Preparing AI request / speech stop)
 * 8. generating_response (Gemini streaming response)
 * 9. speaking (Speech synthesis playback active)
 * 10. paused
 * 11. completed
 * 12. error
 */
export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'speech_detected'
  | 'recording'
  | 'transcribing'
  | 'processing'
  | 'generating_response'
  | 'speaking'
  | 'paused'
  | 'completed'
  | 'error';

export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'MIC_UNAVAILABLE'
  | 'SPEECH_API_UNSUPPORTED'
  | 'RECOGNITION_INTERRUPTED'
  | 'EMPTY_TRANSCRIPTION'
  | 'RECORDING_FAILED'
  | 'TRANSCRIPTION_FAILED'
  | 'AUDIO_TOO_LARGE'
  | 'SYNTHESIS_UNAVAILABLE'
  | 'UNKNOWN_VOICE_ERROR';

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
}

export interface LanguageMetadata {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  shortLabel: string;
  speechRecognitionLang: string;
  speechSynthesisLang: string;
  welcomeSubtitle: string;
  voicePromptHint: string;
  suggestedPrompts: Array<{
    label: string;
    prompt: string;
    category: string;
  }>;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string | null;
  preferred_language: SupportedLanguage;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  language: SupportedLanguage;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  input_mode: InputMode;
  language: SupportedLanguage | null;
  created_at: string;
}

export interface ChatRequestPayload {
  conversationId: string;
  message: string;
  language: SupportedLanguage;
  inputMode: InputMode;
  characterId?: string;
  styleMode?: ConversationStyleMode;
  stream?: boolean;
  history?: Array<Pick<Message, 'role' | 'content'>>;
}

export interface VoicePipelineLatency {
  sttMs: number;
  llmMs: number;
  firstTokenMs?: number;
  ttsStartMs: number;
  totalMs: number;
  cached: boolean;
  timestamp: string;
}

export interface ChatResponsePayload {
  success: boolean;
  userMessage: Message;
  assistantMessage: Message;
  conversation?: Conversation;
  detectedLanguage?: SupportedLanguage;
  firstTokenMs?: number;
  latencyMs?: number;
  cached?: boolean;
  interrupted?: boolean;
  error?: string;
}

export interface TranscribeRequestPayload {
  audioBase64: string;
  mimeType: string;
  language: SupportedLanguage;
  durationSeconds?: number;
}

export interface TranscribeResponsePayload {
  success: boolean;
  transcript: string;
  language: SupportedLanguage;
  confidence?: number;
  provider?: string;
  error?: string;
  code?: string;
}

export interface ConversationsListResponse {
  success: boolean;
  conversations: Conversation[];
  error?: string;
}

export interface ConversationDetailResponse {
  success: boolean;
  conversation: Conversation;
  messages: Message[];
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  version: string;
  capabilities: {
    geminiConfigured: boolean;
    supabaseConfigured: boolean;
    supportedLanguages: SupportedLanguage[];
  };
}
