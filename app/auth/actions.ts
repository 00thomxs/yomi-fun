'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Create a separate admin client for deletion
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AuthResult = {
// ...
export async function deleteAccount(password: string): Promise<AuthResult> {
  const supabase = await createClient()
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: "Non authentifié" }

  // 2. Verify password by attempting sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password
  })

  if (signInError) {
    return { error: "Mot de passe incorrect" }
  }

  // 3. Delete user using Admin Client (Service Role)
  // Standard client cannot delete auth users
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  )

  if (deleteError) {
    console.error("Delete user error:", deleteError)
    return { error: "Erreur lors de la suppression du compte" }
  }

  return { success: true }
}
  error?: string
  success?: boolean
}

export async function signUp(email: string, password: string, username: string): Promise<AuthResult> {
  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://yomi-fun.vercel.app' // Fallback to Vercel URL if env not set

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data.url }
}

