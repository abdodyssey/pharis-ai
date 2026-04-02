import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Anon Key dari file .env.local kamu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)