import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
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
              <Text style={logoContainer}>
                <span style={logoText}>YOMI</span>
                <span style={logoSubtext}>.fun</span>
              </Text>
            </Link>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} YOMI.fun
            </Text>
            <Text style={footerLinks}>
              <Link href="https://y0mi.fun" style={link}>Site</Link>
              {' • '}
              <Link href="https://y0mi.fun/profile" style={link}>Mon Profil</Link>
              {' • '}
              <Link href="mailto:yomipredict.fun@gmail.com" style={link}>Support</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles - YOMI Brand Colors
const BRAND_RED = '#dc2626'

// Subtle grid pattern (SVG encoded)
const gridPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M40 0v40M0 40h40' stroke='%23ffffff' stroke-opacity='0.03' stroke-width='1'/%3E%3C/svg%3E")`

const main = {
  backgroundColor: '#0a0a0a',
  backgroundImage: gridPattern,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#111111',
  margin: '0 auto',
  padding: '0',
  maxWidth: '560px',
  borderRadius: '16px',
  border: '1px solid #262626',
}

const header = {
  padding: '35px 40px 25px',
  textAlign: 'center' as const,
  backgroundColor: '#0a0a0a',
  borderTopLeftRadius: '16px',
  borderTopRightRadius: '16px',
}

const logoLink = {
  textDecoration: 'none',
}

const logoContainer = {
  margin: '0',
  padding: '0',
}

const logoText = {
  color: BRAND_RED,
  fontSize: '38px',
  fontWeight: '900',
  letterSpacing: '-2px',
}

const logoSubtext = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '400',
}

const content = {
  padding: '30px 40px 35px',
  backgroundColor: '#111111',
  backgroundImage: gridPattern,
}

const footer = {
  padding: '25px 40px 30px',
  textAlign: 'center' as const,
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid #262626',
  borderBottomLeftRadius: '16px',
  borderBottomRightRadius: '16px',
}

const footerText = {
  color: '#666',
  fontSize: '12px',
  margin: '0 0 12px',
}

const footerLinks = {
  color: '#888',
  fontSize: '12px',
  margin: '0',
}

const link = {
  color: '#999',
  textDecoration: 'none',
}

// Shared styles for email templates - Using YOMI Brand Red
export const emailStyles = {
  h1: {
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 20px',
    padding: '0',
    lineHeight: '1.3',
  },
  h2: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 15px',
    padding: '0',
  },
  text: {
    color: '#d4d4d4',
    fontSize: '15px',
    lineHeight: '1.7',
    margin: '0 0 16px',
  },
  textMuted: {
    color: '#737373',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 15px',
  },
  button: {
    backgroundColor: BRAND_RED,
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '600',
    padding: '14px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    margin: '10px 0',
  },
  buttonSecondary: {
    backgroundColor: '#262626',
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 24px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    border: '1px solid #404040',
  },
  highlight: {
    color: BRAND_RED,
    fontWeight: '600',
  },
  successText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    margin: '20px 0',
    border: '1px solid #262626',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: '36px',
    fontWeight: '700',
    margin: '0',
  },
  statLabel: {
    color: '#737373',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
    margin: '8px 0 0',
  },
}
