'use server'

import { createClient } from '@/lib/supabase/server'
import { ZENY_PACKS } from '@/lib/constants'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2024-12-18.acacia', // Let the SDK use its default version
  typescript: true,
})

export async function createStripeCheckoutSession(packId: string) {
  try {
    const supabase = await createClient()
    
    // 1. Verify Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Vous devez être connecté pour acheter des Zeny." }
    }

    // 2. Validate Pack
    const pack = ZENY_PACKS.find(p => p.id === packId)
    if (!pack) {
      return { error: "Pack invalide." }
    }

    // 3. Get Origin (for redirect URLs)
    // headers() is async in newer Next.js versions but currently sync in 14? 
    // Safe way: use a fixed URL in production or try to infer
    const headersList = headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 4. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
              description: `${pack.amount.toLocaleString()} Zeny (dont ${pack.bonus} offerts)`,
              // We could add images here if we had them hosted
            },
            unit_amount: Math.round(pack.price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/shop?success=true&amount=${pack.amount}`,
      cancel_url: `${origin}/shop/buy-zeny?canceled=true`,
      metadata: {
        userId: user.id,
        packId: pack.id,
        zenyAmount: pack.amount.toString(),
      },
    })

    return { url: session.url }

  } catch (error) {
    console.error('Stripe Error:', error)
    return { error: "Erreur lors de la création de la session de paiement." }
  }
}

