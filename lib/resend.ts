import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set - emails will not be sent')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
// Domain y0mi.fun is verified on Resend
const DOMAIN_VERIFIED = true

export const EMAIL_CONFIG = {
  from: {
    default: DOMAIN_VERIFIED 
      ? 'YOMI.fun <noreply@y0mi.fun>' 
      : 'YOMI.fun <onboarding@resend.dev>',
    support: 'YOMI Support <yomipredict.fun@gmail.com>',
  },
  replyTo: 'yomipredict.fun@gmail.com',
}

