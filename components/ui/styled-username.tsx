'use client'

import { type CosmeticItem } from '@/app/actions/cosmetics'
import { cn } from '@/lib/utils'
import '@/styles/nametag-effects.css'

// Nametag effect type (from preview_data)
export type NametagEffect = {
  type: string
  effect?: string
  fontFamily?: string
  colors?: string[]
  useRankColor?: boolean
  intensity?: number
  direction?: string
  color?: string
}

// For leaderboard (uses CosmeticItem directly)
type StyledUsernamePropsWithItem = {
  username: string
  nametagEffect?: CosmeticItem | null
  rankColor?: string
  className?: string
}

// For card (uses NametagEffect from preview_data)
type StyledUsernamePropsWithEffect = {
  username: string
  nametagEffect?: NametagEffect | null
  rankColor?: string
  className?: string
}

type StyledUsernameProps = StyledUsernamePropsWithItem | StyledUsernamePropsWithEffect

export function StyledUsername({ username, nametagEffect, rankColor, className }: StyledUsernameProps) {
  if (!nametagEffect) {
    return <span className={className}>{username}</span>
  }

  // Detect if it's a CosmeticItem (has slug) or a NametagEffect (has effect)
  const isCosmeticItem = 'slug' in nametagEffect
  const effectSlug = isCosmeticItem ? nametagEffect.slug : nametagEffect.effect
  // Cast to any to avoid strict type checking on dynamic properties
  const previewData: Record<string, any> = isCosmeticItem 
    ? (nametagEffect.preview_data || {}) 
    : (nametagEffect as Record<string, any>)

  // Check for useRankColor (for neon-glow)
  const glowColor = previewData.useRankColor && rankColor 
    ? rankColor 
    : (previewData.glowColor || previewData.color || '#00ffff')

  // Handle both slug formats (from CosmeticItem) and effect formats (from preview_data)
  // Normalize to handle: 'neon-glow'/'neon', 'shiny'/'shine', etc.
  const normalizedEffect = effectSlug?.toLowerCase()

  // Neon Glow effect
  if (normalizedEffect === 'neon-glow' || normalizedEffect === 'neon' || previewData.type === 'glow') {
    return (
      <span 
        className={cn("nametag-neon-glow", className)}
        style={{ 
          '--glow-color': glowColor,
          textShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}40`
        } as React.CSSProperties}
      >
        {username}
      </span>
    )
  }

  // Gradient effect
  if (normalizedEffect === 'gradient' || previewData.type === 'gradient') {
    const colors = previewData.colors || ['#00d4ff', '#ff00ff']
    // Support both "to right" and "90deg" formats
    const direction = previewData.direction === 'to right' ? '90deg' 
      : previewData.direction === 'to left' ? '270deg'
      : previewData.direction || '90deg'
    return (
      <span 
        className={cn("nametag-gradient", className)}
        style={{
          background: `linear-gradient(${direction}, ${colors[0]}, ${colors[1]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        {username}
      </span>
    )
  }

  // Pixel effect
  if (normalizedEffect === 'pixel' || previewData.fontFamily === 'pixel') {
    return (
      <span 
        className={cn("nametag-pixel", className)}
        style={{ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: '0.75em' }}
      >
        {username}
      </span>
    )
  }

  // Shiny effect
  if (normalizedEffect === 'shiny' || normalizedEffect === 'shine' || previewData.effect === 'shine') {
    return (
      <span className={cn("nametag-shiny", className)}>
        <span className="shiny-text">{username}</span>
      </span>
    )
  }

  // Gothic effect
  if (normalizedEffect === 'gothic' || previewData.fontFamily === 'gothic') {
    return (
      <span 
        className={cn("nametag-gothic", className)}
        style={{ fontFamily: '"UnifrakturMaguntia", "Times New Roman", serif' }}
      >
        {username}
      </span>
    )
  }

  // Default
  return <span className={className}>{username}</span>
}

// Helper to parse preview_data from DB
export function parseNametagEffect(previewData: Record<string, any> | null): NametagEffect | null {
  if (!previewData || !previewData.type) return null
  return previewData as NametagEffect
}
