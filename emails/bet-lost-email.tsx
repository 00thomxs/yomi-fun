import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout, emailStyles } from './components/email-layout'

interface BetLostEmailProps {
  username: string
  marketQuestion: string
  betAmount: number
  newBalance: number
}

export function BetLostEmail({ 
  username = 'Joueur',
  marketQuestion = 'Le PSG va-t-il gagner ?',
  betAmount = 100,
  newBalance = 900,
}: BetLostEmailProps) {
  return (
    <EmailLayout preview={`Résultat de ton pari sur "${marketQuestion}"`}>
      <Text style={emailStyles.h1}>
        Résultat de ton pari 📊
      </Text>
      
      <Text style={emailStyles.text}>
        Salut <span style={emailStyles.highlight}>{username}</span>,
      </Text>
      
      <Text style={emailStyles.text}>
        Malheureusement, ta prédiction n'était pas la bonne cette fois-ci. 
        Mais ne t'inquiète pas, c'est le jeu !
      </Text>

      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.textMuted, margin: '0 0 10px', fontSize: '12px' }}>
          ÉVÉNEMENT
        </Text>
        <Text style={{ ...emailStyles.text, margin: '0 0 15px', fontWeight: '600' }}>
          {marketQuestion}
        </Text>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333' }}>
              <Text style={{ ...emailStyles.textMuted, margin: 0 }}>Mise perdue</Text>
            </td>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.errorText, margin: 0 }}>-{betAmount.toLocaleString()} Z</Text>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333' }}>
              <Text style={{ ...emailStyles.text, margin: 0 }}>Balance restante</Text>
            </td>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.text, margin: 0 }}>{newBalance.toLocaleString()} Z</Text>
            </td>
          </tr>
        </table>
      </Section>

      <Text style={emailStyles.text}>
        💡 <strong>Conseil :</strong> Analyse les tendances et les probabilités avant de parier. 
        Les meilleurs joueurs gagnent sur le long terme !
      </Text>

      <Section style={{ textAlign: 'center', margin: '25px 0' }}>
        <Link href="https://y0mi.fun" style={emailStyles.button}>
          Retenter ma chance →
        </Link>
      </Section>

      <Text style={emailStyles.textMuted}>
        N'oublie pas de récupérer ton bonus quotidien ! 🎁
      </Text>
    </EmailLayout>
  )
}

export default BetLostEmail

