"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { changeOwnPassword } from "@/app/lib/actions-users"
import { Lock, AlertCircle } from "lucide-react"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error("Las nuevas contraseñas no coinciden")
            return
        }

        if (newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres")
            return
        }

        setIsLoading(true)
        try {
            const res = await changeOwnPassword(currentPassword, newPassword)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(res.message)
                if (res.remainingChanges !== undefined) {
                    toast.info(`Cambios restantes este mes: ${res.remainingChanges}`)
                }
                handleClose()
            }
        } catch (err) {
            toast.error("Error al cambiar contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                        Ingrese su contraseña actual y la nueva contraseña deseada.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-md flex gap-3 text-sm text-blue-200 mb-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    <p>Por seguridad, tiene un límite de <strong>4 cambios de contraseña por mes</strong>.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Contraseña Actual</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="password"
                                className="pl-9 bg-black/20 border-white/10"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nueva Contraseña</Label>
                        <Input
                            type="password"
                            className="bg-black/20 border-white/10"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Confirmar Nueva Contraseña</Label>
                        <Input
                            type="password"
                            className="bg-black/20 border-white/10"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={handleClose} className="hover:bg-white/10">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-emerald-600">
                            {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
