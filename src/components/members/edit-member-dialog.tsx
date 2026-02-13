"use client"

import { useState, useRef } from "react"
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
import { updateMember } from "@/app/lib/actions-members"
import { Loader2, Camera, Upload, FileText, CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface EditMemberDialogProps {
    member: {
        id: string
        name: string
        rut?: string | null
        email?: string | null
        type: string
        debtLimit?: number
        image?: string | null
        documentImage?: string | null
    }
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function EditMemberDialog({ member, trigger, open, onOpenChange }: EditMemberDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<any>({})

    // File states
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(member.image || null)

    const [docFile, setDocFile] = useState<File | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setDocFile(file)
        }
    }

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        setErrors({})

        // Append files manually if they exist (FormData from form might not match if we controlled inputs weirdly, 
        // but inputs with name attribute inside form usually work. We'll verify.)

        // Actually, inputs with name="image" and type="file" will be in formData automatically.
        // But if we used a hidden input or custom handler, we might need to append.
        // We will use hidden file inputs referenced by refs for styling.

        if (imageFile) formData.set("image", imageFile)
        if (docFile) formData.set("documentImage", docFile)

        const result = await updateMember(member.id, formData)

        if (result?.error) {
            setErrors(result.error)
            setIsLoading(false)
        } else {
            setOpen(false)
            setIsLoading(false)
            // Optional: Toast success
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 text-white p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-black/40 border-b border-white/5">
                    <DialogTitle className="text-2xl text-center">Editar Socio</DialogTitle>
                </DialogHeader>

                <form action={onSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="w-24 h-24 border-2 border-dashed border-white/20 group-hover:border-primary/50 transition-colors">
                                <AvatarImage src={imagePreview || ""} />
                                <AvatarFallback className="bg-white/5 text-zinc-500">
                                    <Camera className="w-8 h-8" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                                <span className="text-xs text-white font-medium">Cambiar</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            name="image_dummy" // We append manually to ensure correctness or just let it be if we didn't use append logic above? 
                        // Standard form action gets it if input has name. 
                        // But we manually set keys above in onSubmit to be safe.
                        />
                        <span className="text-xs text-zinc-400">Click para subir foto de perfil</span>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium text-zinc-300">Nombre Completo</label>
                            <Input name="name" defaultValue={member.name} className="bg-zinc-900 border-white/10" required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">RUT</label>
                            <Input name="rut" defaultValue={member.rut || ""} className="bg-zinc-900 border-white/10" />
                            {errors.rut && <p className="text-red-400 text-xs">{errors.rut}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Email</label>
                            <Input name="email" type="email" defaultValue={member.email || ""} className="bg-zinc-900 border-white/10" />
                            {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
                        </div>
                    </div>

                    {/* Type & Limit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Tipo de Cliente</label>
                            <Select name="type" defaultValue={member.type}>
                                <SelectTrigger className="bg-zinc-900 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                                    <SelectItem value="SOCIO">Socio</SelectItem>
                                    <SelectItem value="SOCIO_FUNDADOR">Socio Fundador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Cupo ($)</label>
                            <Input type="number" name="debtLimit" defaultValue={member.debtLimit || 0} className="bg-zinc-900 border-white/10" />
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Cédula de Identidad / Documento
                        </label>

                        <div
                            className="border border-dashed border-white/20 rounded-lg p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => docInputRef.current?.click()}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded">
                                    {docFile ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Upload className="w-5 h-5 text-zinc-400" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-zinc-200">
                                        {docFile ? docFile.name : (member.documentImage ? "Documento cargado (Click para cambiar)" : "Subir escaneo de documento")}
                                    </span>
                                    <span className="text-xs text-zinc-500">PDF, PNG, JPG (Max 4MB)</span>
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm">Examinar</Button>
                        </div>
                        <input
                            type="file"
                            ref={docInputRef}
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleDocChange}
                        />
                    </div>

                    {errors.root && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{errors.root}</p>}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary text-black font-semibold hover:bg-primary/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
