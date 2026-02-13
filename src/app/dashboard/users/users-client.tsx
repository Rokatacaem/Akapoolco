/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, User as UserIcon, Shield } from "lucide-react"
import { toast } from "sonner"
import { createUser, deleteUser, resetUserPassword } from "@/app/lib/actions-users"
import { UserRole } from "@prisma/client"
import { PERMISSIONS, AVAILABLE_PERMISSIONS } from "@/lib/permissions"
import { KeyRound } from "lucide-react"


interface User {
    id: string
    name: string
    email: string | null
    role: UserRole
    systemAccess: boolean
    createdAt: Date | string
    customPermissions?: any
}

interface UsersClientProps {
    initialUsers: User[]
}

export function UsersClient({ initialUsers }: UsersClientProps) {
    const [users] = useState<User[]>(initialUsers)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Reset Password State
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [userToReset, setUserToReset] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "STAFF" as UserRole,
        customPermissions: {} as Record<string, boolean>
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await createUser(formData)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(res.message)
                setIsOpen(false)
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "STAFF",
                    customPermissions: {}
                })
                window.location.reload()
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return

        try {
            const res = await deleteUser(userId)
            if (res.error) toast.error(res.error)
            else {
                toast.success(res.message)
                window.location.reload()
            }
        } catch (error) {
            toast.error("Error al eliminar")
        }
    }

    const openResetDialog = (user: User) => {
        setUserToReset(user)
        setNewPassword("")
        setResetDialogOpen(true)
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userToReset || !newPassword) return

        setIsLoading(true)
        try {
            const res = await resetUserPassword(userToReset.id, newPassword)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(res.message)
                setResetDialogOpen(false)
                setUserToReset(null)
            }
        } catch (error) {
            toast.error("Error al restablecer contraseña")
        } finally {
            setIsLoading(false)
        }
    }

    const togglePermission = (key: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            customPermissions: {
                ...prev.customPermissions,
                [key]: checked
            }
        }))
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "SUPERUSER": return <Badge className="bg-purple-900 text-purple-200">Super Usuario</Badge>
            case "ADMIN": return <Badge className="bg-blue-900 text-blue-200">Administrador</Badge>
            case "STAFF": return <Badge className="bg-slate-700 text-slate-200">Cajero / Staff</Badge>
            default: return <Badge variant="outline">{role}</Badge>
        }
    }

    // Determine effective permission state for UI (Default vs Overridden)
    const getPermissionState = (key: string) => {
        // If explicitly set in custom, use that
        if (typeof formData.customPermissions[key] === 'boolean') {
            return formData.customPermissions[key]
        }
        // Otherwise use default from Role
        return PERMISSIONS[key]?.includes(formData.role) ?? false
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-emerald-600 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                            <DialogDescription>
                                Ingrese los datos del nuevo usuario del sistema.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre Completo</Label>
                                    <Input
                                        required
                                        className="bg-black/20 border-white/10"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rol / Perfil</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(val: UserRole) => setFormData({ ...formData, role: val, customPermissions: {} })}
                                    >
                                        <SelectTrigger className="bg-black/20 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="STAFF">Cajero / Mesero</SelectItem>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                            <SelectItem value="SUPERUSER">Super Usuario</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Correo Electrónico (Login)</Label>
                                <Input
                                    required
                                    type="email"
                                    className="bg-black/20 border-white/10"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Contraseña</Label>
                                <Input
                                    required
                                    type="password"
                                    minLength={6}
                                    className="bg-black/20 border-white/10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/10">
                                <Label className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    Permisos Avanzados
                                </Label>
                                <div className="bg-black/20 rounded-md p-3 border border-white/5 space-y-3">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Personalice los accesos. <span className="text-emerald-400">Verde</span> = Permitido por defecto.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(AVAILABLE_PERMISSIONS).map(([key, label]) => {
                                            const isDefault = PERMISSIONS[key]?.includes(formData.role)
                                            const isChecked = getPermissionState(key)
                                            const isOverridden = typeof formData.customPermissions[key] === 'boolean'

                                            // Determine visual state
                                            // If default is TRUE, check is TRUE. 
                                            // If user unchecks, it becomes FALSE (override).

                                            return (
                                                <div key={key} className="flex items-start space-x-2">
                                                    <Checkbox
                                                        id={key}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => togglePermission(key, !!checked)}
                                                        className={isDefault && !isOverridden ? "data-[state=checked]:bg-emerald-600 border-emerald-600/50" : ""}
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label
                                                            htmlFor={key}
                                                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${isChecked ? 'text-white' : 'text-muted-foreground'}`}
                                                        >
                                                            {label}
                                                        </label>
                                                        {isOverridden && (
                                                            <span className="text-[10px] text-amber-500 font-mono">
                                                                (Manual)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? "Creando..." : "Crear Usuario"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-400">Usuario</TableHead>
                            <TableHead className="text-gray-400">Rol</TableHead>
                            <TableHead className="text-gray-400">Permisos Personalizados</TableHead>
                            <TableHead className="text-gray-400 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-white">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-3 text-slate-400">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                    {user.customPermissions && Object.keys(user.customPermissions).length > 0 ? (
                                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/20 bg-amber-900/10">
                                            {Object.keys(user.customPermissions).length} Excepciones
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                                        onClick={() => openResetDialog(user)}
                                        title="Restablecer Contraseña"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restablecer Contraseña</DialogTitle>
                        <DialogDescription>
                            Ingrese la nueva contraseña para <strong>{userToReset?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña</Label>
                            <Input
                                required
                                type="password"
                                minLength={6}
                                className="bg-black/20 border-white/10"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)} className="border-white/10 hover:bg-white/5">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
                                {isLoading ? "Guardando..." : "Restablecer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
