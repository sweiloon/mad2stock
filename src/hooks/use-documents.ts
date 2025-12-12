"use client"

import { useState, useEffect, useCallback } from 'react'

export interface CompanyDocument {
  name: string
  path: string
  url: string
  size: number
  createdAt?: string
  updatedAt?: string
  type: 'quarterly' | 'annual' | 'analysis'
  fiscalYear?: number
  quarter?: number
}

function parseDocumentType(fileName: string): {
  type: 'quarterly' | 'annual' | 'analysis'
  fiscalYear?: number
  quarter?: number
} {
  const lower = fileName.toLowerCase()

  if (lower.includes('annual')) {
    const yearMatch = fileName.match(/(\d{4})/)
    return {
      type: 'annual',
      fiscalYear: yearMatch ? parseInt(yearMatch[1]) : undefined,
    }
  }

  if (lower.endsWith('.txt') && lower.includes('report')) {
    return { type: 'analysis' }
  }

  // Quarterly report pattern: COMPANY_Q1_FY25.pdf
  const quarterMatch = fileName.match(/Q(\d)/i)
  const fyMatch = fileName.match(/FY(\d{2})/i)

  if (quarterMatch) {
    return {
      type: 'quarterly',
      quarter: parseInt(quarterMatch[1]),
      fiscalYear: fyMatch ? 2000 + parseInt(fyMatch[1]) : undefined,
    }
  }

  return { type: 'quarterly' }
}

export function useCompanyDocuments(companyCode: string | null) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    if (!companyCode) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/documents?company=${companyCode}`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      const docs = (data.documents || []).map((doc: any) => {
        const parsed = parseDocumentType(doc.name)
        return {
          ...doc,
          ...parsed,
        }
      })

      // Sort documents: analysis first, then annual, then quarterly (by date desc)
      docs.sort((a: CompanyDocument, b: CompanyDocument) => {
        if (a.type === 'analysis') return -1
        if (b.type === 'analysis') return 1
        if (a.type === 'annual' && b.type !== 'annual') return -1
        if (b.type === 'annual' && a.type !== 'annual') return 1
        // Sort quarterly by fiscal year and quarter
        if (a.fiscalYear !== b.fiscalYear) {
          return (b.fiscalYear || 0) - (a.fiscalYear || 0)
        }
        return (b.quarter || 0) - (a.quarter || 0)
      })

      setDocuments(docs)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [companyCode])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return { documents, loading, error, refetch: fetchDocuments }
}

export function useUploadDocument() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File, companyCode: string) => {
    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyCode', companyCode)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.document
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, error }
}

export function useDeleteDocument() {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteDoc = useCallback(async (path: string) => {
    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/documents?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  return { deleteDoc, deleting, error }
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}
