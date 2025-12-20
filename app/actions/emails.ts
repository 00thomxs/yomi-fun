'use server'

import { resend, EMAIL_CONFIG } from '@/lib/resend'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { WelcomeEmail } from '@/emails/welcome-email'
import { PasswordResetEmail } from '@/emails/password-reset-email'
import { BetWonEmail } from '@/emails/bet-won-email'
import { BetLostEmail } from '@/emails/bet-lost-email'
import { BroadcastEmail } from '@/emails/broadcast-email'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// HELPER: Verify Admin
// ============================================
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { isAdmin: false }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return { 
    isAdmin: profile?.role === 'admin',
    userId: user.id
  }
}

// ============================================
// SEND WELCOME EMAIL
// ============================================
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: `Bienvenue sur YOMI.fun, ${username} ! 🎉`,
      react: WelcomeEmail({ username }),
    })

    if (error) {
      console.error('[sendWelcomeEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[EMAIL] Welcome email sent to ${email}`)
    return { success: true }
  } catch (err: any) {
    console.error('[sendWelcomeEmail] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// SEND PASSWORD RESET EMAIL
// ============================================
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: 'Réinitialise ton mot de passe YOMI.fun 🔐',
      react: PasswordResetEmail({ username, resetUrl }),
    })

    if (error) {
      console.error('[sendPasswordResetEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[EMAIL] Password reset email sent to ${email}`)
    return { success: true }
  } catch (err: any) {
    console.error('[sendPasswordResetEmail] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// SEND BET WON EMAIL
// ============================================
export async function sendBetWonEmail(
  email: string,
  username: string,
  marketQuestion: string,
  betAmount: number,
  winnings: number,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: `🎉 Tu as gagné ${winnings.toLocaleString()} Zeny !`,
      react: BetWonEmail({ username, marketQuestion, betAmount, winnings, newBalance }),
    })

    if (error) {
      console.error('[sendBetWonEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[EMAIL] Bet won email sent to ${email}`)
    return { success: true }
  } catch (err: any) {
    console.error('[sendBetWonEmail] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// SEND BET LOST EMAIL
// ============================================
export async function sendBetLostEmail(
  email: string,
  username: string,
  marketQuestion: string,
  betAmount: number,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      replyTo: EMAIL_CONFIG.replyTo,
      to: email,
      subject: `Résultat de ton pari sur "${marketQuestion.slice(0, 30)}..."`,
      react: BetLostEmail({ username, marketQuestion, betAmount, newBalance }),
    })

    if (error) {
      console.error('[sendBetLostEmail] Error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[EMAIL] Bet lost email sent to ${email}`)
    return { success: true }
  } catch (err: any) {
    console.error('[sendBetLostEmail] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// SEND BROADCAST EMAIL (Admin only)
// ============================================
export async function sendBroadcastEmail(
  subject: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  testMode: boolean = false,
  testEmail?: string
): Promise<{ success: boolean; error?: string; sentCount?: number }> {
  const { isAdmin, userId } = await verifyAdmin()
  if (!isAdmin) return { success: false, error: 'Non autorisé' }

  try {
    // Test mode: send to admin's email only
    if (testMode && testEmail) {
      const { error } = await resend.emails.send({
        from: EMAIL_CONFIG.from.default,
        replyTo: EMAIL_CONFIG.replyTo,
        to: testEmail,
        subject: `[TEST] ${subject}`,
        react: BroadcastEmail({ 
          username: 'Admin (Test)', 
          subject, 
          content, 
          ctaText, 
          ctaUrl 
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, sentCount: 1 }
    }

    // Get all non-banned users from profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('is_banned', false)

    if (profilesError) {
      return { success: false, error: profilesError.message }
    }

    if (!profiles || profiles.length === 0) {
      return { success: false, error: 'Aucun utilisateur trouvé' }
    }

    // Get emails from auth.users using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    // Create a map of user id -> email
    const emailMap = new Map<string, string>()
    authData.users.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email)
      }
    })

    // Merge profiles with emails
    const usersWithEmails = profiles
      .map(profile => ({
        ...profile,
        email: emailMap.get(profile.id)
      }))
      .filter(u => u.email) // Only users with emails

    if (usersWithEmails.length === 0) {
      return { success: false, error: 'Aucun utilisateur avec email trouvé' }
    }

    // Send emails in batches (Resend limit: 100/second on free plan)
    let sentCount = 0
    const batchSize = 10
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    for (let i = 0; i < usersWithEmails.length; i += batchSize) {
      const batch = usersWithEmails.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (user) => {
          if (!user.email) return

          try {
            await resend.emails.send({
              from: EMAIL_CONFIG.from.default,
              replyTo: EMAIL_CONFIG.replyTo,
              to: user.email,
              subject,
              react: BroadcastEmail({ 
                username: user.username || 'Joueur', 
                subject, 
                content, 
                ctaText, 
                ctaUrl 
              }),
            })
            sentCount++
          } catch (err) {
            console.error(`[BROADCAST] Failed to send to ${user.email}:`, err)
          }
        })
      )

      // Rate limiting: wait between batches
      if (i + batchSize < usersWithEmails.length) {
        await delay(1000)
      }
    }

    console.log(`[BROADCAST] Admin ${userId} sent broadcast to ${sentCount} users: "${subject}"`)
    
    return { success: true, sentCount }
  } catch (err: any) {
    console.error('[sendBroadcastEmail] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ============================================
// GET EMAIL STATS (Admin only)
// ============================================
export async function getEmailStats(): Promise<{
  totalUsers: number
  usersWithEmail: number
  recentlySent?: number
}> {
  const { isAdmin } = await verifyAdmin()
  if (!isAdmin) return { totalUsers: 0, usersWithEmail: 0 }

  // Get total non-banned users
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_banned', false)

  // Get users with emails from auth.users
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })
  
  // Count users with verified emails
  const usersWithEmail = authData?.users?.filter(u => u.email)?.length || 0

  return {
    totalUsers: totalUsers || 0,
    usersWithEmail,
  }
}

