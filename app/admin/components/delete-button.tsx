"use client"

import { Trash } from "lucide-react"
import { useFormStatus } from "react-dom"
import { deleteMarket } from "@/app/admin/actions"
import { useToast } from "@/hooks/use-toast"

function DeleteButton() {
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? (
        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
      ) : (
        <Trash className="w-4 h-4" />
      )}
    </button>
  )
}

export function DeleteMarket({ marketId }: { marketId: string }) {
  const { toast } = useToast()

  const handleDelete = async (formData: FormData) => {
    const result = await deleteMarket(formData)
    if (result.error) {
      toast({
        title: "Erreur",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Marché supprimé",
        variant: "default"
      })
    }
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="marketId" value={marketId} />
      <DeleteButton />
    </form>
  )
}

