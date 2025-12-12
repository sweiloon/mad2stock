import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = 'company-documents'

// Create a server-side Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// GET - List documents for a company
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const companyCode = searchParams.get('company')

  try {
    const supabase = getSupabaseClient()

    if (companyCode) {
      // List documents for a specific company
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(companyCode.toUpperCase())

      if (error) {
        console.error('Error listing documents:', error)
        return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
      }

      // Get public URLs for each file
      const documents = data.map(file => {
        const path = `${companyCode.toUpperCase()}/${file.name}`
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path)

        return {
          name: file.name,
          path,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        }
      })

      return NextResponse.json({ documents })
    }

    // List all companies with documents
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 100 })

    if (error) {
      console.error('Error listing companies:', error)
      return NextResponse.json({ error: 'Failed to list companies' }, { status: 500 })
    }

    // Filter to only directories (companies)
    const companies = data
      .filter(item => item.id && !item.name.includes('.'))
      .map(item => ({
        code: item.name,
        name: item.name,
      }))

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

// POST - Upload a document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyCode = formData.get('companyCode') as string

    if (!file || !companyCode) {
      return NextResponse.json(
        { error: 'Missing file or company code' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Create the file path
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${companyCode.toUpperCase()}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      document: {
        name: fileName,
        path: data.path,
        url: urlData.publicUrl,
        size: file.size,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseClient()

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
