**Synapse AI Study**

# This project is licensed under the MIT License, allowing anyone to use, modify, and distribute it under the license's terms.


# A free, open-source AI study workspace built for students.

Synapse turns study materials—including PDFs, presentations, YouTube videos, and notes—into tools that help learners understand, practise, and organize what they study.


# Project Concept

   # Learning should be accessible to everyone.
    Students already have the material they need to learn, but turning that material into effective study resources can be time-consuming. Notes, flashcards, quizzes, audio lessons, and planners are often spread across different platforms, and some tools limit their best features behind paid subscriptions.

    Synapse AI Study aims to bring these learning tools together in one free, open-source workspace.

    Upload your study material or provide a supported source, and Synapse helps transform it into AI-powered notes, flashcards, quizzes, mindmaps, and two-host audio studycasts. A built-in workspace and planner help students organize their learning instead of constantly switching between apps.

    Our goal isn't to replace teachers, textbooks, or independent thinking. It's to help students spend less time organizing information and more time understanding it.




# Complete chat history of github copilot CLI which we used to devlop the project is given in the file named :github-copilot-cli-chat.json1" this file is taken locally from github copilot cli instead of the usual online JSON file so there might be differences in formatting but the complete chat history is still accesible in this file and can be interpreted for judging and analysing.


# Running the Website

 There are two ways to use Synapse:

**Option 1** —  Use it online

The easiest way is to open the website:

# https://synapse-ai-study-dunz.vercel.app/

No installation is needed. Open the link and explore Synapse in your browser.

**Option 2** — Run it on your computer

## Running Synapse Locally

1. Install [Node.js](https://nodejs.org/) if you haven't already.

2. Clone or download this repository and open the project folder.

3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Create a `.env.local` file in the root directory of the project. Use the `.env.local` file for refference, for ease just copy the contents of the `.env.local` as we have already provided the supabase app secrets, other API's can be entered by creating on your own end, as the API's cant be shared publicly on a platform like Github.

5. Add your own AI provider API key to `.env.local` using the environment variable required by the project. You can obtain an API key from the provider used by Synapse.

6. **Supabase is already configured for the provided project.** The required Supabase backend configuration is included, so you don't need to set up your own Supabase project to get started.

7. Start the development server in the exact folder where the project is saved and then run this command in the exact command directory:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000] in your browser.

**Note:** You must provide your own AI API key for AI-powered features to work locally. Keep your API key private and never commit your `.env.local` file to GitHub. The Supabase configuration is provided for the existing project, so leave it unchanged unless you're setting up your own backend.

## YouTube caption imports

Synapse uses the official YouTube Data API v3 captions endpoints. To enable imports in a deployment:

1. Enable **YouTube Data API v3** in the Google Cloud project used for OAuth.
2. Configure Google as an OAuth provider in Supabase using a Google OAuth web client. Add the Supabase callback URL shown in the Supabase provider settings to the Google client's authorized redirect URIs.
3. Configure the OAuth consent screen and add the `https://www.googleapis.com/auth/youtube.force-ssl` scope. Synapse requests this scope, along with `openid`, `email`, and `profile`, when the user connects Google. `youtube.readonly` does not authorize the captions list/download operations.
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` and in Vercel's server-side environment variables (Production and any preview environments that need imports). These values must not use a `NEXT_PUBLIC_` prefix. The ID must match the Google OAuth client configured in Supabase.

The browser obtains the user's Google provider tokens through Supabase OAuth and sends the current access token to the captions route for each request. Tokens are held client-side; no access token or transcript is kept in server memory between serverless invocations. When Google returns 401, the browser sends its refresh token to the server-only refresh route, which uses the server-side OAuth client secret to obtain a new access token, updates the browser's token state, and retries the caption request once. If the refresh token is expired or revoked, the user is prompted to reconnect Google. Both routes set a 10-second maximum duration and bound outbound requests with timeouts; caption bytes and cleaned transcript are processed in memory.

**Important video limitation:** The official API allows caption listing/download only for videos the authenticated Google account is permitted to edit (typically videos the user owns or manages). A public video is not necessarily accessible. If permission is missing, the UI reports that requirement rather than falling back to unofficial scraping.

Each successful import uses 250 YouTube API quota units: 50 for `captions.list` and 200 for `captions.download`. At the default 10,000-unit daily allocation, that is at most 40 successful imports per project per day (before other API usage). Quota exhaustion is surfaced as a recoverable error; quota increases must be requested through Google Cloud Console.

# Features

Study from your materials — Import supported files and organize learning around notebooks.

AI-generated study resources — Create summaries, flashcards, quizzes, mindmaps, and podcast scripts from source material.

Interactive learning UI — Explore features such as 3D-flip flashcards, quiz feedback, and animated audio waveforms.

Notebook dashboard — Search and organize notebooks in a focused workspace.

Study planner — Plan tasks and manage time more efficiently without forgetting any task or assignment

Google and email authentication — Sign in through Supabase Auth.

Dark and light themes — Switch between a dark, lime-accented theme and a light, teal-accented theme.

Responsive experience — Designed for mobile and desktop layouts.


_________________________________________________________________________________________________________________________________________

```
███████╗██╗   ██╗███╗   ██╗ █████╗ ██████╗ ███████╗███████╗ TM
██╔════╝╚██╗ ██╔╝████╗  ██║██╔══██╗██╔══██╗██╔════╝██╔════╝
███████╗ ╚████╔╝ ██╔██╗ ██║███████║██████╔╝███████╗█████╗  
╚════██║  ╚██╔╝  ██║╚██╗██║██╔══██║██╔═══╝ ╚════██║██╔══╝    
███████║   ██║   ██║ ╚████║██║  ██║██║     ███████║███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝
```

# Built by Harshwardhan Gupta and Mudit Gupta, STUDENTS OF CLASS 10TH
# DAV PUBLIC SCHOOL, RAJENDRA NAGAR, SAHIBABAD
