# Synapse

Synapse is a student study workspace built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key.
3. In Supabase Authentication, enable email/password sign-in. For Google sign-in, enable the Google provider, configure its OAuth credentials, and add Supabase's Google callback URL in Google Cloud.
4. Add `http://localhost:3000/auth/callback` to the Supabase project's allowed redirect URLs.
5. Start the app with `npm run dev`.

The login view supports email sign-up/sign-in and Google OAuth. Supabase credentials are required for authentication; no credentials or service-role keys belong in source control. The `/login-success` page requires a valid Supabase session.
