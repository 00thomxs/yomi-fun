'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { WELCOME_BONUS, DAILY_REWARDS_CONFIG, rollJackpot } from '@/lib/constants'

export type DailyRewardResult = {
  success?: boolean
  error?: string
  amount?: number
  newBalance?: number
  streakDay?: number
  isJackpot?: boolean
  jackpotRarity?: string
  jackpotLabel?: string
  jackpotColor?: string
}

export type WelcomeBonusResult = {
  success?: boolean
  error?: string
  amount?: number
  newBalance?: number
}

export type DailyRewardStatus = {
  canClaim: boolean
  nextClaimAt?: string
  currentStreak: number
  todayReward: number
  isJackpotDay: boolean
  welcomeBonusClaimed: boolean
  canClaimWelcome: boolean
}

// Check if 24 hours have passed since last claim
function canClaimDaily(lastClaim: string | null): boolean {
  if (!lastClaim) return true
  
  const lastClaimDate = new Date(lastClaim)
  const now = new Date()
  const hoursSinceClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60)
  
  return hoursSinceClaim >= 24
}

// Check if streak should be reset (more than 48h since last claim)
function shouldResetStreak(lastClaim: string | null): boolean {
  if (!lastClaim) return true
  
  const lastClaimDate = new Date(lastClaim)
  const now = new Date()
  const hoursSinceClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60)
  
  // Reset if more than 48 hours (missed a full day)
  return hoursSinceClaim >= 48
}

// Get time until next claim
function getNextClaimTime(lastClaim: string): Date {
  const lastClaimDate = new Date(lastClaim)
  return new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000)
}

// Get the reward amount for a given streak day
function getRewardForDay(streakDay: number): { amount: number; isJackpot: boolean; jackpot?: ReturnType<typeof rollJackpot> } {
  // Days 0-5 = base rewards (index 0-5)
  // Day 6 = jackpot day
  if (streakDay < 6) {
    return {
      amount: DAILY_REWARDS_CONFIG.base[streakDay],
      isJackpot: false
    }
  } else {
    // Day 7 (index 6) = Jackpot!
    const jackpot = rollJackpot()
    return {
      amount: jackpot.amount,
      isJackpot: true,
      jackpot
    }
  }
}

// ============================================
// GET DAILY REWARD STATUS
// ============================================
export async function getDailyRewardStatus(): Promise<DailyRewardStatus> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      canClaim: false,
      currentStreak: 0,
      todayReward: DAILY_REWARDS_CONFIG.base[0],
      isJackpotDay: false,
      welcomeBonusClaimed: true,
      canClaimWelcome: false
    }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_daily_claim, daily_streak, welcome_bonus_claimed')
    .eq('id', user.id)
    .single()
  
  if (!profile) {
    return {
      canClaim: false,
      currentStreak: 0,
      todayReward: DAILY_REWARDS_CONFIG.base[0],
      isJackpotDay: false,
      welcomeBonusClaimed: true,
      canClaimWelcome: false
    }
  }
  
  const canClaim = canClaimDaily(profile.last_daily_claim)
  const resetStreak = shouldResetStreak(profile.last_daily_claim)
  
  // If streak should reset, treat as day 0
  const effectiveStreak = resetStreak ? 0 : profile.daily_streak
  
  // Calculate today's potential reward
  const { amount: todayReward, isJackpot } = getRewardForDay(effectiveStreak)
  
  return {
    canClaim,
    nextClaimAt: profile.last_daily_claim ? getNextClaimTime(profile.last_daily_claim).toISOString() : undefined,
    currentStreak: effectiveStreak,
    todayReward,
    isJackpotDay: isJackpot,
    welcomeBonusClaimed: profile.welcome_bonus_claimed,
    canClaimWelcome: !profile.welcome_bonus_claimed
  }
}

// ============================================
// CLAIM WELCOME BONUS
// ============================================
export async function claimWelcomeBonus(): Promise<WelcomeBonusResult> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance, welcome_bonus_claimed')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) return { error: "Erreur profil." }
  
  // Check if already claimed
  if (profile.welcome_bonus_claimed) {
    return { error: "Bonus de bienvenue déjà récupéré !" }
  }
  
  // Give welcome bonus
  const newBalance = profile.balance + WELCOME_BONUS
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      balance: newBalance,
      welcome_bonus_claimed: true
    })
    .eq('id', user.id)
  
  if (updateError) return { error: "Erreur lors de la récupération du bonus." }
  
  // Log transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'bonus',
    amount: WELCOME_BONUS,
    description: 'Bonus de bienvenue'
  })
  
  revalidatePath('/')
  revalidatePath('/profile')
  
  return {
    success: true,
    amount: WELCOME_BONUS,
    newBalance
  }
}

// ============================================
// CLAIM DAILY BONUS
// ============================================
export async function claimDailyBonus(): Promise<DailyRewardResult> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Vous devez être connecté." }
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('balance, last_daily_claim, daily_streak')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) return { error: "Erreur profil." }
  
  // Check cooldown
  if (!canClaimDaily(profile.last_daily_claim)) {
    const nextClaim = getNextClaimTime(profile.last_daily_claim!)
    return { error: `Prochain bonus disponible à ${nextClaim.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` }
  }
  
  // Determine current streak (reset if needed)
  const resetStreak = shouldResetStreak(profile.last_daily_claim)
  const currentStreak = resetStreak ? 0 : profile.daily_streak
  
  // Get reward for today
  const { amount, isJackpot, jackpot } = getRewardForDay(currentStreak)
  
  // Calculate new streak (wraps around after day 6)
  const newStreak = (currentStreak + 1) % 7
  
  // Update profile
  const newBalance = profile.balance + amount
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      balance: newBalance,
      last_daily_claim: new Date().toISOString(),
      daily_streak: newStreak
    })
    .eq('id', user.id)
  
  if (updateError) return { error: "Erreur lors de la récupération du bonus." }
  
  // Log transaction
  const description = isJackpot 
    ? `Bonus quotidien Jour 7 - Jackpot ${jackpot?.label} !`
    : `Bonus quotidien Jour ${currentStreak + 1}`
  
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'bonus',
    amount: amount,
    description
  })
  
  revalidatePath('/')
  revalidatePath('/profile')
  
  return {
    success: true,
    amount,
    newBalance,
    streakDay: currentStreak + 1, // Display as 1-7, not 0-6
    isJackpot,
    jackpotRarity: jackpot?.rarity,
    jackpotLabel: jackpot?.label,
    jackpotColor: jackpot?.color
  }
}

