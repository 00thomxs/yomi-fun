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

// Common props
type BaseProps = {
  username: string
  rankColor?: string
  className?: string
  withAt?: boolean // Include @ in the styled effect
}

// For leaderboard (uses CosmeticItem directly)
type StyledUsernamePropsWithItem = BaseProps & {
  nametagEffect?: CosmeticItem | null
}

// For card (uses NametagEffect from preview_data)
type StyledUsernamePropsWithEffect = BaseProps & {
  nametagEffect?: NametagEffect | null
}

type StyledUsernameProps = StyledUsernamePropsWithItem | StyledUsernamePropsWithEffect

export function StyledUsername({ username, nametagEffect, rankColor, className, withAt = false }: StyledUsernameProps) {
  const displayName = withAt ? `@${username}` : username
  
  if (!nametagEffect) {
    return <span className={className}>{displayName}</span>
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
        {displayName}
      </span>
    )
  }

  // Gradient effect - supports 2+ colors
  if (normalizedEffect === 'gradient' || normalizedEffect === 'sunset' || normalizedEffect === 'ocean' || normalizedEffect === 'fire' || previewData.type === 'gradient') {
    const colors = previewData.colors || ['#00d4ff', '#ff00ff']
    // Support both "to right" and "90deg" formats
    const direction = previewData.direction === 'to right' ? '90deg' 
      : previewData.direction === 'to left' ? '270deg'
      : previewData.direction || '90deg'
    // Build gradient string with all colors
    const gradientColors = colors.join(', ')
    return (
      <span 
        className={cn("nametag-gradient", className)}
        style={{
          display: 'inline-block',
          background: `linear-gradient(${direction}, ${gradientColors})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        } as React.CSSProperties}
      >
        {displayName}
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
        {displayName}
      </span>
    )
  }

  // Shiny effect
  if (normalizedEffect === 'shiny' || normalizedEffect === 'shine' || previewData.effect === 'shine') {
    return (
      <span className={cn("nametag-shiny", className)}>
        <span className="shiny-text">{displayName}</span>
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
        {displayName}
      </span>
    )
  }

  // Default
  return <span className={className}>{displayName}</span>
}

// Helper to parse preview_data from DB
export function parseNametagEffect(previewData: Record<string, any> | null): NametagEffect | null {
  if (!previewData || !previewData.type) return null
  return previewData as NametagEffect
}
