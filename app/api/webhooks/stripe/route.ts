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

    if (session.payment_status !== 'paid') {
      return new NextResponse(null, { status: 200 })
    }

    console.log(`💰 Processing payment for user ${userId}: +${zenyAmount} Zeny`)

    // 1. Record the payment first. stripe_session_id is UNIQUE, so a redelivered event cannot credit twice.
    const { error: recordError } = await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount: zenyAmount,
      description: `Achat de ${zenyAmount} Zeny`,
      stripe_session_id: session.id,
    })

    if (recordError?.code === '23505') {
      console.log(`Webhook: session ${session.id} already credited, skipping`)
      return new NextResponse(null, { status: 200 })
    }
    if (recordError) {
      console.error('Webhook Error: Failed to record payment', recordError)
      // 23503 = unknown user (foreign key): retrying will not help
      return new NextResponse('Failed to record payment', { status: recordError.code === '23503' ? 400 : 500 })
    }

    // 2. Credit atomically (balance = balance + amount)
    const { error: creditError } = await supabaseAdmin
      .rpc('increment_balance', { p_user_id: userId, p_amount: zenyAmount })

    if (creditError) {
      console.error('Webhook Error: Failed to credit balance', creditError)
      // Remove the record so Stripe's retry can credit it
      await supabaseAdmin.from('transactions').delete().eq('stripe_session_id', session.id)
      return new NextResponse('Failed to credit balance', { status: 500 })
    }

    console.log(`✅ Success! User ${userId} credited with ${zenyAmount} Zeny (session ${session.id})`)
  }

  return new NextResponse(null, { status: 200 })
}

