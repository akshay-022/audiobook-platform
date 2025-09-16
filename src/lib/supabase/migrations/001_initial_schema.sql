-- Create all tables for the audiobook platform

-- Books table
CREATE TABLE books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    pdf_url TEXT,
    processed_text JSONB,
    total_pages INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_summaries_book_id ON summaries(book_id);
CREATE INDEX idx_summaries_pages ON summaries(book_id, page_start, page_end);
CREATE INDEX idx_conversations_book_id ON conversations(book_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create open policies (no auth required for MVP)
CREATE POLICY "Public access for books" ON books
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for summaries" ON summaries
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for conversations" ON conversations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public access for messages" ON messages
    FOR ALL USING (true) WITH CHECK (true);

-- Note: After running this migration, create these storage buckets in Supabase Dashboard:
-- 1. 'pdfs' bucket (private) - for PDF uploads
-- 2. 'audio' bucket (public) - for generated audio files
-- 3. 'text' bucket (private) - for processed text files