import React, { useCallback, useState } from 'react';
import { CharacterGallery } from '../components/character/CharacterGallery';
import { CompanionPanel } from '../components/character/CompanionPanel';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageInput } from '../components/chat/MessageInput';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AppLayout } from '../components/layout/AppLayout';
import { SettingsPanel } from '../components/settings/SettingsPanel';
import { Sidebar, type DashboardViewMode } from '../components/sidebar/Sidebar';
import { VoiceStudio } from '../components/voice/VoiceStudio';
import { useAuth } from '../hooks/useAuth';
import { useCharacter } from '../hooks/useCharacter';
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useVoiceState } from '../hooks/useVoiceState';
import type { Conversation, InputMode, Message, SupportedLanguage } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { characterId, selectCharacter } = useCharacter();
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
    deleteConversation,
    clearConversationError,
  } = useConversations();

  const speechSynthesis = useSpeechSynthesis(language);

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
    error: chatError,
    sendMessage,
    clearChatError,
  } = useChat({
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
            chatError={combinedChatError}
            voiceError={voiceError?.message || null}
            isRecognitionSupported={speechRecognition.isSupported}
            isSynthesisSupported={speechSynthesis.isSupported}
            isListening={speechRecognition.isListening}
            isSpeaking={speechSynthesis.isSpeaking}
            isPaused={speechSynthesis.isPaused}
            activeSpeakingMessageId={speechSynthesis.activeMessageId}
            hasReplayableResponse={Boolean(
              speechSynthesis.lastSpokenText || latestAssistantMessage
            )}
            selectedCharacterId={characterId}
            userDisplayName={profile?.display_name || user?.email?.split('@')[0]}
            onSelectCharacter={selectCharacter}
            onOpenVoiceStudio={() => setActiveView('studio')}
            onOpenCharacterGallery={() => setActiveView('gallery')}
            onSelectSuggestedPrompt={(prompt) => {
              void sendMessage(prompt, 'text');
            }}
            onStartListening={handleStartListening}
            onStopListening={speechRecognition.stopListening}
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
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={handleSaveProfileSettings}
        onChangeAutoDetect={setAutoDetect}
        onChangeAutoSpeak={setAutoSpeakResponses}
        onSignOut={() => void signOut()}
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
