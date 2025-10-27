import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'

interface Step1UploadProps {
  onNext: (data: { title: string; content: string; files: File[] }) => void
}

export default function Step1Upload({ onNext }: Step1UploadProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const { } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: true, // Disable file upload functionality
    onDrop: (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles])
    },
  })

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (!title.trim()) {
      alert('Please enter capsule title')
      return
    }
    if (activeTab === 'text' && !textContent.trim()) {
      alert('Please enter content')
      return
    }
    if (activeTab === 'file' && files.length === 0) {
      alert('Please upload at least one file')
      return
    }
    
    onNext({ title, content: textContent, files })
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Step 1: Upload Your Secret</span>
      </h2>
      
      {/* Tabs */}
      <div className="tabs mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'text'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Text Message
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'file'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Image/File
          </button>
        </div>
      </div>
      
      {/* Title input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Give this capsule a name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., To My Future Self, Memories of 2025..."
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder-gray-400"
        />
      </div>
      
      {/* Text input */}
      {activeTab === 'text' && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Write down your secret
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Write down your secrets, dreams, wishes, or anything you want to say to the future...&#10;&#10;This content will be fully encrypted and can only be viewed after the unlock time."
            rows={10}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
          />
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tip: Content will be protected by FHE encryption
            </span>
            <span className="text-gray-700 font-medium">{textContent.length} / 5000 characters</span>
          </div>
        </div>
      )}
      
      {/* File upload */}
      {activeTab === 'file' && (
        <>
          <div className="relative">
            {/* Blurred background */}
            <div className="dropzone border-2 border-dashed rounded-2xl p-12 text-center bg-gray-50 border-gray-300 filter blur-sm">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drag and drop files here
              </h3>
              <p className="text-gray-600 mb-4">or click to select files</p>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-sm text-gray-700 border border-gray-200">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Support: JPG, PNG, GIF, PDF, TXT (Max 10MB)</span>
              </div>
            </div>
            
            {/* Overlay with coming soon message */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-600 text-sm">File upload feature is under development</p>
              </div>
            </div>
          </div>
          
          {/* File previews */}
          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow relative group"
                >
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center filter blur-sm">
                    {file.type.startsWith('image/') ? (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-900 truncate font-mono">{file.name}</p>
                  <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                  
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Will be encrypted</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Next button */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleNext}
          className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <span>Next: Set Unlock Time</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}

