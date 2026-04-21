
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Testing Supabase connection...')
  const start = Date.now()
  try {
    const { data, error } = await supabase.from('research_sessions').select('id').limit(1)
    const end = Date.now()
    if (error) {
      console.error('Supabase Error:', error.message)
    } else {
      console.log('Success! Fetched 1 session in', end - start, 'ms')
      console.log('Data:', data)
    }
  } catch (err) {
    console.error('Fetch Failed:', err)
  }
}

test()
