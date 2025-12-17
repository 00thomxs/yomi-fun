'use client'

import { 
  Eye, 
  TrendingUp, 
  Trophy, 
  Medal, 
  Diamond, 
  Swords,
  Gamepad2,
  Crosshair,
  Brain,
  Crown,
  Award,
  Skull,
  Zap,
  Rocket,
  Drama,
  Sprout,
  BadgeCheck,
  HelpCircle
} from 'lucide-react'
import type { Badge, BadgeRarity } from '@/lib/types'
import { cn } from '@/lib/utils'

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Eye,
  TrendingUp,
  Trophy,
  Medal,
  Diamond,
  Swords,
  Gamepad2,
  Crosshair,
  Brain,
  Crown,
  Award,
  Skull,
  Zap,
  Rocket,
  Drama,
  Sprout,
  BadgeCheck,
}

// Style configurations by rarity/level
const RARITY_STYLES: Record<BadgeRarity, {
  border: string
  text: string
  bg: string
  icon: string
  glow?: string
  animation?: string
}> = {
  common: {
    border: 'border-zinc-500/50',
    text: 'text-zinc-400',
    bg: 'bg-zinc-900/50',
    icon: 'text-zinc-400',
  },
  rare: {
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    bg: 'bg-blue-950/30',
    icon: 'text-blue-400',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  },
  epic: {
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-950/30',
    icon: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  },
  legendary: {
    border: 'border-amber-500/70',
    text: 'text-amber-400',
    bg: 'bg-amber-950/30',
    icon: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    animation: 'animate-pulse',
  },
}

// Level-specific overrides (for evolving badges)
const LEVEL_STYLES: Record<number, Partial<typeof RARITY_STYLES['common']>> = {
  1: {}, // Uses rarity defaults
  2: {
    border: 'border-slate-400/50',
    text: 'text-slate-300',
    icon: 'text-slate-300',
  },
  3: {
    border: 'border-amber-500/60',
    text: 'text-amber-400',
    icon: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
  4: {
    border: 'border-violet-400/70',
    text: 'text-violet-300',
    icon: 'text-violet-300',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
    animation: 'animate-pulse',
  },
}

type BadgeDisplayProps = {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showName = true,
  className 
}: BadgeDisplayProps) {
  const Icon = ICON_MAP[badge.icon_name] || HelpCircle
  
  // Get base styles from rarity
  const baseStyles = RARITY_STYLES[badge.rarity]
  
  // Override with level styles if applicable
  const levelOverrides = badge.level ? LEVEL_STYLES[badge.level] || {} : {}
  
  const styles = { ...baseStyles, ...levelOverrides }
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-1.5 py-0.5 gap-1 text-[10px]',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'px-2 py-1 gap-1.5 text-xs',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      container: 'px-3 py-1.5 gap-2 text-sm',
      icon: 'w-4 h-4',
    },
  }
  
  const sizeStyles = sizeConfig[size]
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wider',
        sizeStyles.container,
        styles.border,
        styles.bg,
        styles.text,
        styles.glow,
        styles.animation,
        className
      )}
      title={badge.description || badge.name}
    >
      <Icon className={cn(sizeStyles.icon, styles.icon)} />
      {showName && <span>{badge.name}</span>}
    </div>
  )
}

// Compact version for leaderboards/headers
export function BadgeDisplayCompact({ badge, className }: { badge: Badge; className?: string }) {
  return (
    <BadgeDisplay 
      badge={badge} 
      size="sm" 
      showName={true}
      className={className}
    />
  )
}

// Mini version showing only icon
export function BadgeIcon({ badge, className }: { badge: Badge; className?: string }) {
  const Icon = ICON_MAP[badge.icon_name] || HelpCircle
  const styles = RARITY_STYLES[badge.rarity]
  const levelOverrides = badge.level ? LEVEL_STYLES[badge.level] || {} : {}
  const finalStyles = { ...styles, ...levelOverrides }
  
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-full border',
        finalStyles.border,
        finalStyles.bg,
        finalStyles.glow,
        finalStyles.animation,
        className
      )}
      title={badge.name}
    >
      <Icon className={cn('w-3.5 h-3.5', finalStyles.icon)} />
    </div>
  )
}

