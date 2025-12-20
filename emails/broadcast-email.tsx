import { Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout, emailStyles } from './components/email-layout'

interface BroadcastEmailProps {
  username: string
  subject: string
  content: string
  ctaText?: string
  ctaUrl?: string
}

export function BroadcastEmail({ 
  username = 'Joueur',
  subject = 'Annonce importante',
  content = 'Contenu de l\'annonce...',
  ctaText,
  ctaUrl,
}: BroadcastEmailProps) {
  // Parse content - support basic markdown-like formatting
  // **bold** -> <strong>
  // \n -> <br />
  const formattedContent = content
    .split('\n')
    .map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) => 
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))

  return (
    <EmailLayout preview={subject}>
      <Text style={emailStyles.h1}>
        {subject}
      </Text>
      
      <Text style={emailStyles.text}>
        Salut <span style={emailStyles.highlight}>{username}</span>,
      </Text>
      
      <Text style={emailStyles.text}>
        {formattedContent}
      </Text>

      {ctaText && ctaUrl && (
        <Section style={{ textAlign: 'center', margin: '25px 0' }}>
          <Link href={ctaUrl} style={emailStyles.button}>
            {ctaText}
          </Link>
        </Section>
      )}

      <Text style={emailStyles.textMuted}>
        — L'équipe YOMI.fun
      </Text>
    </EmailLayout>
  )
}

export default BroadcastEmail

