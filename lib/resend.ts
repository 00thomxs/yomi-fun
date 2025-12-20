import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set - emails will not be sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const EMAIL_CONFIG = {
  from: {
    default: 'YOMI.fun <noreply@y0mi.fun>',
    support: 'YOMI Support <support@y0mi.fun>',
  },
  replyTo: 'support@y0mi.fun',
}

