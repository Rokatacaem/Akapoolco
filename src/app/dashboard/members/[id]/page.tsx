import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConsumptionChart } from "@/components/members/consumption-chart"
import { Mail, Calendar, CreditCard, ArrowLeft, Banknote } from "lucide-react"
import Link from "next/link"

interface MemberProfilePageProps {
    params: {
        id: string
    }
}

export const dynamic = "force-dynamic"

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
    // Await params to avoid race conditions in newer Next.js versions
    const { id } = await params

    const member = await prisma.user.findUnique({
        where: { id: id },
        include: { sales: true } // Fetch history if available
    })

    if (!member) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background p-8 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                <Link href="/dashboard/members">
                    <Button variant="ghost" className="mb-4 text-zinc-400 hover:text-white pl-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Lista
                    </Button>
                </Link>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <Avatar className="w-32 h-32 border-4 border-white/10 shadow-2xl">
                        <AvatarImage src={member.image || ""} />
                        <AvatarFallback className="text-4xl bg-primary/20 text-primary">{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-bold text-white tracking-tight">{member.name}</h1>
                            <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10 text-sm px-3 py-1">
                                {member.type}
                            </Badge>
                            {member.debtStatus && (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/50">
                                    DEUDA ACTIVA
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-col gap-1 text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {member.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Miembro desde {new Date(member.joinDate).getFullYear()}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                            Editar Perfil
                        </Button>
                        <Button className="bg-primary hover:bg-primary/80">
                            Registrar Pago
                        </Button>
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="history">Historial</TabsTrigger>
                        <TabsTrigger value="settings">Configuración</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Fiado / Debt Card */}
                            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-400">Cuenta Corriente (Fiado)</CardTitle>
                                    <Banknote className="h-4 w-4 text-zinc-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">${(Number(member.currentDebt) || 0).toLocaleString()}</div>
                                    <div className="text-xs text-zinc-500 mb-2">
                                        Cupo: ${(Number(member.debtLimit) || 0).toLocaleString()}
                                    </div>

                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${(Number(member.currentDebt) / Number(member.debtLimit)) > 0.9 ? 'bg-red-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min((Number(member.currentDebt) / Number(member.debtLimit)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-zinc-400">Total Gastado</CardTitle>
                                    <CreditCard className="h-4 w-4 text-zinc-400" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">$452.000</div>
                                    <p className="text-xs text-zinc-500">+20.1% vs mes anterior</p>
                                </CardContent>
                            </Card>
                            {/* More KPI cards... */}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4 bg-black/40 border-white/10 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-white">Resumen de Consumo</CardTitle>
                                    <CardDescription>Desglose mensual de consumo en mesas y bar.</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <ConsumptionChart />
                                </CardContent>
                            </Card>

                            <Card className="col-span-3 bg-black/40 border-white/10 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-white">Actividad Reciente</CardTitle>
                                    <CardDescription>Últimas 5 sesiones.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Mock activity list */}
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-white/5 text-zinc-400">0{i + 1}</AvatarFallback>
                                                </Avatar>
                                                <div className="ml-4 space-y-1">
                                                    <p className="text-sm font-medium text-white">Mesa 4 (Pool)</p>
                                                    <p className="text-xs text-zinc-400">2 hours • $12.000</p>
                                                </div>
                                                <div className="ml-auto font-medium text-zinc-400">-$12.000</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
