import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout, emailStyles } from './components/email-layout'

interface BetWonEmailProps {
  username: string
  marketQuestion: string
  betAmount: number
  winnings: number
  newBalance: number
  marketUrl?: string
}

export function BetWonEmail({ 
  username = 'Joueur',
  marketQuestion = 'Le PSG va-t-il gagner ?',
  betAmount = 100,
  winnings = 180,
  newBalance = 1180,
  marketUrl = 'https://y0mi.fun'
}: BetWonEmailProps) {
  const profit = winnings - betAmount
  
  return (
    <EmailLayout preview={`🎉 Tu as gagné ${winnings.toLocaleString()} Zeny !`}>
      <Text style={emailStyles.h1}>
        🎉 Félicitations, tu as gagné !
      </Text>
      
      <Text style={emailStyles.text}>
        Bravo <span style={emailStyles.highlight}>{username}</span> !
      </Text>
      
      <Text style={emailStyles.text}>
        Ta prédiction était correcte et tu remportes tes gains !
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
              <Text style={{ ...emailStyles.textMuted, margin: 0 }}>Mise</Text>
            </td>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.text, margin: 0 }}>{betAmount.toLocaleString()} Z</Text>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333' }}>
              <Text style={{ ...emailStyles.textMuted, margin: 0 }}>Profit</Text>
            </td>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.successText, margin: 0 }}>+{profit.toLocaleString()} Z</Text>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333' }}>
              <Text style={{ ...emailStyles.text, margin: 0, fontWeight: '600' }}>Total gagné</Text>
            </td>
            <td style={{ padding: '10px 0', borderTop: '1px solid #333', textAlign: 'right' }}>
              <Text style={{ ...emailStyles.highlight, margin: 0, fontSize: '18px' }}>{winnings.toLocaleString()} Z</Text>
            </td>
          </tr>
        </table>
      </Section>

      <Section style={{ ...emailStyles.card, textAlign: 'center', backgroundColor: '#0a2a1f', borderColor: '#10b981' }}>
        <Text style={{ ...emailStyles.textMuted, margin: '0 0 5px' }}>NOUVELLE BALANCE</Text>
        <Text style={emailStyles.statNumber}>{newBalance.toLocaleString()} Z</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '25px 0' }}>
        <Link href="https://y0mi.fun" style={emailStyles.button}>
          Continuer à parier →
        </Link>
      </Section>

      <Text style={emailStyles.textMuted}>
        Continue comme ça et grimpe dans le classement ! 🏆
      </Text>
    </EmailLayout>
  )
}

export default BetWonEmail

