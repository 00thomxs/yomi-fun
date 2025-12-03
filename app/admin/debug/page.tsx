import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const revalidate = 0

export default async function DebugPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id || '')
    .single()

  // Try to get orders with normal client
  const { data: ordersNormal, error: ordersNormalError } = await supabase
    .from('orders')
    .select('*')

  // Try to get orders with admin client
  let ordersAdmin = null
  let ordersAdminError = null
  
  try {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const result = await adminClient.from('orders').select('*')
    ordersAdmin = result.data
    ordersAdminError = result.error
  } catch (e: any) {
    ordersAdminError = { message: e.message }
  }

  // Try to get shop_items
  const { data: shopItems, error: shopItemsError } = await supabase
    .from('shop_items')
    .select('*')

  // Check env vars
  const envCheck = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  }

  return (
    <div className="space-y-6 text-sm">
      <h1 className="text-2xl font-bold">🔍 Debug Shop & Orders</h1>
      
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg">1. Environment Variables</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(envCheck, null, 2)}
        </pre>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg">2. Current User</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto">
          {JSON.stringify({ user: user?.email, id: user?.id, error: userError?.message }, null, 2)}
        </pre>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg">3. Profile (Role Check)</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto">
          {JSON.stringify({ 
            role: profile?.role, 
            balance: profile?.balance,
            error: profileError?.message 
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg">4. Shop Items ({shopItems?.length || 0})</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify({ 
            count: shopItems?.length,
            items: shopItems?.map(i => ({ id: i.id, name: i.name, price: i.price })),
            error: shopItemsError?.message 
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg text-yellow-400">5. Orders (Normal Client - with RLS)</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify({ 
            count: ordersNormal?.length,
            orders: ordersNormal,
            error: ordersNormalError?.message 
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg text-green-400">6. Orders (Admin Client - NO RLS)</h2>
        <pre className="bg-black/30 p-3 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify({ 
            count: ordersAdmin?.length,
            orders: ordersAdmin,
            error: ordersAdminError?.message 
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-rose-900/30 border border-rose-500/50 rounded-xl p-4 space-y-2">
        <h2 className="font-bold text-lg text-rose-400">Diagnostic</h2>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {!envCheck.SERVICE_ROLE_KEY && (
            <li className="text-rose-400">❌ SUPABASE_SERVICE_ROLE_KEY is missing! Add it to Vercel env vars.</li>
          )}
          {profile?.role !== 'admin' && (
            <li className="text-rose-400">❌ Your profile role is NOT admin. Run: UPDATE profiles SET role = 'admin' WHERE id = '{user?.id}'</li>
          )}
          {ordersAdmin?.length === 0 && (
            <li className="text-amber-400">⚠️ No orders in database. The INSERT is failing somewhere.</li>
          )}
          {ordersAdmin && ordersAdmin.length > 0 && ordersNormal?.length === 0 && (
            <li className="text-amber-400">⚠️ Orders exist but RLS blocks them. Admin client works!</li>
          )}
          {ordersAdmin && ordersAdmin.length > 0 && (
            <li className="text-green-400">✅ Orders found! Count: {ordersAdmin.length}</li>
          )}
        </ul>
      </div>
    </div>
  )
}

