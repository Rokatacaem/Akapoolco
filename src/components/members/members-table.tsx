"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, FileText, Pencil, Search, ChevronLeft, ChevronRight, Filter, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { EditMemberDialog } from "./edit-member-dialog"
import { DeleteMemberDialog } from "./delete-member-dialog"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface Member {
    id: string
    name: string
    email: string | null
    type: string
    debtStatus: boolean
    image?: string | null
    documentImage?: string | null
    rut?: string | null
    paymentStatus?: string // New
    billingProfile?: string // New
}

interface MembersTableProps {
    members: Member[]
}

const ITEMS_PER_PAGE = 8;

export function MembersTable({ members }: MembersTableProps) {
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [deletingMember, setDeletingMember] = useState<Member | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("ALL")
    const [filterStatus, setFilterStatus] = useState("ALL") // New Filter
    const [currentPage, setCurrentPage] = useState(1)

    // Filter Logic
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const matchesSearch =
                member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (member.rut && member.rut.includes(searchTerm));

            const matchesType = filterType === "ALL" || member.type === filterType;
            const matchesStatus = filterStatus === "ALL" || (member.paymentStatus || 'AL_DIA') === filterStatus;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [members, searchTerm, filterType, filterStatus]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page logic moved to handlers

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por nombre, email o RUT..."
                        className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-zinc-400 hidden md:block" />
                    <Select value={filterType} onValueChange={(val) => {
                        setFilterType(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-full md:w-[200px] bg-zinc-900/50 border-white/10 text-white">
                            <SelectValue placeholder="Filtrar por tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            <SelectItem value="ALL">Todos los Tipos</SelectItem>
                            <SelectItem value="SOCIO">Socio</SelectItem>
                            <SelectItem value="SOCIO_FUNDADOR">Socio Fundador</SelectItem>
                            <SelectItem value="CLIENTE">Cliente</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={(val) => {
                        setFilterStatus(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-full md:w-[200px] bg-zinc-900/50 border-white/10 text-white">
                            <SelectValue placeholder="Estado de Pago" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            <SelectItem value="ALL">Todos los Estados</SelectItem>
                            <SelectItem value="AL_DIA">Al Día</SelectItem>
                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                            <SelectItem value="MOROSO">Moroso</SelectItem>
                            <SelectItem value="CONVENIO">Convenio</SelectItem>
                            <SelectItem value="HONORARIO">Honorario</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
                <div className="relative overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5 hover:bg-white/5">
                                <TableHead className="w-[80px] text-zinc-400">Avatar</TableHead>
                                <TableHead className="text-zinc-400">Información</TableHead>
                                <TableHead className="text-zinc-400">Tipo</TableHead>
                                <TableHead className="text-zinc-400">Estado</TableHead>
                                <TableHead className="text-right text-zinc-400">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedMembers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedMembers.map((member) => (
                                    <TableRow key={member.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell>
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarImage src={member.image || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {member.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell className="font-medium text-white">
                                            <div className="flex flex-col">
                                                <span className="text-sm">{member.name}</span>
                                                <span className="text-xs text-muted-foreground">{member.email || member.rut || "Sin contacto"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "border-opacity-50",
                                                member.type === 'SOCIO_FUNDADOR' ? "border-amber-500 text-amber-500 bg-amber-500/10" :
                                                    member.type === 'SOCIO' ? "border-primary text-primary bg-primary/10" :
                                                        "border-zinc-500 text-zinc-400 bg-zinc-500/10"
                                            )}>
                                                {member.type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const s = member.paymentStatus || 'AL_DIA';
                                                switch (s) {
                                                    case 'MOROSO':
                                                        return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/50">MOROSO</Badge>;
                                                    case 'PENDIENTE':
                                                        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">PENDIENTE</Badge>;
                                                    case 'HONORARIO':
                                                        return <Badge variant="outline" className="text-purple-400 border-purple-500/50">HONORARIO</Badge>;
                                                    case 'CONVENIO':
                                                        return <Badge variant="outline" className="text-blue-400 border-blue-500/50">CONVENIO</Badge>;
                                                    case 'CLIENTE':
                                                        return <span className="text-xs text-muted-foreground">-</span>;
                                                    default: // AL_DIA
                                                        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/50">AL DÍA</Badge>;
                                                }
                                            })()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-zinc-200">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="focus:bg-primary/20 focus:text-primary cursor-pointer mt-1"
                                                        onClick={() => setEditingMember(member)}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar Datos
                                                    </DropdownMenuItem>
                                                    <Link href={`/dashboard/members/${member.id}`} className="w-full">
                                                        <DropdownMenuItem className="focus:bg-primary/20 focus:text-primary cursor-pointer">
                                                            <FileText className="mr-2 h-4 w-4" /> Ver Perfil
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuSeparator className="bg-white/10" />
                                                    <DropdownMenuItem
                                                        className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer"
                                                        onClick={() => setDeletingMember(member)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} de {filteredMembers.length} socios
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-zinc-900 border-white/10 hover:bg-white/10"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-white">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-zinc-900 border-white/10 hover:bg-white/10"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {editingMember && (
                <EditMemberDialog
                    member={editingMember}
                    open={!!editingMember}
                    onOpenChange={(open) => !open && setEditingMember(null)}
                />
            )}

            {deletingMember && (
                <DeleteMemberDialog
                    member={deletingMember}
                    open={!!deletingMember}
                    onOpenChange={(open) => !open && setDeletingMember(null)}
                />
            )}
        </div>
    )
}
