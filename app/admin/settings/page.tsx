import { getSeasonSettings, getAllPastSeasons } from "./actions"
import { resetPlatform } from "../actions"
import { SettingsForm } from "./settings-form"
import { ResetButton } from "./reset-button"
import { DeleteSeasonButton } from "./delete-season-button"
import Link from "next/link"
import { History } from "lucide-react"

export default async function AdminSettingsPage() {
  const settings = await getSeasonSettings()
  const pastSeasons = await getAllPastSeasons()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Paramètres de la Saison</h1>
        <p className="text-muted-foreground mt-1">
          Configurez les récompenses, la durée de la saison et les actions système.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Season Configuration Form */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Configuration Actuelle</h2>
          {settings ? (
            <SettingsForm settings={settings} />
          ) : (
            <div className="text-no">
              Erreur : Impossible de charger les paramètres. Vérifiez que la table 'season_settings' existe et contient une ligne.
            </div>
          )}
        </div>

        {/* Past Seasons History */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <History className="w-5 h-5" /> Historique des Saisons
          </h2>
          
          {pastSeasons.length > 0 ? (
            <div className="divide-y divide-border">
              {pastSeasons.map((season: any) => (
                <div key={season.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">Saison : {season.title || "Sans titre"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(season.start_date).toLocaleDateString('fr-FR')} - {new Date(season.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/admin/seasons/${season.id}`}
                      className="text-sm text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
                    >
                      Voir le récap →
                    </Link>
                    <DeleteSeasonButton id={season.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucune saison archivée pour le moment.</p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-950/10 border border-no/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-no mb-2">Zone de Danger</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ces actions sont irréversibles. Soyez prudent.
          </p>
          
          <div className="flex items-center justify-between p-4 bg-no/5 rounded-lg border border-no/10">
            <div>
              <h3 className="font-semibold text-no">Réinitialiser la Plateforme</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Supprime tous les paris, transactions, commandes et historiques. Remet les soldes à 0 Z. 
                <br />
                <strong>Les comptes utilisateurs et les articles du shop sont conservés.</strong>
              </p>
            </div>
            <ResetButton />
          </div>
        </div>
      </div>
    </div>
  )
}

