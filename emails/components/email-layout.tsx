import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Link href="https://y0mi.fun" style={logoLink}>
              {/* Text-based logo for better email compatibility */}
              <Text style={logoText}>YOMI</Text>
              <Text style={logoSubtext}>.fun</Text>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} YOMI.fun — La plateforme de paris prédictifs
            </Text>
            <Text style={footerLinks}>
              <Link href="https://y0mi.fun" style={link}>Site</Link>
              {' • '}
              <Link href="https://y0mi.fun/profile" style={link}>Mon Profil</Link>
              {' • '}
              <Link href="mailto:yomipredict.fun@gmail.com" style={link}>Support</Link>
            </Text>
            <Text style={footerMuted}>
              Tu reçois cet email car tu es inscrit sur YOMI.fun
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#111111',
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '560px',
  borderRadius: '12px',
  border: '1px solid #222',
}

const header = {
  padding: '30px 40px 20px',
  textAlign: 'center' as const,
}

const logoLink = {
  textDecoration: 'none',
}

const logoText = {
  color: '#dc2626', // Red like the YOMI brand
  fontSize: '36px',
  fontWeight: '800',
  margin: '0',
  padding: '0',
  letterSpacing: '-1px',
  display: 'inline',
}

const logoSubtext = {
  color: '#888888',
  fontSize: '24px',
  fontWeight: '400',
  margin: '0',
  padding: '0',
  display: 'inline',
}

const content = {
  padding: '20px 40px 30px',
}

const hr = {
  borderColor: '#333',
  margin: '20px 40px',
}

const footer = {
  padding: '10px 40px 30px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#888',
  fontSize: '12px',
  margin: '0 0 10px',
}

const footerLinks = {
  color: '#888',
  fontSize: '12px',
  margin: '0 0 10px',
}

const link = {
  color: '#00d4ff',
  textDecoration: 'none',
}

const footerMuted = {
  color: '#555',
  fontSize: '11px',
  margin: '10px 0 0',
}

// Shared styles for email templates
export const emailStyles = {
  h1: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 20px',
    padding: '0',
    lineHeight: '1.3',
  },
  h2: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: '600',
    margin: '0 0 15px',
    padding: '0',
  },
  text: {
    color: '#cccccc',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 15px',
  },
  textMuted: {
    color: '#888888',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 15px',
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: '8px',
    color: '#000000',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    margin: '10px 0',
  },
  buttonSecondary: {
    backgroundColor: '#333333',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  highlight: {
    color: '#00d4ff',
    fontWeight: '600',
  },
  successText: {
    color: '#10b981',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '20px',
    margin: '15px 0',
    border: '1px solid #333',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
  },
  statLabel: {
    color: '#888888',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    margin: '5px 0 0',
  },
}

