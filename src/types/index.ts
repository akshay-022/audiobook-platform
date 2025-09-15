export interface Book {
  id: string
  title: string
  pdf_url: string
  processed_text: any
  total_pages: number
  created_at: string
}

export interface Summary {
  id: string
  book_id: string
  page_start: number
  page_end: number
  content: string
  audio_url?: string
  created_at: string
}

export interface Conversation {
  id: string
  book_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  audio_url?: string
  created_at: string
}