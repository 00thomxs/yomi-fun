import { getPlatformStats, getTopPlayersByPnl, searchUsers } from "@/app/actions/admin-users"
import { AdminUsersClient } from "./admin-users-client"

export const revalidate = 0

export default async function AdminUsersPage() {
  // Fetch initial data server-side
  const [stats, topPlayersAll, initialUsers] = await Promise.all([
    getPlatformStats(),
    getTopPlayersByPnl('all', 10),
    searchUsers({ limit: 20, sortBy: 'created_at', sortOrder: 'desc' })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion Utilisateurs</h1>
        <p className="text-muted-foreground">Dashboard et modération des joueurs</p>
      </div>
      
      <AdminUsersClient 
        initialStats={stats}
        initialTopPlayers={topPlayersAll}
        initialUsers={initialUsers.users}
        initialTotal={initialUsers.total}
      />
    </div>
  )
}

