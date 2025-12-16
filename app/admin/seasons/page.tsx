import { createClient } from '@/lib/supabase/server'
import { Trophy, Calendar, Users, TrendingUp, Target, Flame, Award, BarChart3, Clock } from 'lucide-react'
import Link from 'next/link'
import { CurrencySymbol } from '@/components/ui/currency-symbol'
import { SeasonStatsClient } from './season-stats-client'

export default async function AdminSeasonsPage() {
  const supabase = await createClient()

  // Fetch all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('created_at', { ascending: false })

  // Find active season
  const activeSeason = seasons?.find(s => s.is_active)

  // Fetch season settings for rewards
  const { data: seasonSettings } = await supabase
    .from('season_settings')
    .select('*')
    .single()

  // Fetch season leaderboard data for active season
  let seasonLeaderboard: any[] = []
  let seasonEvents: any[] = []
  let seasonBets: any[] = []
  
  if (activeSeason) {
    // Get leaderboard with profiles
    const { data: leaderboard } = await supabase
      .from('season_leaderboards')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url)
      `)
      .eq('season_id', activeSeason.id)
      .order('points', { ascending: false })
      .limit(50)
    
    seasonLeaderboard = leaderboard || []

    // Get events linked to this season
    const { data: events } = await supabase
      .from('markets')
      .select('*')
      .eq('season_id', activeSeason.id)
      .order('created_at', { ascending: false })
    
    seasonEvents = events || []

    // Get all bets on season events
    const eventIds = seasonEvents.map(e => e.id)
    if (eventIds.length > 0) {
      const { data: bets } = await supabase
        .from('bets')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url),
          markets:market_id (question)
        `)
        .in('market_id', eventIds)
        .order('amount', { ascending: false })
      
      seasonBets = bets || []
    }
  }

  // Get position history for charts
  let positionHistory: any[] = []
  if (activeSeason) {
    const { data: history } = await supabase
      .from('season_position_history')
      .select(`
        *,
        profiles:user_id (id, username)
      `)
      .eq('season_id', activeSeason.id)
      .order('captured_at', { ascending: true })
    
    positionHistory = history || []
  }

  // Get past seasons (not active)
  const pastSeasons = seasons?.filter(s => !s.is_active) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            Gestion des Saisons
          </h1>
          <p className="text-muted-foreground mt-1">
            Stats, classements et historique des saisons
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
        >
          Paramètres Saison
        </Link>
      </div>

      {/* Active Season Section */}
      {activeSeason ? (
        <div className="space-y-6">
          {/* Season Header Card */}
          <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                    En cours
                  </span>
                  <h2 className="text-2xl font-bold">{activeSeason.name}</h2>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(activeSeason.start_date).toLocaleDateString('fr-FR')} - {new Date(activeSeason.end_date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.max(0, Math.ceil((new Date(activeSeason.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}j restants
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Récompenses</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Trophy className="w-4 h-4" /> {seasonSettings?.first_place_reward?.toLocaleString() || 0}<CurrencySymbol className="w-3 h-3" />
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 font-bold text-sm">
                    {seasonSettings?.second_place_reward?.toLocaleString() || 0}<CurrencySymbol className="w-3 h-3" />
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 font-bold text-sm">
                    {seasonSettings?.third_place_reward?.toLocaleString() || 0}<CurrencySymbol className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" /> Participants
              </div>
              <p className="text-2xl font-bold mt-1">{seasonLeaderboard.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                <Target className="w-4 h-4" /> Events
              </div>
              <p className="text-2xl font-bold mt-1">
                {seasonEvents.length}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({seasonEvents.filter(e => e.status === 'resolved').length} terminés)
                </span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" /> Volume Total
              </div>
              <p className="text-2xl font-bold mt-1 flex items-center gap-1">
                {seasonEvents.reduce((sum, e) => sum + (e.volume || 0), 0).toLocaleString()}
                <CurrencySymbol className="w-5 h-5" />
              </p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Paris Totaux
              </div>
              <p className="text-2xl font-bold mt-1">{seasonBets.length}</p>
            </div>
          </div>

          {/* Client Component for Interactive Charts and Detailed Stats */}
          <SeasonStatsClient 
            seasonId={activeSeason.id}
            seasonName={activeSeason.name}
            leaderboard={seasonLeaderboard}
            events={seasonEvents}
            bets={seasonBets}
            positionHistory={positionHistory}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border p-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold">Aucune saison en cours</h2>
          <p className="text-muted-foreground mt-1">
            Démarrez une nouvelle saison depuis les paramètres.
          </p>
          <Link
            href="/admin/settings"
            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm"
          >
            Créer une saison
          </Link>
        </div>
      )}

      {/* Past Seasons */}
      {pastSeasons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-muted-foreground" />
            Saisons Passées
          </h2>
          <div className="grid gap-4">
            {pastSeasons.map(season => (
              <Link
                key={season.id}
                href={`/admin/seasons/${season.id}`}
                className="block p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{season.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(season.start_date).toLocaleDateString('fr-FR')} - {new Date(season.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">Voir le récap →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

