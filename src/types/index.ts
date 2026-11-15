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

export type MessageRole = 'user' | 'assistant';

/**
 * All 9 mandatory voice interaction states from Section 5:
 * 1. idle
 * 2. requesting_permission
 * 3. listening
 * 4. speech_detected
 * 5. processing
 * 6. generating_response
 * 7. speaking
 * 8. paused
 * 9. error
 */
export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'speech_detected'
  | 'processing'
  | 'generating_response'
  | 'speaking'
  | 'paused'
  | 'error';

export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'MIC_UNAVAILABLE'
  | 'SPEECH_API_UNSUPPORTED'
  | 'RECOGNITION_INTERRUPTED'
  | 'EMPTY_TRANSCRIPTION'
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
  history?: Array<Pick<Message, 'role' | 'content'>>;
}

export interface VoicePipelineLatency {
  sttMs: number;
  llmMs: number;
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
  latencyMs?: number;
  cached?: boolean;
  error?: string;
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
