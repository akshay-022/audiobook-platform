'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, BookOpen, Mic, Sparkles, Loader2 } from 'lucide-react'

export default function Home() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type === 'application/pdf') {
      await handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Navigate to the book page
      router.push(`/book/${data.book.id}`)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload PDF')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Interactive Audiobook Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Upload a PDF and transform it into an interactive audio experience
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Summaries</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get intelligent chapter summaries that preserve the essence of the content
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Voice Interaction</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Ask questions and have conversations about the content using voice
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Text-to-Speech</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Listen to your books with natural-sounding AI narration
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-all
              ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }
            `}
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Upload your PDF</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Drag and drop your PDF here, or click to browse
            </p>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="file-upload"
              disabled={isUploading}
              onChange={async (e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  await handleFileUpload(files[0])
                }
              }}
            />
            <label
              htmlFor="file-upload"
              className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-colors ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing PDF...
                </span>
              ) : (
                'Choose PDF'
              )}
            </label>
            {uploadError && (
              <p className="mt-4 text-red-500 text-sm">{uploadError}</p>
            )}
          </div>

          {/* Sample Books */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Or try a sample book</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button className="text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-1">The Great Gatsby</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">F. Scott Fitzgerald</p>
              </button>
              <button className="text-left p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 className="font-semibold mb-1">Pride and Prejudice</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Jane Austen</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}