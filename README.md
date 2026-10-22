# Synapse

Synapse is a student study workspace built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable key, plus a server-side `GROQ_API_KEY`. `GROQ_CHAT_MODEL` is optional.
3. Run the SQL files in `supabase/migrations/` in date order in the Supabase SQL Editor. The second migration adds persistent chats, notes, flashcards, and quiz attempts.
4. In Supabase Authentication, enable email/password sign-in. For Google sign-in, enable the Google provider, configure its OAuth credentials, and add Supabase's Google callback URL in Google Cloud.
5. Add `http://localhost:3000/auth/callback` to the Supabase project's allowed redirect URLs.
6. Start the app with `npm run dev`.

The dashboard can extract text from PDF, PPTX, DOCX, TXT, and Markdown files, and transcribe audio/video uploads through Groq Whisper. The AI tutor works without a source and can optionally use a selected notebook. Notes, flashcards, quiz attempts, and chat history are saved per user; quiz feedback also updates that notebook's notes. YouTube links are not directly transcribed yet; upload the media or provide its transcript. Scanned PDFs and text embedded only in slide images are not OCR'd.

Keep `GROQ_API_KEY` server-side (never prefix it with `NEXT_PUBLIC_`) and do not commit `.env.local` or service-role keys. Supabase RLS scopes notebook and chat data to each signed-in user. The `/login-success` page requires a valid Supabase session.
