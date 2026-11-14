import React, { type ReactNode } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { CharacterProvider } from '../hooks/useCharacter';
import { ConversationsProvider } from '../hooks/useConversations';
import { LanguagePreferenceProvider } from '../hooks/useLanguagePreference';
import { ThemeProvider } from '../hooks/useTheme';
import { VoiceStateProvider } from '../hooks/useVoiceState';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguagePreferenceProvider>
          <CharacterProvider>
            <VoiceStateProvider>
              <ConversationsProvider>{children}</ConversationsProvider>
            </VoiceStateProvider>
          </CharacterProvider>
        </LanguagePreferenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
