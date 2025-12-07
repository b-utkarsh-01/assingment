import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null
let SUPABASE_CONFIGURED = false

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  SUPABASE_CONFIGURED = true
} else {
  // do not throw here; let consuming components show a friendly message
  // but log a console warning to help debugging
  console.warn('Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env')
}

export { supabase, SUPABASE_CONFIGURED }
export default supabase
