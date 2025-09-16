import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
const pdfExtract = require('pdf-extraction')

async function extractTextFromPDF(buffer: Buffer) {
  try {
    const data = await pdfExtract(buffer)
    return {
      text: data.text,
      numPages: data.pages?.length || 1,
      info: data.info
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const pdfData = await extractTextFromPDF(buffer)

    // Create book record in database
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        title: file.name.replace('.pdf', ''),
        processed_text: {
          text: pdfData.text,
          pages: pdfData.numPages,
          info: pdfData.info
        },
        total_pages: pdfData.numPages
      })
      .select()
      .single()

    if (bookError) {
      console.error('Database error:', bookError)
      return NextResponse.json({ error: 'Failed to save book' }, { status: 500 })
    }

    // Upload PDF to Supabase Storage
    const fileName = `${book.id}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage error:', uploadError)
      // Continue even if storage fails - we have the text
    } else {
      // Update book with PDF URL
      await supabase
        .from('books')
        .update({ pdf_url: fileName })
        .eq('id', book.id)
    }

    // Create initial conversation for this book
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({ book_id: book.id })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        pages: book.total_pages,
        conversation_id: conversation?.id
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}