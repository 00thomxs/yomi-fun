import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout, emailStyles } from './components/email-layout'

interface PasswordResetEmailProps {
  username: string
  resetUrl: string
}

export function PasswordResetEmail({ 
  username = 'Joueur',
  resetUrl = 'https://y0mi.fun/reset-password'
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Réinitialise ton mot de passe YOMI.fun">
      <Text style={emailStyles.h1}>
        Réinitialisation du mot de passe 🔐
      </Text>
      
      <Text style={emailStyles.text}>
        Salut <span style={emailStyles.highlight}>{username}</span>,
      </Text>
      
      <Text style={emailStyles.text}>
        Tu as demandé à réinitialiser ton mot de passe YOMI.fun. 
        Clique sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </Text>

      <Section style={{ textAlign: 'center', margin: '30px 0' }}>
        <Link href={resetUrl} style={emailStyles.button}>
          Réinitialiser mon mot de passe
        </Link>
      </Section>

      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.textMuted, margin: 0 }}>
          ⏱️ Ce lien expire dans <strong>1 heure</strong> pour des raisons de sécurité.
        </Text>
      </Section>

      <Text style={emailStyles.textMuted}>
        Si tu n'as pas demandé cette réinitialisation, tu peux ignorer cet email. 
        Ton mot de passe ne sera pas modifié.
      </Text>

      <Text style={{ ...emailStyles.textMuted, marginTop: '20px' }}>
        <strong>Tu n'as pas fait cette demande ?</strong><br />
        Si tu penses que quelqu'un essaie d'accéder à ton compte, contacte-nous immédiatement à support@y0mi.fun
      </Text>
    </EmailLayout>
  )
}

export default PasswordResetEmail

