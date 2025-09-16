import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import openai from '@/lib/openai'
import { SUMMARY_SYSTEM_PROMPT } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { bookId, pageStart, pageEnd, conversationId } = await request.json()

    // Check if summary already exists
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('*')
      .eq('book_id', bookId)
      .eq('page_start', pageStart)
      .eq('page_end', pageEnd)
      .single()

    if (existingSummary) {
      // Return existing summary as a message
      if (conversationId) {
        const { data: message } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: `Here's the summary for pages ${pageStart}-${pageEnd}:\n\n${existingSummary.content}`
          })
          .select()
          .single()

        return NextResponse.json({ summary: existingSummary, message })
      }
      return NextResponse.json({ summary: existingSummary })
    }

    // Get book content
    const { data: book } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single()

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Extract relevant text (simplified - in production, you'd parse by actual pages)
    const fullText = book.processed_text?.text || ''
    const textLength = fullText.length
    const chunkSize = Math.floor(textLength / (book.total_pages || 1))
    const startIdx = (pageStart - 1) * chunkSize
    const endIdx = pageEnd * chunkSize
    const textChunk = fullText.substring(startIdx, endIdx)

    // Generate summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: SUMMARY_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Summarize this section from pages ${pageStart} to ${pageEnd}:\n\n${textChunk.substring(0, 10000)}` // Limit to 10k chars
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const summaryContent = completion.choices[0].message.content || 'Unable to generate summary.'

    // Save summary to database
    const { data: newSummary } = await supabase
      .from('summaries')
      .insert({
        book_id: bookId,
        page_start: pageStart,
        page_end: pageEnd,
        content: summaryContent
      })
      .select()
      .single()

    // If conversation ID provided, add as message
    if (conversationId) {
      const { data: message } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: `Here's the summary for pages ${pageStart}-${pageEnd}:\n\n${summaryContent}`
        })
        .select()
        .single()

      return NextResponse.json({ summary: newSummary, message })
    }

    return NextResponse.json({ summary: newSummary })
  } catch (error) {
    console.error('Summarize error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}