'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUserEquippedCosmetics, type CosmeticItem } from '@/app/actions/cosmetics'

type EquippedCosmetics = {
  background: CosmeticItem | null
  aura: CosmeticItem | null
  nametag: CosmeticItem | null
}

const CACHE_KEY = 'yomi_equipped_cosmetics'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

type CacheEntry = {
  data: EquippedCosmetics
  timestamp: number
  userId: string
}

/**
 * Hook to manage equipped cosmetics with caching
 * Reduces unnecessary API calls when navigating between pages
 */
export function useEquippedCosmetics(userId: string | undefined) {
  const [cosmetics, setCosmetics] = useState<EquippedCosmetics>({
    background: null,
    aura: null,
    nametag: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load from cache or fetch
  const loadCosmetics = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setCosmetics({ background: null, aura: null, nametag: null })
      setIsLoading(false)
      return
    }

    // Check cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached)
          const isValid = 
            entry.userId === userId && 
            Date.now() - entry.timestamp < CACHE_TTL
          
          if (isValid) {
            setCosmetics(entry.data)
            setIsLoading(false)
            return
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }

    // Fetch fresh data
    setIsLoading(true)
    try {
      const data = await getUserEquippedCosmetics(userId)
      setCosmetics(data)
      
      // Update cache
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        userId,
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry))
    } catch (error) {
      console.error('[useEquippedCosmetics] Error:', error)
    }
    setIsLoading(false)
  }, [userId])

  // Initial load
  useEffect(() => {
    loadCosmetics()
  }, [loadCosmetics])

  // Refresh function (invalidates cache)
  const refresh = useCallback(() => {
    return loadCosmetics(true)
  }, [loadCosmetics])

  // Clear cache (call when cosmetics are changed)
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
  }, [])

  return {
    cosmetics,
    isLoading,
    refresh,
    invalidateCache,
  }
}

