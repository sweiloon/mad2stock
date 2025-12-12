import { createClient } from './client'

export interface UploadResult {
  success: boolean
  path?: string
  url?: string
  error?: string
}

export interface CompanyDocument {
  id?: string
  companyCode: string
  documentType: 'quarterly' | 'annual' | 'analysis'
  fileName: string
  storagePath: string
  fileSize: number
  fiscalYear?: number
  quarter?: number
  uploadedAt?: string
}

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @param file - The file to upload (Blob or File)
 * @returns Upload result with URL
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: Blob | File
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Get the public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns The public URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Download a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns The file blob or null if not found
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Download error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Download exception:', error)
    return null
  }
}

/**
 * List files in a storage bucket folder
 * @param bucket - The storage bucket name
 * @param folder - The folder path to list
 * @returns Array of file names
 */
export async function listFiles(
  bucket: string,
  folder: string
): Promise<string[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) {
      console.error('List error:', error)
      return []
    }

    return data.map((file: { name: string }) => file.name)
  } catch (error) {
    console.error('List exception:', error)
    return []
  }
}

/**
 * Delete a file from storage
 * @param bucket - The storage bucket name
 * @param path - The file path to delete
 * @returns True if successful
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

/**
 * Parse document filename to extract metadata
 * @param fileName - The document filename
 * @returns Parsed metadata
 */
export function parseDocumentName(fileName: string): {
  companyCode: string
  documentType: 'quarterly' | 'annual' | 'analysis'
  fiscalYear?: number
  quarter?: number
} {
  const baseName = fileName.replace(/\.(pdf|txt)$/i, '')
  const parts = baseName.split('_')

  const companyCode = parts[0]?.toUpperCase() || ''

  // Check for annual report
  if (fileName.toLowerCase().includes('annual')) {
    const yearMatch = baseName.match(/(\d{4})/)
    return {
      companyCode,
      documentType: 'annual',
      fiscalYear: yearMatch ? parseInt(yearMatch[1]) : undefined,
    }
  }

  // Check for quarterly report
  const quarterMatch = baseName.match(/Q(\d)/i)
  const fyMatch = baseName.match(/FY(\d{2})/i)

  if (quarterMatch) {
    return {
      companyCode,
      documentType: 'quarterly',
      quarter: parseInt(quarterMatch[1]),
      fiscalYear: fyMatch ? 2000 + parseInt(fyMatch[1]) : undefined,
    }
  }

  // Check for analysis report
  if (fileName.toLowerCase().includes('report') && fileName.endsWith('.txt')) {
    return {
      companyCode,
      documentType: 'analysis',
    }
  }

  // Default to quarterly
  return {
    companyCode,
    documentType: 'quarterly',
  }
}
