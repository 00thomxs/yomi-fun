import { createClient } from "@/lib/supabase/server"

export default async function DebugEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  let status = "Checking..."
  
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("markets").select("count").single()
    if (error) {
      status = `Server Error: ${error.message} (Code: ${error.code})`
    } else {
      status = "Connected! Server can reach Supabase."
    }
  } catch (e: any) {
    status = `Server Exception: ${e.message}`
  }

  return (
    <div className="p-10 font-mono text-sm">
      <h1 className="text-xl font-bold mb-4">Debug Environment (Server Side)</h1>
      <div className="space-y-2">
        <p>URL Defined: {url ? "YES" : "NO"}</p>
        <p>URL Value: {url}</p>
        <p>Key Defined: {key ? "YES" : "NO"}</p>
        <p>Key Length: {key?.length || 0}</p>
        <p className="mt-4 font-bold">Connection Status: {status}</p>
      </div>
    </div>
  )
}
