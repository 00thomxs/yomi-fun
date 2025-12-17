import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json([])
    }
    
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', user.id)
      .eq('is_seen', false)
      .order('obtained_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching unseen badges:', error)
      return NextResponse.json([])
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in unseen badges API:', error)
    return NextResponse.json([])
  }
}

