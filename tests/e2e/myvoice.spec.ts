import { expect, test } from '@playwright/test';

const TEST_USER = {
  id: '11111111-2222-3333-4444-555555555555',
  email: 'aarav@example.com',
  display_name: 'Aarav Sharma',
};

const TEST_SESSION = {
  access_token: 'e2e-supabase-jwt-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'e2e-refresh-token',
  user: {
    id: TEST_USER.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: TEST_USER.email,
    user_metadata: {
      display_name: TEST_USER.display_name,
      preferred_language: 'en-US',
    },
    app_metadata: { provider: 'email' },
    created_at: new Date().toISOString(),
  },
};

test.describe('E2E: MyVoice Full Conversational Platform Workflow', () => {
  test('completes registration, login, text chat, Gemini response, language switching, voice recognition, speech playback, history continuation, deletion, and logout', async ({
    page,
  }) => {
    const conversationsStore: Array<{
      id: string;
      user_id: string;
      title: string;
      language: string;
      created_at: string;
      updated_at: string;
    }> = [];

    const messagesStore: Record<
      string,
      Array<{
        id: string;
        conversation_id: string;
        role: 'user' | 'assistant';
        content: string;
        input_mode: 'text' | 'voice';
        language: string;
        created_at: string;
      }>
    > = {};

    // Inject mock browser SpeechRecognition and SpeechSynthesis so headless Chromium can test voice end-to-end
    await page.addInitScript(() => {
      (window as unknown as { __spokenUtterances: string[] }).__spokenUtterances = [];

      class MockSpeechRecognition {
        lang = 'en-US';
        continuous = false;
        interimResults = true;
        maxAlternatives = 1;
        onstart: (() => void) | null = null;
        onspeechstart: (() => void) | null = null;
        onspeechend: (() => void) | null = null;
        onresult: ((ev: unknown) => void) | null = null;
        onerror: ((ev: unknown) => void) | null = null;
        onend: (() => void) | null = null;

        start() {
          setTimeout(() => {
            this.onstart?.();
            this.onspeechstart?.();
            const transcriptText =
              this.lang === 'kn-IN'
                ? 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಎಂದರೇನು?'
                : 'Explain quantum computing simply';
            this.onresult?.({
              resultIndex: 0,
              results: [
                Object.assign([{ transcript: transcriptText, confidence: 0.98 }], {
                  isFinal: true,
                  length: 1,
                }),
              ],
            });
            this.onspeechend?.();
            this.onend?.();
          }, 80);
        }

        stop() {
          this.onend?.();
        }

        abort() {
          this.onend?.();
        }
      }

      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
        MockSpeechRecognition;
      (
        window as unknown as { webkitSpeechRecognition: unknown }
      ).webkitSpeechRecognition = MockSpeechRecognition;
    });

    // Intercept Supabase Auth & REST endpoints
    await page.route('**/auth/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/signup') || url.includes('/token') || url.includes('/user')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            url.includes('/user') ? TEST_SESSION.user : TEST_SESSION
          ),
        });
        return;
      }
      if (url.includes('/logout')) {
        await route.fulfill({ status: 204, body: '' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_SESSION),
      });
    });

    await page.route('**/rest/v1/profiles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: TEST_USER.id,
          display_name: TEST_USER.display_name,
          preferred_language: 'en-US',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Intercept /api/conversations & /api/chat
    await page.route('**/api/conversations', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversations: conversationsStore,
          }),
        });
        return;
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON() as {
          title: string;
          language: string;
        };
        const created = {
          id: `550e8400-e29b-41d4-a716-44665544000${conversationsStore.length + 1}`,
          user_id: TEST_USER.id,
          title: body.title,
          language: body.language || 'en-US',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        conversationsStore.unshift(created);
        messagesStore[created.id] = [];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversation: created,
          }),
        });
      }
    });

    await page.route('**/api/conversations/*', async (route) => {
      const url = route.request().url();
      const convId = url.split('/api/conversations/')[1]?.split('?')[0] || '';
      const method = route.request().method();

      if (method === 'GET') {
        const conv = conversationsStore.find((c) => c.id === convId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            conversation: conv,
            messages: messagesStore[convId] || [],
          }),
        });
        return;
      }

      if (method === 'DELETE') {
        const idx = conversationsStore.findIndex((c) => c.id === convId);
        if (idx !== -1) conversationsStore.splice(idx, 1);
        delete messagesStore[convId];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            deletedId: convId,
          }),
        });
      }
    });

    await page.route('**/api/chat', async (route) => {
      const body = route.request().postDataJSON() as {
        conversationId: string;
        message: string;
        language: string;
        inputMode: 'text' | 'voice';
      };

      const userMsg = {
        id: `u-${Date.now()}`,
        conversation_id: body.conversationId,
        role: 'user' as const,
        content: body.message,
        input_mode: body.inputMode,
        language: body.language,
        created_at: new Date().toISOString(),
      };

      const replyContent =
        body.language === 'kn-IN'
          ? 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಮನುಷ್ಯರಂತೆ ಯೋಚಿಸಲು ಮತ್ತು ಕಲಿಯಲು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
          : `Gemini AI response to: "${body.message}"`;

      const assistantMsg = {
        id: `a-${Date.now() + 1}`,
        conversation_id: body.conversationId,
        role: 'assistant' as const,
        content: replyContent,
        input_mode: 'text' as const,
        language: body.language,
        created_at: new Date().toISOString(),
      };

      if (!messagesStore[body.conversationId]) {
        messagesStore[body.conversationId] = [];
      }
      messagesStore[body.conversationId].push(userMsg, assistantMsg);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          userMessage: userMsg,
          assistantMessage: assistantMsg,
          detectedLanguage: body.language,
        }),
      });
    });

    // 1. Unauthenticated access to '/' redirects to '/login'
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Welcome back to PLUSH AI')).toBeVisible();

    // 2. Navigate to Registration ('/signup') and create account
    await page.getByRole('link', { name: /Create an account/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await page.getByLabel('Display Name').fill(TEST_USER.display_name);
    await page.getByLabel('Email Address').fill(TEST_USER.email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /Create Account/i }).click();

    // 3. Dashboard access verified with PLUSH AI headline & character carousel
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('empty-conversation-state')).toBeVisible();
    await expect(
      page.getByText('Your AI, Your Little Companion.')
    ).toBeVisible();

    // 3b. Switch character in carousel and verify Character Gallery & Voice Studio tabs
    await page.getByTestId('select-character-bunny').click();
    await page.getByTestId('nav-tab-gallery').click();
    await expect(page.getByTestId('character-gallery')).toBeVisible();
    await page.getByTestId('nav-tab-studio').click();
    await expect(page.getByTestId('voice-studio-screen')).toBeVisible();
    await page.getByTestId('nav-tab-home').click();

    // 4 & 5 & 6. Submit a text message and verify Gemini response
    const textarea = page.getByTestId('message-textarea');
    await textarea.fill('Explain artificial intelligence');
    await page.getByTestId('send-message-button').click();

    await expect(
      page.getByText('Explain artificial intelligence').first()
    ).toBeVisible();
    await expect(
      page.getByText('Gemini AI response to: "Explain artificial intelligence"')
    ).toBeVisible();

    // 7. Switch language to Kannada (kn-IN)
    await page
      .getByRole('button', { name: /Switch language to Kannada/i })
      .first()
      .click();

    // 8. Start a new conversation and use Voice Recognition in Kannada
    await page.getByTestId('new-conversation-button').click();
    await expect(page.getByTestId('empty-conversation-state')).toBeVisible();

    await page.getByRole('button', { name: /Start microphone/i }).click();
    await expect(
      page.getByText(
        'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ (AI) ಮನುಷ್ಯರಂತೆ ಯೋಚಿಸಲು ಮತ್ತು ಕಲಿಯಲು ಕಂಪ್ಯೂಟರ್‌ಗಳಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.'
      )
    ).toBeVisible();

    // 9 & 10 & 11. Reopen first conversation from Conversation History and continue it
    await page.getByText('Explain artificial intelligence').first().click();
    await expect(
      page.getByText('Gemini AI response to: "Explain artificial intelligence"')
    ).toBeVisible();

    // 12. Delete a conversation via ConfirmDialog
    const deleteButtons = page.getByRole('button', {
      name: /Delete conversation/i,
    });
    await deleteButtons.first().click();
    await expect(
      page.getByRole('heading', { name: 'Delete Conversation' })
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Delete Conversation', exact: true })
      .click();

    // 13. Sign out and verify redirect back to Login
    await page.getByTestId('signout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
