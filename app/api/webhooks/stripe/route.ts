import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Init Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: '2024-12-18.acacia', // Let SDK handle version
  typescript: true,
})

// Init Supabase Admin (to bypass RLS and update user balance)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Get metadata we sent during checkout
    const userId = session.metadata?.userId
    const zenyAmount = Number(session.metadata?.zenyAmount)

    if (!userId || !zenyAmount) {
      console.error('Webhook Error: Missing metadata')
      return new NextResponse('Missing metadata', { status: 400 })
    }

    console.log(`💰 Processing payment for user ${userId}: +${zenyAmount} Zeny`)

    // 1. Get current balance
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      console.error('Webhook Error: User not found', fetchError)
      return new NextResponse('User not found', { status: 400 })
    }

    // 2. Update balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: profile.balance + zenyAmount })
      .eq('id', userId)

    if (updateError) {
      console.error('Webhook Error: Failed to update balance', updateError)
      return new NextResponse('Failed to update balance', { status: 500 })
    }

    console.log(`✅ Success! User ${userId} credited with ${zenyAmount} Zeny. New balance: ${profile.balance + zenyAmount}`)
  }

  return new NextResponse(null, { status: 200 })
}

