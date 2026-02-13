#!/usr/bin/env node
// Quick script to check profiles in the database
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProfiles() {
  console.log('Checking profiles table...\n')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No profiles found in database')
    return
  }

  console.log(`✅ Found ${data.length} profile(s):\n`)
  data.forEach(profile => {
    console.log(`  • ${profile.username} (${profile.id})`)
    console.log(`    Display Name: ${profile.display_name || 'none'}`)
    console.log(`    Avatar: ${profile.avatar_url || 'none'}`)
    console.log(`    Created: ${profile.created_at}`)
    console.log()
  })
}

checkProfiles()
