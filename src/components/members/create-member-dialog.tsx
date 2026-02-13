/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createMember } from "@/app/lib/actions-members"
import { PlusCircle, Loader2, Camera } from "lucide-react"

export function CreateMemberDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<any>({})

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        setErrors({})

        const result = await createMember(formData)

        if (result?.error) {
            setErrors(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Registro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 text-white p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-black/40 border-b border-white/5">
                    <DialogTitle className="text-2xl text-center">Nuevo Registro</DialogTitle>
                </DialogHeader>

                <form action={onSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Photo Placeholder */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-zinc-400">Foto de Perfil</span>
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                            <Camera className="w-8 h-8 text-zinc-500" />
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-xs text-zinc-400">
                            aún no implementado
                        </Button>
                    </div>

                    {/* RUT */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">RUT / Pasaporte (Sin Puntos, con Guión)</label>
                        <Input name="rut" placeholder="12345678-9" className="bg-zinc-900 border-white/10 focus:border-primary/50" />
                        {errors.rut && <p className="text-red-400 text-xs">{errors.rut}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email de Contacto</label>
                        <Input name="email" type="email" placeholder="contacto@ejemplo.com" className="bg-zinc-900 border-white/10" />
                        {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                    </div>

                    {/* Nationality */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Nacionalidad</label>
                        <Select name="nationality" defaultValue="Chile">
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="Chile">🇨🇱 Chile</SelectItem>
                                <SelectItem value="Argentina">🇦🇷 Argentina</SelectItem>
                                <SelectItem value="Peru">🇵🇪 Peru</SelectItem>
                                <SelectItem value="Other">🌍 Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Names Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Primer Nombre</label>
                            <Input name="firstName" className="bg-zinc-900 border-white/10" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Segundo Nombre</label>
                            <Input name="secondName" className="bg-zinc-900 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Apellido Paterno</label>
                            <Input name="lastNamePat" className="bg-zinc-900 border-white/10" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Apellido Materno</label>
                            <Input name="lastNameMat" className="bg-zinc-900 border-white/10" />
                        </div>
                    </div>

                    {/* Type & Limit */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Tipo de Cliente</label>
                        <Select name="type" defaultValue="CLIENTE">
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                <SelectItem value="CLIENTE">Cliente (Uso de Infraestructura)</SelectItem>
                                <SelectItem value="SOCIO">Socio (Precios Especiales)</SelectItem>
                                <SelectItem value="SOCIO_FUNDADOR">Socio Fundador (Voto + Precios)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Cupo de Crédito ($)</label>
                        <Input type="number" name="debtLimit" defaultValue="0" className="bg-zinc-900 border-white/10" />
                        <p className="text-[10px] text-zinc-500">Límite máximo de deuda permitida.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Fecha de Incorporación</label>
                        <Input type="date" name="joinDate" className="bg-zinc-900 border-white/10 block w-full text-white" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Vencimiento Membresía (Opcional - Para Antiguos)</label>
                        <Input type="date" name="membershipExpiresAt" className="bg-zinc-900 border-white/10 block w-full text-white" />
                        <p className="text-[10px] text-zinc-500">Dejar en blanco para usar la fecha automática (1 año).</p>
                    </div>

                    {errors.root && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{errors.root}</p>}

                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrar Usuario
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
