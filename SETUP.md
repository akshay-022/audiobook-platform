# Setup Instructions

## Database Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ypppywaecrevqqpfpuum

2. Click **SQL Editor** in the left sidebar

3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`

4. Paste and click **Run**

## Storage Buckets Setup

1. Go to **Storage** section in Supabase dashboard

2. Create these buckets:
   - **pdfs** (private) - for PDF uploads
   - **audio** (public) - for generated audio files
   - **text** (private) - for processed text files

## Running the Application

```bash
npm run dev
```

Visit http://localhost:3000