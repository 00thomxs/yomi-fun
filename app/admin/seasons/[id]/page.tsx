import { createClient } from '@/lib/supabase/server'
import { Trophy, Calendar, Users, TrendingUp, Target, Award, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { SeasonRecapStats } from './season-recap-stats'
import { notFound } from 'next/navigation'

export default async function SeasonRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  // Fetch season
  const { data: season, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('id', seasonId)
    .single()

  if (error || !season) {
    notFound()
  }

  // Fetch leaderboard for this season
  const { data: leaderboard } = await supabase
    .from('season_leaderboards')
    .select(`
      *,
      profiles:user_id (id, username, avatar_url)
    `)
    .eq('season_id', seasonId)
    .order('points', { ascending: false })
    .limit(50)

  // Fetch events linked to this season
  const { data: events } = await supabase
    .from('markets')
    .select('*')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false })

  // Get all bets on season events
  const eventIds = events?.map(e => e.id) || []
  let bets: any[] = []
  if (eventIds.length > 0) {
    const { data: betData } = await supabase
      .from('bets')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url),
        markets:market_id (question)
      `)
      .in('market_id', eventIds)
      .order('amount', { ascending: false })
    
    bets = betData || []
  }

  // Get position history for charts
  const { data: positionHistory } = await supabase
    .from('season_position_history')
    .select(`
      *,
      profiles:user_id (id, username)
    `)
    .eq('season_id', seasonId)
    .order('captured_at', { ascending: true })

  const totalVolume = events?.reduce((sum, e) => sum + (e.volume || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/admin/seasons"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux saisons
        </Link>
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              {season.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(season.start_date).toLocaleDateString('fr-FR')} - {new Date(season.end_date).toLocaleDateString('fr-FR')}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                Terminée
              </span>
            </div>
          </div>
          
          {/* Only show recap link if past_seasons entry exists (rewards distributed) */}
          {/* For now, show season details instead */}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" /> Participants
          </div>
          <p className="text-2xl font-bold mt-1">{leaderboard?.length || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" /> Events
          </div>
          <p className="text-2xl font-bold mt-1">{events?.length || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Volume Total
          </div>
          <p className="text-2xl font-bold mt-1 flex items-center gap-1">
            {totalVolume.toLocaleString()}
            <CurrencySymbol className="w-5 h-5" />
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" /> Paris Totaux
          </div>
          <p className="text-2xl font-bold mt-1">{bets.length}</p>
        </div>
      </div>

      {/* Podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Podium Final
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {/* 2nd Place */}
            <div className="text-center order-1">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center text-2xl mb-2">
                🥈
              </div>
              <p className="font-bold">{leaderboard[1]?.profiles?.username}</p>
              <p className="text-sm text-gray-400 font-mono">
                {leaderboard[1]?.points >= 0 ? '+' : ''}{leaderboard[1]?.points?.toLocaleString()}
              </p>
            </div>
            {/* 1st Place */}
            <div className="text-center order-0 md:order-1 -mt-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-2">
                🥇
              </div>
              <p className="font-bold text-lg text-amber-400">{leaderboard[0]?.profiles?.username}</p>
              <p className="text-sm text-amber-400 font-mono font-bold">
                {leaderboard[0]?.points >= 0 ? '+' : ''}{leaderboard[0]?.points?.toLocaleString()}
              </p>
            </div>
            {/* 3rd Place */}
            <div className="text-center order-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center text-2xl mb-2">
                🥉
              </div>
              <p className="font-bold">{leaderboard[2]?.profiles?.username}</p>
              <p className="text-sm text-amber-700 font-mono">
                {leaderboard[2]?.points >= 0 ? '+' : ''}{leaderboard[2]?.points?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Stats Component */}
      <SeasonRecapStats 
        seasonId={seasonId}
        leaderboard={leaderboard || []}
        events={events || []}
        bets={bets}
        positionHistory={positionHistory || []}
      />
    </div>
  )
}

