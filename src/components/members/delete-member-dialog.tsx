"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { deleteMember } from "@/app/lib/actions-members"

interface DeleteMemberDialogProps {
    member: { id: string; name: string } | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteMemberDialog({ member, open, onOpenChange }: DeleteMemberDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!member) return

        setIsDeleting(true)
        try {
            const result = await deleteMember(member.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Socio eliminado correctamente")
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Error inesperado al eliminar")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-500">
                        <Trash2 className="w-5 h-5" />
                        Eliminar Socio
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        ¿Estás seguro que deseas eliminar a <span className="font-bold text-white">{member?.name}</span>?
                        <br />
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="hover:bg-white/10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            "Eliminar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
