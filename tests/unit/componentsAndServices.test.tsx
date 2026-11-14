import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  buildConversationSteps,
  buildSystemInstruction,
  resolveGeminiModel,
} from '../../api/_lib/gemini';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { LanguageSelector } from '../../src/components/common/LanguageSelector';
import { VoiceOrb } from '../../src/components/voice/VoiceOrb';
import type { Message } from '../../src/types';

describe('Unit: UI Components & Safe Rendering', () => {
  it('renders LanguageSelector and triggers language changes across en-US, hi-IN, and kn-IN', () => {
    const onChange = vi.fn();
    render(<LanguageSelector value="en-US" onChange={onChange} />);

    const kannadaBtn = screen.getByRole('button', { name: /Kannada/i });
    fireEvent.click(kannadaBtn);
    expect(onChange).toHaveBeenCalledWith('kn-IN');

    const hindiBtn = screen.getByRole('button', { name: /Hindi/i });
    fireEvent.click(hindiBtn);
    expect(onChange).toHaveBeenCalledWith('hi-IN');
  });

  it('renders VoiceOrb accurately for idle, listening, speaking, and error states', () => {
    const { rerender } = render(<VoiceOrb state="idle" />);
    expect(screen.getByTestId('voice-orb-container')).toHaveAttribute(
      'data-voice-state',
      'idle'
    );

    rerender(<VoiceOrb state="listening" transcriptPreview="Hello Gemini" />);
    expect(screen.getByTestId('voice-orb-container')).toHaveAttribute(
      'data-voice-state',
      'listening'
    );
    expect(screen.getByText(/Hello Gemini/)).toBeInTheDocument();

    rerender(<VoiceOrb state="error" statusText="Microphone permission is required." />);
    expect(screen.getByText('Microphone permission is required.')).toBeInTheDocument();
  });

  it('escapes and never executes untrusted HTML in AI MessageBubble responses', () => {
    const maliciousMessage: Message = {
      id: 'msg-1',
      conversation_id: 'conv-1',
      role: 'assistant',
      content: '<script>window.__xssExecuted = true;</script><img src=x onerror=alert(1) />Safe text',
      input_mode: 'text',
      language: 'en-US',
      created_at: new Date().toISOString(),
    };

    const { container } = render(<MessageBubble message={maliciousMessage} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText(/Safe text/)).toBeInTheDocument();
  });
});

describe('Unit: Gemini Context Builder & Model Resolution', () => {
  it('resolves GEMINI_MODEL to gemini-4-hydrogen and replaces deprecated models', () => {
    expect(resolveGeminiModel('')).toBe('gemini-4-hydrogen');
    expect(resolveGeminiModel('gemini-2.0-flash')).toBe('gemini-4-hydrogen');
    expect(resolveGeminiModel('gemini-1.5-pro')).toBe('gemini-4-hydrogen');
    expect(resolveGeminiModel('gemini-2.5-flash')).toBe('gemini-4-hydrogen');
    expect(resolveGeminiModel('gemini-4-argon')).toBe('gemini-4-argon');
  });

  it('builds a recent-message window capped at 20 messages in chronological order', () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
      content: `Historical message ${i + 1}`,
    }));

    const steps = buildConversationSteps(history, 'Latest question', 20);
    // 20 historical steps + 1 new user_input step = 21 steps
    expect(steps.length).toBe(21);
    expect(steps[0].content[0].text).toBe('Historical message 6');
    expect(steps[steps.length - 1]).toEqual({
      type: 'user_input',
      content: [{ type: 'text', text: 'Latest question' }],
    });
  });

  it('constructs language-aware system instructions for English, Hindi, and Kannada', () => {
    expect(buildSystemInstruction('en-US')).toContain('MyVoice');
    expect(buildSystemInstruction('hi-IN')).toContain('hi-IN');
    expect(buildSystemInstruction('kn-IN')).toContain('kn-IN');
  });
});
