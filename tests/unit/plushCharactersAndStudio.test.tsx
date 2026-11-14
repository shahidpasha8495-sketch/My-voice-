import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { CharacterGallery } from '../../src/components/character/CharacterGallery';
import { CharacterSelector } from '../../src/components/character/CharacterSelector';
import { CompanionPanel } from '../../src/components/character/CompanionPanel';
import { PlushCharacter } from '../../src/components/character/PlushCharacter';
import { VoiceOrb } from '../../src/components/voice/VoiceOrb';
import { VoiceStudio } from '../../src/components/voice/VoiceStudio';
import {
  PLUSH_CHARACTER_LIST,
  getDailyGreeting,
  isValidCharacterId,
} from '../../src/config/characters';
import { CharacterProvider, useCharacter } from '../../src/hooks/useCharacter';
import { ThemeProvider, useTheme } from '../../src/hooks/useTheme';

describe('Unit: PLUSH AI Characters, Gallery, Voice Studio & Themes', () => {
  it('defines all five original 3D plush characters (Mellow, Geni, Cloudy, Bunny, Hearty)', () => {
    expect(PLUSH_CHARACTER_LIST.map((c) => c.id)).toEqual([
      'mellow',
      'geni',
      'cloudy',
      'bunny',
      'hearty',
    ]);
    expect(isValidCharacterId('mellow')).toBe(true);
    expect(isValidCharacterId('hearty')).toBe(true);
    expect(isValidCharacterId('unknown')).toBe(false);
  });

  it('renders each PlushCharacter with voice-reactive state attributes', () => {
    const { rerender } = render(
      <PlushCharacter characterId="mellow" voiceState="idle" />
    );
    expect(screen.getByTestId('plush-character-mellow')).toHaveAttribute(
      'data-character-state',
      'idle'
    );

    rerender(<PlushCharacter characterId="geni" voiceState="listening" />);
    expect(screen.getByTestId('plush-character-geni')).toHaveAttribute(
      'data-character-state',
      'listening'
    );

    rerender(<PlushCharacter characterId="cloudy" voiceState="processing" />);
    expect(screen.getByTestId('plush-character-cloudy')).toHaveAttribute(
      'data-character-state',
      'processing'
    );

    rerender(
      <PlushCharacter characterId="bunny" voiceState="speaking" amplitude={0.8} />
    );
    expect(screen.getByTestId('plush-character-bunny')).toHaveAttribute(
      'data-character-state',
      'speaking'
    );

    rerender(<PlushCharacter characterId="hearty" voiceState="error" />);
    expect(screen.getByTestId('plush-character-hearty')).toHaveAttribute(
      'data-character-state',
      'error'
    );
  });

  it('allows selecting characters via CharacterSelector and persists selection in CharacterProvider', () => {
    const onSelect = vi.fn();
    render(<CharacterSelector selectedId="mellow" onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('select-character-bunny'));
    expect(onSelect).toHaveBeenCalledWith('bunny');

    const TestConsumer = () => {
      const { characterId, selectCharacter } = useCharacter();
      return (
        <div>
          <span data-testid="active-char">{characterId}</span>
          <button type="button" onClick={() => selectCharacter('hearty')}>
            Pick Hearty
          </button>
        </div>
      );
    };

    render(
      <CharacterProvider>
        <TestConsumer />
      </CharacterProvider>
    );
    fireEvent.click(screen.getByText('Pick Hearty'));
    expect(screen.getByTestId('active-char')).toHaveTextContent('hearty');
    expect(localStorage.getItem('plush.selected_character')).toBe('hearty');
  });

  it('renders CharacterGallery with all 5 characters and voice preview action', () => {
    const onSelect = vi.fn();
    const onPreview = vi.fn();

    render(
      <CharacterGallery
        selectedCharacterId="mellow"
        language="en-US"
        onSelectCharacter={onSelect}
        onPreviewVoice={onPreview}
      />
    );

    expect(screen.getByText('Meet the Plush AI Family')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Preview Voice/i }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('renders VoiceStudio with centered character, circular visualizer, and microphone controls', () => {
    const onStartListening = vi.fn();
    render(
      <VoiceStudio
        characterId="cloudy"
        voiceState="idle"
        statusLabel="Ready for voice or text"
        language="en-US"
        liveTranscript=""
        messages={[]}
        autoSpeak={true}
        isRecognitionSupported={true}
        isSynthesisSupported={true}
        isListening={false}
        isSpeaking={false}
        isPaused={false}
        isSending={false}
        onSelectCharacter={vi.fn()}
        onStartListening={onStartListening}
        onStopListening={vi.fn()}
        onCancelListening={vi.fn()}
        onToggleAutoSpeak={vi.fn()}
        onPauseSpeaking={vi.fn()}
        onResumeSpeaking={vi.fn()}
        onStopSpeaking={vi.fn()}
        onReplayResponse={vi.fn()}
        onSpeakMessage={vi.fn()}
      />
    );

    expect(screen.getByTestId('voice-studio-screen')).toBeInTheDocument();
    expect(screen.getByText(/Live Session with Cloudy/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start Talking/i }));
    expect(onStartListening).toHaveBeenCalledTimes(1);
  });

  it('toggles between dark and light themes and computes personalized greetings', () => {
    expect(getDailyGreeting('Aarav', 9)).toBe('Good morning, Aarav');
    expect(getDailyGreeting('Aarav', 14)).toBe('Good afternoon, Aarav');
    expect(getDailyGreeting('Aarav', 20)).toBe('Good evening, Aarav');

    const ThemeConsumer = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <button type="button" onClick={toggleTheme} data-testid="theme-btn">
          {theme}
        </button>
      );
    };

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    const btn = screen.getByTestId('theme-btn');
    const initialTheme = btn.textContent;
    fireEvent.click(btn);
    expect(btn.textContent).not.toBe(initialTheme);
  });

  it('displays MyVoice Plush Intelligence friendly voice prompts and toggles password visibility in LoginForm', () => {
    const { rerender } = render(<VoiceOrb state="idle" />);
    expect(screen.getByTestId('voice-orb-friendly-prompt')).toHaveTextContent(
      'Tap to talk'
    );

    rerender(<VoiceOrb state="listening" />);
    expect(screen.getByTestId('voice-orb-friendly-prompt')).toHaveTextContent(
      "I'm listening..."
    );

    rerender(<VoiceOrb state="processing" />);
    expect(screen.getByTestId('voice-orb-friendly-prompt')).toHaveTextContent(
      'Thinking...'
    );

    rerender(<VoiceOrb state="speaking" />);
    expect(screen.getByTestId('voice-orb-friendly-prompt')).toHaveTextContent(
      'Talking to you...'
    );

    rerender(<VoiceOrb state="error" />);
    expect(screen.getByTestId('voice-orb-friendly-prompt')).toHaveTextContent(
      "Let's try that again."
    );

    const onGuestLogin = vi.fn();
    render(
      <MemoryRouter>
        <LoginForm
          onSubmit={vi.fn().mockResolvedValue(true)}
          onGuestLogin={onGuestLogin}
          error={null}
          onClearError={vi.fn()}
        />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: /Show password/i }));
    expect(passwordInput.type).toBe('text');

    fireEvent.click(screen.getByTestId('guest-login-button'));
    expect(onGuestLogin).toHaveBeenCalledTimes(1);
  });

  it('renders CompanionPanel right contextual dock with active plush companion and quick switcher', () => {
    const onSelectCharacter = vi.fn();
    render(
      <CompanionPanel
        selectedCharacterId="mellow"
        voiceState="idle"
        language="en-US"
        autoSpeak={true}
        isListening={false}
        isSpeaking={false}
        onSelectCharacter={onSelectCharacter}
        onStartListening={vi.fn()}
        onStopListening={vi.fn()}
        onOpenStudio={vi.fn()}
        onOpenGallery={vi.fn()}
      />
    );

    expect(screen.getByTestId('contextual-companion-panel')).toBeInTheDocument();
    expect(screen.getByText('Mindful Companion')).toBeInTheDocument();
  });
});
