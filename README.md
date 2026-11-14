# PLUSH AI (MyVoice) – Meet Your Little Intelligent Companion

**PLUSH AI** (*MyVoice – AI Voice & Conversational Intelligence Platform*) is a full-stack, voice-first multilingual AI companion platform powered by **Google Gemini (`@google/genai`)**, **React + TypeScript + Tailwind CSS + Framer Motion**, **Supabase (PostgreSQL + Auth + Row Level Security)**, and **Vercel Serverless Functions**.

Users can converse naturally with Gemini using either **voice** or **text** across **English (`en-US`)**, **Hindi (`hi-IN`)**, and **Kannada (`kn-IN`)**, accompanied by five interactive, voice-reactive 3D plush companions, a dedicated **Character Gallery**, an immersive **Voice Studio**, and smooth **Light / Dark** themes.

---

## 1. Key Features

### Five Original 3D Plush Companions
Every companion features procedural 3D radial shading, fuzzy plush fabric grain (`feTurbulence`), stitched seam details, custom accessories, natural eye blinking, 3D cursor-tilt parallax, and real-time voice-reactive animations:
1. **Mellow (`mellow`)**: Beige fuzzy hooded mascot with matte black studio headphones and rosy cheeks — *Calm & Helpful*.
2. **Geni (`geni`)**: Golden-yellow triangular plush mascot with round scholarly glasses and a dapper bow tie — *Intelligent & Energetic*.
3. **Cloudy (`cloudy`)**: Fluffy sky-blue cloud character wearing a tilted Parisian black beret — *Peaceful & Thoughtful*.
4. **Bunny (`bunny`)**: Pastel baby-pink plush bunny with studio headphones and expressive long ears — *Cheerful & Encouraging*.
5. **Hearty (`hearty`)**: Lavender-purple plush heart character with glossy heart-shaped sunglasses — *Creative & Expressive*.

### Interactive Character Gallery & Voice Studio
- **Home Companion Dashboard**: Hero stage with headline *"Your AI, Your Little Companion."*, subtitle *"A little personality. A lot of intelligence."*, personalized daily greetings, prominent **Start Talking** CTA, character personality panel, and interactive 5-character selection carousel persisted in `localStorage`.
- **Character Gallery (`CharacterGallery.tsx`)**: Full showcase of all 5 companions with live expression state previewing (`Idle`, `Listening`, `Thinking`, `Speaking`, `Error`) and multilingual voice sample preview.
- **Dedicated Voice Studio (`VoiceStudio.tsx`)**: Full-stage voice environment with an XL centered 3D plush character, 360° circular radial audio visualizer + multi-band frequency bars (`VoiceVisualizer.tsx`) driven by the Web Audio API (`useAudioAnalyzer.ts`), live speech transcript, assistant response card, and studio controls.
- **Light & Dark Themes (`useTheme.ts`)**: Smooth transitions between **Pastel Daylight** (warm cream, pastel lavender, baby pink, sky blue) and **Midnight Plush** (midnight navy, deep purple, neon lavender, sky blue accents), saved in `localStorage`.

### AI Voice Conversation
- **Browser-Native Speech Recognition**: Uses `window.SpeechRecognition` with automatic fallback to `window.webkitSpeechRecognition`.
- **9 Explicit Voice Interaction States**:
  1. `idle` (Soft ambient glow)
  2. `requesting_permission` (Microphone permission check)
  3. `listening` (Expanding waveform animation)
  4. `speech_detected` (Active speech capture)
  5. `processing` (Processing recognized speech)
  6. `generating_response` (Waiting for Gemini response)
  7. `speaking` (Animated waveform during TTS playback)
  8. `paused` (Paused speech playback)
  9. `error` (Graceful error state while preserving full text chat functionality)
- **Complete Voice Controls**: Start Microphone, Stop Microphone, Cancel Listening, Pause/Resume Speaking, Stop Speaking, and Replay AI Response.
- **Browser Speech Synthesis**: Reads AI responses aloud using language-matched voices (`en-US`, `hi-IN`, `kn-IN`) via `window.speechSynthesis`.

### AI Text Chat & Context Management
- **Modern Chat Interface**: Auto-resizing textarea, `Enter` to send, `Shift+Enter` for newline, 4,000-character limit validation, duplicate submission prevention, typing indicator, copy-to-clipboard, and per-message voice playback controls.
- **Conversation Context Window**: Automatically retrieves the most recent 20 messages from the active conversation in chronological order and submits them to the Gemini Interactions API (`client.interactions.create`). Context is strictly isolated per conversation.
- **Safe Rendering**: AI responses are rendered through safe React components without `dangerouslySetInnerHTML`, preventing XSS injection.

### Multilingual Support (`en-US`, `hi-IN`, `kn-IN`)
- **Automatic Language Detection**: Detects Kannada (`\u0C80-\u0CFF`), Hindi Devanagari (`\u0900-\u097F`), and English/Romanized hints, falling back to the user's saved profile preference when uncertain.
- **Manual Language Selector**: Instant switching between English (`en-US`), Hindi (`hi-IN` / हिन्दी), and Kannada (`kn-IN` / ಕನ್ನಡ), persisted to the user's `profiles.preferred_language` in Supabase.

### Persistent Conversation History & Security
- **Supabase PostgreSQL + RLS**:
  - `profiles`: Automatically created via `on_auth_user_created` database trigger upon registration.
  - `conversations`: Stores user conversations ordered by `updated_at DESC`. Titles are generated automatically from the first user message without extra Gemini API calls.
  - `messages`: Linked to `conversations` with `ON DELETE CASCADE`. Normal authenticated clients can only insert `role = 'user'` messages; `role = 'assistant'` messages are persisted exclusively by the server after verifying user authentication and conversation ownership.

---

## 2. Project Structure

```text
myvoice/
├── public/
│   └── favicon.svg
├── api/
│   ├── _lib/
│   │   ├── gemini.ts
│   │   ├── http.ts
│   │   ├── rateLimit.ts
│   │   └── supabaseServer.ts
│   ├── conversations/
│   │   ├── index.ts
│   │   └── [id].ts
│   ├── chat.ts
│   └── health.ts
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── providers.tsx
│   │   └── router.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── chat/
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── common/
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LanguageSelector.tsx
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   ├── settings/
│   │   │   └── SettingsPanel.tsx
│   │   ├── sidebar/
│   │   │   ├── ConversationItem.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   └── Sidebar.tsx
│   │   └── voice/
│   │       ├── VoiceControls.tsx
│   │       └── VoiceOrb.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useConversations.ts
│   │   ├── useLanguagePreference.ts
│   │   ├── useSpeechRecognition.ts
│   │   ├── useSpeechSynthesis.ts
│   │   └── useVoiceState.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── SignupPage.tsx
│   ├── services/
│   │   ├── chatService.ts
│   │   ├── conversationService.ts
│   │   └── supabase.ts
│   ├── styles/
│   │   └── index.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── language.ts
│   │   └── validation.ts
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 3. Environment Variables

Copy `.env.example` to `.env` for local development and configure the same variables in your Vercel project settings:

```dotenv
# Public Frontend Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Side Secrets (NEVER expose in VITE_ variables)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-4-hydrogen

VITE_APP_NAME=MyVoice
VITE_APP_URL=http://localhost:5173
```

### Security Rules
- Only public configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_NAME`, `VITE_APP_URL`) uses the `VITE_` prefix.
- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` remain strictly server-side and are never bundled into frontend code or exposed in API responses.

---

## 4. Supabase Database Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard (or run `supabase db push` with the Supabase CLI).
3. Execute the migration file located at [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
4. In **Authentication → URL Configuration**, set:
   - **Site URL**: Your production Vercel URL (e.g., `https://myvoice.vercel.app`) and `http://localhost:5173` for local development.
   - **Redirect URLs**: `https://myvoice.vercel.app/**` and `http://localhost:5173/**`.

---

## 5. Gemini API Configuration

1. Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-4-hydrogen` in your environment variables.
3. All AI calls use the official `@google/genai` SDK (`client.interactions.create`) from the serverless backend endpoint `POST /api/chat`.

---

## 6. Local Development & Testing

```bash
# Install dependencies
npm install

# Start development server (includes local Vite middleware for /api/* routes)
npm run dev

# Run TypeScript compiler verification
npm run typecheck

# Run production build
npm run build

# Run unit & integration tests (Vitest + React Testing Library)
npm test

# Run End-to-End tests (Playwright)
npm run test:e2e
```

---

## 7. Vercel Deployment Instructions

**Vercel is the single deployment platform for both frontend and serverless backend API functions.**

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Verify the build settings (automatically detected via `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the environment variables in **Vercel Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-4-hydrogen`)
   - `VITE_APP_NAME` (`MyVoice`)
   - `VITE_APP_URL` (your Vercel production URL)
5. Deploy and verify `GET /api/health` returns `"status": "ok"`.

---

## 8. Known Browser & Operating-System Limitations

- **Speech Recognition API (`SpeechRecognition` / `webkitSpeechRecognition`)**:
  - Best supported in desktop and mobile **Google Chrome**, **Microsoft Edge**, and **Safari**.
  - **Firefox** does not enable the Web Speech Recognition API by default; when unsupported, MyVoice automatically detects this, disables the microphone trigger with a clear tooltip/notice, and preserves full text-chat and speech-synthesis functionality.
- **Speech Synthesis Voices (`window.speechSynthesis`)**:
  - Availability of native **Hindi (`hi-IN`)** and **Kannada (`kn-IN`)** TTS voices depends on the user's browser and operating system language packs. MyVoice automatically selects the best matching neural/natural voice installed on the device and falls back gracefully if a specific regional voice pack is not installed.
- **Serverless Rate Limiting**:
  - The `/api/*` routes implement sliding-window rate limiting in memory per serverless instance. For high-volume multi-region deployments, an external store can be attached without changing the API contract.
