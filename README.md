# Captivize

AI Generated Captions

## Overview

Captivize is an application that generates AI-driven captions for videos. The project leverages technologies like Next.js, Supabase, and Remotion for video processing and captioning.

## Prerequisites

Before you start, ensure you have the following installed:

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Python (v3.8 or higher)
- `pip` (Python package installer)

## Environment Setup

Create a `.env.local` file at the root of the project with the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

```

```bash
git clone <PROJECT>
cd captivize
```

```bash
npm install
npm run dev
```


### Some considerations: 
Using Supabase Authentication
When you use Supabase authentication, it automatically creates an auth.users table for you. If you only need basic user info, you're set. However, if you want to store extra user details, consider creating a separate profile table linked to auth.users. You can work directly with the user ID from the auth session. It's unique for each user and can be used to link or fetch any related data you might store elsewhere.