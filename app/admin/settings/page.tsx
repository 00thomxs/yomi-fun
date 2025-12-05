import { getSeasonSettings, updateSeasonSettings } from "./actions"
import { resetPlatform } from "../actions"
import { SettingsForm } from "./settings-form"
import { ResetButton } from "./reset-button"

export default async function AdminSettingsPage() {
  const settings = await getSeasonSettings()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres de la Saison</h1>
        <p className="text-muted-foreground mt-1">
          Configurez les récompenses, la durée de la saison et les actions système.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Season Configuration Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Configuration Actuelle</h2>
          {settings ? (
            <SettingsForm settings={settings} />
          ) : (
            <div className="text-rose-400">
              Erreur : Impossible de charger les paramètres. Vérifiez que la table 'season_settings' existe et contient une ligne.
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-6">
          <h2 className="text-xl font-bold text-rose-500 mb-2">Zone de Danger</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ces actions sont irréversibles. Soyez prudent.
          </p>
          
          <div className="flex items-center justify-between p-4 bg-rose-500/5 rounded-lg border border-rose-500/10">
            <div>
              <h3 className="font-bold text-rose-400">Réinitialiser la Plateforme</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Supprime tous les paris, transactions, commandes et historiques. Remet les soldes à 10 000 Z. 
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

