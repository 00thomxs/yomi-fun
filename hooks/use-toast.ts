"use client"

import { useState, useCallback } from "react"
import type { ReactNode } from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastProps {
  title?: ReactNode
  description?: ReactNode
  variant?: ToastVariant
  duration?: number
}

interface Toast extends ToastProps {
  id: string
}

/**
 * Simple toast hook for prototyping
 * In production, consider using a library like sonner or react-hot-toast
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(({ title, description, variant = "default", duration = 3000 }: ToastProps) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newToast: Toast = { id, title, description, variant, duration }
    
    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    // Log for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔔 Toast:", { title, description, variant })
    }

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return { 
    toast, 
    toasts, 
    dismiss, 
    dismissAll 
  }
}
