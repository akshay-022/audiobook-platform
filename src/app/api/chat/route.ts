import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import openai from '@/lib/openai'
import { getChatSystemPrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, message, bookContext } = await request.json()

    // Get conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*, books(*)')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Build chat history
    const chatHistory = recentMessages?.reverse().map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })) || []

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: getChatSystemPrompt(
            conversation.books.title,
            bookContext || 'No context available'
          )
        },
        ...chatHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.'

    // Save AI response to database
    const { data: assistantMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', error)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}