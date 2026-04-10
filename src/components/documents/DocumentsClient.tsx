'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload, FolderOpen, FileText, Trash2, Download, Lock,
  Loader2, X, Search, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HouseholdDocument, DocumentFolder } from '@/types/app'

const FOLDERS: { value: DocumentFolder; label: string }[] = [
  { value: 'insurance',   label: 'Insurance' },
  { value: 'medical',     label: 'Medical' },
  { value: 'legal',       label: 'Legal' },
  { value: 'financial',   label: 'Financial' },
  { value: 'home',        label: 'Home' },
  { value: 'vehicles',    label: 'Vehicles' },
  { value: 'school',      label: 'School' },
  { value: 'warranties',  label: 'Warranties' },
  { value: 'taxes',       label: 'Taxes' },
  { value: 'other',       label: 'Other' },
]

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.heic,.xlsx,.xls,.csv,.txt'

interface Props {
  initialDocs: HouseholdDocument[]
  householdId: string
  userId: string
  isOwner: boolean
}

export default function DocumentsClient({ initialDocs, householdId, userId, isOwner }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [docs, setDocs] = useState<HouseholdDocument[]>(initialDocs)
  const [folder, setFolder] = useState<DocumentFolder | 'all'>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Upload form state
  const [uploadName, setUploadName] = useState('')
  const [uploadFolder, setUploadFolder] = useState<DocumentFolder>('other')
  const [uploadOwnerOnly, setUploadOwnerOnly] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const filtered = docs.filter((d) => {
    if (folder !== 'all' && d.folder !== folder) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Count per folder for badges
  const folderCounts = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.folder] = (acc[d.folder] ?? 0) + 1
    return acc
  }, {})

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''))
  }

  async function handleUpload() {
    if (!selectedFile || !uploadName.trim()) return
    setUploading(true)
    setUploadError(null)

    const ext = selectedFile.name.split('.').pop()
    const path = `${householdId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(path, selectedFile, { upsert: false })

    if (storageError) {
      setUploadError(storageError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        household_id: householdId,
        uploaded_by: userId,
        name: uploadName.trim(),
        folder: uploadFolder,
        file_url: urlData.publicUrl,
        owner_only: uploadOwnerOnly,
        tags: null,
      })
      .select()
      .single()

    if (dbError) {
      setUploadError(dbError.message)
      setUploading(false)
      return
    }

    setDocs((prev) => [doc as HouseholdDocument, ...prev])
    resetUploadForm()
  }

  function resetUploadForm() {
    setShowUpload(false)
    setUploading(false)
    setUploadName('')
    setUploadFolder('other')
    setUploadOwnerOnly(false)
    setSelectedFile(null)
    setUploadError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(doc: HouseholdDocument) {
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeleting(doc.id)

    // Extract storage path from URL
    const urlParts = doc.file_url.split('/documents/')
    if (urlParts[1]) {
      await supabase.storage.from('documents').remove([urlParts[1]])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocs((prev) => prev.filter((d) => d.id !== doc.id))
    setDeleting(null)
  }

  function fileIcon(url: string) {
    const lower = url.toLowerCase()
    if (lower.match(/\.(jpg|jpeg|png|gif|heic|webp)(\?|$)/)) return '🖼️'
    if (lower.match(/\.pdf(\?|$)/)) return '📄'
    if (lower.match(/\.(doc|docx)(\?|$)/)) return '📝'
    if (lower.match(/\.(xls|xlsx|csv)(\?|$)/)) return '📊'
    return '📎'
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
          />
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 bg-stone-800 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-stone-700 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Folder filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <button
          onClick={() => setFolder('all')}
          className={cn(
            'flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
            folder === 'all' ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          )}
        >
          All · {docs.length}
        </button>
        {FOLDERS.filter((f) => folderCounts[f.value]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFolder(f.value)}
            className={cn(
              'flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
              folder === f.value ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            )}
          >
            {f.label} · {folderCounts[f.value]}
          </button>
        ))}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-100 rounded-2xl">
            <FolderOpen className="w-8 h-8 text-stone-400" />
          </div>
          <div>
            <p className="text-stone-700 font-medium">{search ? 'No results' : 'No documents yet'}</p>
            <p className="text-stone-400 text-sm mt-1">
              {search ? 'Try a different search' : 'Upload insurance cards, warranties, contracts and more'}
            </p>
          </div>
          {!search && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload your first document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3"
            >
              <span className="text-xl flex-shrink-0">{fileIcon(doc.file_url)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-stone-900 truncate">{doc.name}</p>
                  {doc.owner_only && <Lock className="w-3 h-3 text-stone-400 flex-shrink-0" aria-label="Owner only" />}
                </div>
                <p className="text-xs text-stone-400 mt-0.5 capitalize">
                  {FOLDERS.find((f) => f.value === doc.folder)?.label ?? doc.folder} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                  title="Open / download"
                >
                  <Download className="w-4 h-4" />
                </a>
                {(isOwner || doc.uploaded_by === userId) && (
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-400 hover:bg-stone-50 transition-colors"
                    title="Delete"
                  >
                    {deleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <h2 className="text-base font-semibold text-stone-900">Upload document</h2>
              <button onClick={resetUploadForm} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* File picker */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={cn(
                    'flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                    selectedFile ? 'border-stone-300 bg-stone-50' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  )}
                >
                  {selectedFile ? (
                    <>
                      <FileText className="w-6 h-6 text-stone-500 mb-1" />
                      <p className="text-sm font-medium text-stone-700 max-w-[90%] truncate">{selectedFile.name}</p>
                      <p className="text-xs text-stone-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-400 mb-1" />
                      <p className="text-sm text-stone-500">Click to choose a file</p>
                      <p className="text-xs text-stone-400 mt-0.5">PDF, Word, images, spreadsheets</p>
                    </>
                  )}
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Document name</label>
                <input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Home insurance policy 2025"
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 text-sm"
                />
              </div>

              {/* Folder */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Folder</label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value as DocumentFolder)}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-800 bg-white text-sm"
                >
                  {FOLDERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Owner only */}
              {isOwner && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-700">Owner only</p>
                    <p className="text-xs text-stone-400">Managers won't see this document</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadOwnerOnly(!uploadOwnerOnly)}
                    className={cn('relative w-10 h-6 rounded-full transition-colors', uploadOwnerOnly ? 'bg-stone-800' : 'bg-stone-200')}
                  >
                    <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', uploadOwnerOnly ? 'translate-x-5' : 'translate-x-1')} />
                  </button>
                </div>
              )}

              {uploadError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={resetUploadForm}
                className="flex-1 py-3 border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !uploadName.trim()}
                className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
