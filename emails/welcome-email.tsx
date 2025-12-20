import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout, emailStyles } from './components/email-layout'

interface WelcomeEmailProps {
  username: string
  loginUrl?: string
}

export function WelcomeEmail({ 
  username = 'Joueur',
  loginUrl = 'https://y0mi.fun/login'
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Bienvenue sur YOMI.fun, ${username} ! 🎉`}>
      <Text style={emailStyles.h1}>
        Bienvenue sur YOMI.fun ! 🎉
      </Text>
      
      <Text style={emailStyles.text}>
        Salut <span style={emailStyles.highlight}>{username}</span>,
      </Text>
      
      <Text style={emailStyles.text}>
        Ton compte a été créé avec succès ! Tu fais maintenant partie de la communauté YOMI, 
        la plateforme de paris prédictifs la plus fun.
      </Text>

      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.text, margin: '0 0 10px' }}>
          🎁 <strong>Bonus de bienvenue :</strong> Tu as reçu <span style={emailStyles.highlight}>1 000 Zeny</span> pour commencer à parier !
        </Text>
        <Text style={{ ...emailStyles.textMuted, margin: 0 }}>
          Reviens chaque jour pour récupérer ton bonus quotidien.
        </Text>
      </Section>

      <Text style={emailStyles.text}>
        <strong>Comment ça marche ?</strong>
      </Text>
      
      <Text style={emailStyles.textMuted}>
        • 🎯 Parie sur des événements réels<br />
        • 📈 Gagne des Zeny si ta prédiction est correcte<br />
        • 🏆 Grimpe dans le classement et débloque des récompenses
      </Text>

      <Section style={{ textAlign: 'center', margin: '25px 0' }}>
        <Link href={loginUrl} style={emailStyles.button}>
          Commencer à parier →
        </Link>
      </Section>

      <Text style={emailStyles.textMuted}>
        Si tu as des questions, réponds simplement à cet email ou contacte-nous à support@y0mi.fun
      </Text>

      <Text style={emailStyles.text}>
        À très vite sur YOMI ! 🚀
      </Text>
    </EmailLayout>
  )
}

export default WelcomeEmail

