/**
 * Script to upload company documents from local data/companies folder to Supabase Storage
 *
 * Usage:
 *   npx tsx scripts/upload-documents.ts
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Supabase storage bucket 'company-documents' must exist
 *
 * This script will:
 *   1. Scan data/companies/ for all company folders
 *   2. Upload PDF and TXT files to Supabase storage
 *   3. Organize by company code (e.g., company-documents/GAMUDA/...)
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const BUCKET_NAME = 'company-documents'
const DATA_DIR = path.join(process.cwd(), 'data', 'companies')

interface UploadStats {
  total: number
  success: number
  failed: number
  skipped: number
}

async function main() {
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nSet these in .env.local or export them before running.')
    process.exit(1)
  }

  console.log('🚀 Starting document upload to Supabase Storage')
  console.log(`   Bucket: ${BUCKET_NAME}`)
  console.log(`   Source: ${DATA_DIR}\n`)

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Check if bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    console.error('❌ Failed to list buckets:', bucketsError.message)
    process.exit(1)
  }

  const bucketExists = buckets.some(b => b.name === BUCKET_NAME)
  if (!bucketExists) {
    console.log(`📦 Creating bucket: ${BUCKET_NAME}`)
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    })
    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message)
      process.exit(1)
    }
    console.log('✅ Bucket created\n')
  }

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  // Get all company folders
  const companyFolders = fs.readdirSync(DATA_DIR).filter(f => {
    const fullPath = path.join(DATA_DIR, f)
    return fs.statSync(fullPath).isDirectory()
  })

  console.log(`📁 Found ${companyFolders.length} company folders\n`)

  const stats: UploadStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  }

  // Process each company folder
  for (const companyCode of companyFolders) {
    const companyDir = path.join(DATA_DIR, companyCode)
    const files = fs.readdirSync(companyDir).filter(f =>
      f.endsWith('.pdf') || f.endsWith('.txt')
    )

    if (files.length === 0) {
      console.log(`⏭️  ${companyCode}: No documents found`)
      continue
    }

    console.log(`📤 ${companyCode}: Uploading ${files.length} files...`)

    for (const file of files) {
      stats.total++
      const filePath = path.join(companyDir, file)
      const storagePath = `${companyCode}/${file}`

      try {
        // Read file
        const fileBuffer = fs.readFileSync(filePath)
        const contentType = file.endsWith('.pdf') ? 'application/pdf' : 'text/plain'

        // Check if file already exists
        const { data: existingFile } = await supabase.storage
          .from(BUCKET_NAME)
          .list(companyCode, { search: file })

        if (existingFile && existingFile.length > 0) {
          // Check if sizes match (skip if same)
          const fileStats = fs.statSync(filePath)
          const existing = existingFile[0]
          if (existing.metadata?.size === fileStats.size) {
            stats.skipped++
            console.log(`   ⏭️  ${file} (already exists)`)
            continue
          }
        }

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(storagePath, fileBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          stats.failed++
          console.error(`   ❌ ${file}: ${uploadError.message}`)
        } else {
          stats.success++
          console.log(`   ✅ ${file}`)
        }
      } catch (error) {
        stats.failed++
        console.error(`   ❌ ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Upload Summary')
  console.log('='.repeat(50))
  console.log(`   Total files:    ${stats.total}`)
  console.log(`   ✅ Successful:  ${stats.success}`)
  console.log(`   ⏭️  Skipped:     ${stats.skipped}`)
  console.log(`   ❌ Failed:      ${stats.failed}`)
  console.log('='.repeat(50))

  if (stats.failed > 0) {
    console.log('\n⚠️  Some files failed to upload. Check the errors above.')
    process.exit(1)
  }

  console.log('\n🎉 All documents uploaded successfully!')
}

main().catch(console.error)
