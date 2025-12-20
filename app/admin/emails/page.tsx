import { getEmailStats } from "@/app/actions/emails"
import { AdminEmailsClient } from "./admin-emails-client"

export const revalidate = 0

export default async function AdminEmailsPage() {
  const stats = await getEmailStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Emails</h1>
        <p className="text-muted-foreground">Envoyer des emails aux utilisateurs</p>
      </div>
      
      <AdminEmailsClient initialStats={stats} />
    </div>
  )
}

