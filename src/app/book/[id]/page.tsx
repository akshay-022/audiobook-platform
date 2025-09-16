'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Send, Mic, Volume2, Loader2, BookOpen, Home } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Book, Message, Conversation } from '@/types'

export default function BookPage() {
  const params = useParams()
  const bookId = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

  useEffect(() => {
    loadBookAndConversation()
  }, [bookId])

  const loadBookAndConversation = async () => {
    try {
      // Load book details
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

      if (bookData) {
        setBook(bookData)
      }

      // Load or create conversation
      let { data: conversationData } = await supabase
        .from('conversations')
        .select('*')
        .eq('book_id', bookId)
        .single()

      if (!conversationData) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ book_id: bookId })
          .select()
          .single()
        conversationData = newConversation
      }

      if (conversationData) {
        setConversation(conversationData)

        // Load messages
        const { data: messagesData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationData.id)
          .order('created_at', { ascending: true })

        if (messagesData) {
          setMessages(messagesData)
        }
      }
    } catch (error) {
      console.error('Error loading book:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversation || isSending) return

    setIsSending(true)
    const userMessage = inputMessage
    setInputMessage('')

    try {
      // Add user message to database
      const { data: userMsg } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage
        })
        .select()
        .single()

      if (userMsg) {
        setMessages(prev => [...prev, userMsg])
      }

      // Send to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: userMessage,
          bookContext: book?.processed_text?.text?.substring(0, 3000) // Send first 3000 chars as context
        })
      })

      const data = await response.json()

      if (data.message) {
        setMessages(prev => [...prev, data.message])
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const generateSummary = async () => {
    if (!book || !conversation) return

    setIsGeneratingAudio(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          pageStart: 1,
          pageEnd: Math.min(10, book.total_pages || 10),
          conversationId: conversation.id
        })
      })

      const data = await response.json()

      if (data.message) {
        setMessages(prev => [...prev, data.message])
      }
    } catch (error) {
      console.error('Error generating summary:', error)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <Home className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-semibold">{book?.title || 'Loading...'}</h1>
            </div>
          </div>
          {book && (
            <span className="text-sm text-gray-500">
              {book.total_pages} pages
            </span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Start exploring your book</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask questions, request summaries, or have a conversation about the content
              </p>
              <button
                onClick={generateSummary}
                disabled={isGeneratingAudio}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isGeneratingAudio ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating summary...
                  </span>
                ) : (
                  'Generate Chapter Summary'
                )}
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.audio_url && (
                    <button className="mt-2 flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
                      <Volume2 className="w-4 h-4" />
                      Play audio
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question about the book..."
              disabled={isSending}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={isSending || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}