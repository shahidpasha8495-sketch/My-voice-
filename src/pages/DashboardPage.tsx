import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CharacterGallery } from '../components/character/CharacterGallery';
import { CompanionPanel } from '../components/character/CompanionPanel';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageInput } from '../components/chat/MessageInput';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AppLayout } from '../components/layout/AppLayout';
import { SettingsPanel } from '../components/settings/SettingsPanel';
import { Sidebar, type DashboardViewMode } from '../components/sidebar/Sidebar';
import { ImmersiveCallOverlay } from '../components/voice/ImmersiveCallOverlay';
import { VoiceStudio } from '../components/voice/VoiceStudio';
import { useAuth } from '../hooks/useAuth';
import { useCharacter } from '../hooks/useCharacter';
import { useChat } from '../hooks/useChat';
import { useConnectionHealth } from '../hooks/useConnectionHealth';
import { useConversations } from '../hooks/useConversations';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useVoiceState } from '../hooks/useVoiceState';
import type {
  Conversation,
  ConversationStyleMode,
  InputMode,
  Message,
  SoundscapeType,
  SupportedLanguage,
} from '../types';
import { soundscapeEngine } from '../utils/soundEffects';

export const DashboardPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { characterId, selectCharacter } = useCharacter();
  const {
    connectionState,
    isChecking: isCheckingConnection,
    retryConnection,
  } = useConnectionHealth();
  const {
    language,
    autoDetect,
    setLanguage,
    setAutoDetect,
  } = useLanguagePreference();

  const {
    voiceState,
    stateLabel,
    voiceError,
    autoSpeakResponses,
    clearVoiceError,
    resetVoiceState,
    setAutoSpeakResponses,
  } = useVoiceState();

  const {
    conversations,
    activeConversationId,
    activeConversation,
    loading: loadingConversations,
    error: conversationError,
    selectConversation,
    startNewConversation,
    renameConversation,
    deleteConversation,
    clearConversationError,
  } = useConversations();

  const [styleMode, setStyleMode] = useState<ConversationStyleMode>('turbo');
  const [handsFreeLoop, setHandsFreeLoop] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<SoundscapeType>('off');
  const [isImmersiveCallOpen, setIsImmersiveCallOpen] = useState<boolean>(false);

  const handsFreeLoopRef = useRef<boolean>(handsFreeLoop);
  handsFreeLoopRef.current = handsFreeLoop;
  const startHandsFreeMicRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    soundscapeEngine.setSoundscape(soundscape);
    return () => {
      soundscapeEngine.stop();
    };
  }, [soundscape]);

  const speechSynthesis = useSpeechSynthesis(language, {
    onPlaybackComplete: () => {
      if (handsFreeLoopRef.current) {
        setTimeout(() => {
          startHandsFreeMicRef.current?.();
        }, 260);
      }
    },
  });

  const handleStreamStart = useCallback(
    (streamLang: SupportedLanguage, inputMode: InputMode, messageId: string) => {
      if (
        speechSynthesis.isSupported &&
        (inputMode === 'voice' || autoSpeakResponses)
      ) {
        speechSynthesis.beginStreamingSpeech(streamLang, messageId);
      }
    },
    [autoSpeakResponses, speechSynthesis]
  );

  const handleStreamSentence = useCallback(
    (
      sentence: string,
      sentenceLang: SupportedLanguage,
      inputMode: InputMode,
      messageId: string
    ) => {
      if (
        speechSynthesis.isSupported &&
        (inputMode === 'voice' || autoSpeakResponses)
      ) {
        speechSynthesis.enqueueStreamingSentence(
          sentence,
          sentenceLang,
          messageId
        );
      }
    },
    [autoSpeakResponses, speechSynthesis]
  );

  const handleStreamComplete = useCallback(
    (inputMode: InputMode) => {
      if (
        speechSynthesis.isSupported &&
        (inputMode === 'voice' || autoSpeakResponses)
      ) {
        speechSynthesis.finishStreamingSpeech();
      }
    },
    [autoSpeakResponses, speechSynthesis]
  );

  const handleAssistantResponse = useCallback(
    (assistantMessage: Message, inputMode: InputMode) => {
      if (
        speechSynthesis.isSupported &&
        (inputMode === 'voice' || autoSpeakResponses)
      ) {
        const responseLang =
          (assistantMessage.language as SupportedLanguage) || language;
        speechSynthesis.speak(
          assistantMessage.content,
          responseLang,
          assistantMessage.id
        );
      }
    },
    [autoSpeakResponses, language, speechSynthesis]
  );

  const {
    messages,
    isLoadingHistory,
    isSending,
    streamingMessageId,
    error: chatError,
    lastFirstTokenMs,
    lastLlmLatencyMs,
    lastResponseCached,
    sendMessage,
    clearChatError,
  } = useChat({
    styleMode,
    onStreamStart: handleStreamStart,
    onStreamSentence: handleStreamSentence,
    onStreamComplete: handleStreamComplete,
    onAssistantResponse: handleAssistantResponse,
  });

  const handleVoiceTranscriptReady = useCallback(
    (recognizedText: string, recognizedLang: SupportedLanguage) => {
      if (!recognizedText.trim()) return;
      void sendMessage(recognizedText, 'voice', recognizedLang);
    },
    [sendMessage]
  );

  const speechRecognition = useSpeechRecognition({
    language,
    turboMode: styleMode === 'turbo',
    onTranscriptReady: handleVoiceTranscriptReady,
  });

  const [activeView, setActiveView] = useState<DashboardViewMode>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  const handleStartListening = useCallback(() => {
    if (speechSynthesis.isSpeaking) {
      speechSynthesis.stop();
    }
    void speechRecognition.startListening(language);
  }, [language, speechRecognition, speechSynthesis]);

  useEffect(() => {
    startHandsFreeMicRef.current = handleStartListening;
  }, [handleStartListening]);

  const handleStartPushToTalk = useCallback(() => {
    if (speechSynthesis.isSpeaking) {
      speechSynthesis.stop();
    }
    void speechRecognition.startPushToTalk(language);
  }, [language, speechRecognition, speechSynthesis]);

  // Global Spacebar Push-to-Talk hotkey when not typing inside an input/textarea
  useEffect(() => {
    if (!speechRecognition.isSupported) return;
    let isSpaceHeld = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const targetTag = (e.target as HTMLElement | null)?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(targetTag)) {
        return;
      }
      e.preventDefault();
      isSpaceHeld = true;
      handleStartPushToTalk();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !isSpaceHeld) return;
      e.preventDefault();
      isSpaceHeld = false;
      speechRecognition.stopPushToTalk();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleStartPushToTalk, speechRecognition]);

  const handleNewConversation = useCallback(() => {
    speechRecognition.cancelListening();
    speechSynthesis.stop();
    resetVoiceState();
    startNewConversation();
  }, [resetVoiceState, speechRecognition, speechSynthesis, startNewConversation]);

  const handleSelectConversation = useCallback(
    (convId: string) => {
      speechRecognition.cancelListening();
      speechSynthesis.stop();
      resetVoiceState();
      selectConversation(convId);
    },
    [resetVoiceState, selectConversation, speechRecognition, speechSynthesis]
  );

  const handleConfirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    setIsDeletingConversation(true);
    await deleteConversation(conversationToDelete.id);
    setIsDeletingConversation(false);
    setConversationToDelete(null);
  };

  const handleSaveProfileSettings = async (updates: {
    displayName: string;
    preferredLanguage: SupportedLanguage;
  }): Promise<boolean> => {
    await setLanguage(updates.preferredLanguage);
    return updateProfile({
      display_name: updates.displayName,
      preferred_language: updates.preferredLanguage,
    });
  };

  const liveTranscriptPreview =
    speechRecognition.interimTranscript || speechRecognition.transcript;

  const latestAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant');

  const handleReplayResponse = useCallback(() => {
    if (speechSynthesis.lastSpokenText) {
      speechSynthesis.replay();
    } else if (latestAssistantMessage) {
      speechSynthesis.speak(
        latestAssistantMessage.content,
        (latestAssistantMessage.language as SupportedLanguage) || language,
        latestAssistantMessage.id
      );
    }
  }, [language, latestAssistantMessage, speechSynthesis]);

  const combinedChatError = chatError || conversationError;

  const sidebarNode = (closeMobile?: () => void) => (
    <Sidebar
      conversations={conversations}
      activeConversationId={activeConversationId}
      loadingConversations={loadingConversations}
      userProfile={profile}
      userEmail={user?.email}
      activeView={activeView}
      selectedCharacterId={characterId}
      onChangeView={setActiveView}
      onNewConversation={handleNewConversation}
      onSelectConversation={handleSelectConversation}
      onRequestDeleteConversation={(conv) => setConversationToDelete(conv)}
      onRenameConversation={(convId, newTitle) =>
        renameConversation(convId, newTitle)
      }
      onOpenSettings={() => setIsSettingsOpen(true)}
      onSignOut={() => void signOut()}
      onCloseMobile={closeMobile}
    />
  );

  return (
    <>
      <AppLayout
        sidebar={sidebarNode()}
        mobileSidebar={sidebarNode(() => setIsMobileSidebarOpen(false))}
        rightPanel={
          activeView === 'chat' ? (
            <CompanionPanel
              selectedCharacterId={characterId}
              voiceState={voiceState}
              language={language}
              autoSpeak={autoSpeakResponses}
              isListening={speechRecognition.isListening}
              isSpeaking={speechSynthesis.isSpeaking}
              onSelectCharacter={selectCharacter}
              onStartListening={handleStartListening}
              onStopListening={speechRecognition.stopListening}
              onOpenStudio={() => setActiveView('studio')}
              onOpenGallery={() => setActiveView('gallery')}
            />
          ) : undefined
        }
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
      >
        <ChatHeader
          conversationTitle={activeConversation?.title || 'New Conversation'}
          language={language}
          autoSpeak={autoSpeakResponses}
          isListening={speechRecognition.isListening}
          activeView={activeView}
          selectedCharacterId={characterId}
          connectionState={connectionState}
          isCheckingConnection={isCheckingConnection}
          onRetryConnection={() => void retryConnection()}
          onChangeView={setActiveView}
          onLanguageChange={(nextLang) => void setLanguage(nextLang)}
          onToggleAutoSpeak={() => setAutoSpeakResponses(!autoSpeakResponses)}
          onNewConversation={handleNewConversation}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {activeView === 'gallery' ? (
          <CharacterGallery
            selectedCharacterId={characterId}
            language={language}
            onSelectCharacter={selectCharacter}
            onPreviewVoice={(text, lang) => {
              if (speechSynthesis.isSupported) {
                speechSynthesis.speak(text, lang);
              }
            }}
            onStartTalkingWithCharacter={(id) => {
              selectCharacter(id);
              setActiveView('chat');
            }}
          />
        ) : activeView === 'studio' ? (
          <VoiceStudio
            characterId={characterId}
            voiceState={voiceState}
            statusLabel={stateLabel}
            language={language}
            liveTranscript={liveTranscriptPreview}
            messages={messages}
            autoSpeak={autoSpeakResponses}
            isRecognitionSupported={speechRecognition.isSupported}
            isSynthesisSupported={speechSynthesis.isSupported}
            isListening={speechRecognition.isListening}
            isSpeaking={speechSynthesis.isSpeaking}
            isPaused={speechSynthesis.isPaused}
            isSending={isSending}
            volume={speechSynthesis.volume}
            isMuted={speechSynthesis.isMuted}
            availableVoices={speechSynthesis.availableVoices}
            selectedVoiceURI={speechSynthesis.selectedVoiceURI}
            onVolumeChange={speechSynthesis.setVolume}
            onToggleMute={speechSynthesis.toggleMute}
            onSelectVoiceURI={speechSynthesis.setSelectedVoiceURI}
            onSelectCharacter={selectCharacter}
            onStartListening={handleStartListening}
            onStopListening={speechRecognition.stopListening}
            onCancelListening={speechRecognition.cancelListening}
            onToggleAutoSpeak={() => setAutoSpeakResponses(!autoSpeakResponses)}
            onPauseSpeaking={speechSynthesis.pause}
            onResumeSpeaking={speechSynthesis.resume}
            onStopSpeaking={speechSynthesis.stop}
            onReplayResponse={handleReplayResponse}
            onSpeakMessage={(text, lang, msgId) =>
              speechSynthesis.speak(text, lang, msgId)
            }
          />
        ) : (
          <ChatWindow
            messages={messages}
            language={language}
            voiceState={voiceState}
            voiceStatusLabel={stateLabel}
            liveTranscriptPreview={liveTranscriptPreview}
            isLoadingHistory={isLoadingHistory}
            isSending={isSending}
            streamingMessageId={streamingMessageId}
            chatError={combinedChatError}
            voiceError={voiceError?.message || null}
            isRecognitionSupported={speechRecognition.isSupported}
            isSynthesisSupported={speechSynthesis.isSupported}
            isListening={speechRecognition.isListening}
            isPushToTalk={speechRecognition.isPushToTalk}
            isSpeaking={speechSynthesis.isSpeaking}
            isPaused={speechSynthesis.isPaused}
            isMuted={speechSynthesis.isMuted}
            volume={speechSynthesis.volume}
            activeSpeakingMessageId={speechSynthesis.activeMessageId}
            hasReplayableResponse={Boolean(
              speechSynthesis.lastSpokenText || latestAssistantMessage
            )}
            selectedCharacterId={characterId}
            userDisplayName={profile?.display_name || user?.email?.split('@')[0]}
            styleMode={styleMode}
            handsFreeLoop={handsFreeLoop}
            soundscape={soundscape}
            sttLatencyMs={speechRecognition.lastSttLatencyMs}
            firstTokenMs={lastFirstTokenMs}
            llmLatencyMs={lastLlmLatencyMs}
            ttsLatencyMs={speechSynthesis.lastTtsLatencyMs}
            isCachedResponse={lastResponseCached}
            onChangeStyleMode={setStyleMode}
            onToggleHandsFreeLoop={() => setHandsFreeLoop((prev) => !prev)}
            onChangeSoundscape={setSoundscape}
            onOpenImmersiveCall={() => setIsImmersiveCallOpen(true)}
            onRetryConnection={() => void retryConnection()}
            onToggleMute={speechSynthesis.toggleMute}
            onVolumeChange={speechSynthesis.setVolume}
            onSelectCharacter={selectCharacter}
            onOpenVoiceStudio={() => setActiveView('studio')}
            onOpenCharacterGallery={() => setActiveView('gallery')}
            onSelectSuggestedPrompt={(prompt) => {
              void sendMessage(prompt, 'text');
            }}
            onStartListening={handleStartListening}
            onStopListening={speechRecognition.stopListening}
            onStartPushToTalk={handleStartPushToTalk}
            onStopPushToTalk={speechRecognition.stopPushToTalk}
            onCancelListening={speechRecognition.cancelListening}
            onSpeakMessage={(text, lang, msgId) =>
              speechSynthesis.speak(text, lang, msgId)
            }
            onStopSpeaking={speechSynthesis.stop}
            onPauseSpeaking={speechSynthesis.pause}
            onResumeSpeaking={speechSynthesis.resume}
            onReplayResponse={handleReplayResponse}
            onDismissChatError={() => {
              clearChatError();
              clearConversationError();
            }}
            onDismissVoiceError={clearVoiceError}
          />
        )}

        {activeView !== 'gallery' && (
          <MessageInput
            language={language}
            isSending={isSending}
            isListening={speechRecognition.isListening}
            isRecognitionSupported={speechRecognition.isSupported}
            liveTranscript={liveTranscriptPreview}
            onSendMessage={async (text) => {
              await sendMessage(text, 'text');
            }}
            onStartVoice={handleStartListening}
            onStopVoice={speechRecognition.stopListening}
          />
        )}
      </AppLayout>

      <SettingsPanel
        isOpen={isSettingsOpen}
        displayName={
          profile?.display_name || user?.email?.split('@')[0] || 'User'
        }
        userEmail={user?.email}
        preferredLanguage={language}
        autoDetectLanguage={autoDetect}
        autoSpeakResponses={autoSpeakResponses}
        isRecognitionSupported={speechRecognition.isSupported}
        isSynthesisSupported={speechSynthesis.isSupported}
        availableVoicesCount={speechSynthesis.availableVoices.length}
        availableVoices={speechSynthesis.availableVoices}
        selectedVoiceURI={speechSynthesis.selectedVoiceURI}
        volume={speechSynthesis.volume}
        selectedCharacterId={characterId}
        onSelectVoiceURI={speechSynthesis.setSelectedVoiceURI}
        onVolumeChange={speechSynthesis.setVolume}
        onSelectCharacter={selectCharacter}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={handleSaveProfileSettings}
        onChangeAutoDetect={setAutoDetect}
        onChangeAutoSpeak={setAutoSpeakResponses}
        onSignOut={() => void signOut()}
      />

      <ImmersiveCallOverlay
        isOpen={isImmersiveCallOpen}
        characterId={characterId}
        language={language}
        voiceState={voiceState}
        voiceStatusLabel={stateLabel}
        liveTranscript={liveTranscriptPreview}
        latestAssistantMessage={latestAssistantMessage}
        isListening={speechRecognition.isListening}
        isPushToTalk={speechRecognition.isPushToTalk}
        isSpeaking={speechSynthesis.isSpeaking}
        isMuted={speechSynthesis.isMuted}
        handsFreeLoop={handsFreeLoop}
        firstTokenMs={lastFirstTokenMs}
        ttsLatencyMs={speechSynthesis.lastTtsLatencyMs}
        onStartListening={handleStartListening}
        onStopListening={speechRecognition.stopListening}
        onStartPushToTalk={handleStartPushToTalk}
        onStopPushToTalk={speechRecognition.stopPushToTalk}
        onStopSpeaking={speechSynthesis.stop}
        onToggleMute={speechSynthesis.toggleMute}
        onToggleHandsFreeLoop={() => setHandsFreeLoop((prev) => !prev)}
        onClose={() => setIsImmersiveCallOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(conversationToDelete)}
        title="Delete Conversation"
        description={
          conversationToDelete
            ? `Are you sure you want to permanently delete "${conversationToDelete.title}" and all its messages? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Conversation"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeletingConversation}
        onConfirm={() => void handleConfirmDeleteConversation()}
        onCancel={() => setConversationToDelete(null)}
      />
    </>
  );
};
