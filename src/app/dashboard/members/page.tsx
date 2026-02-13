import { ImportMembersDialog } from "@/components/members/import-members-dialog"
import { HistoricalUploadDialog } from "@/components/admin/HistoricalUploadDialog"
import { MigrationControl } from "@/components/members/MigrationControl"
import { CreateMemberDialog } from "@/components/members/create-member-dialog"
import { MembersTable } from "@/components/members/members-table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function MembersPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const members = await prisma.member.findMany({
        where: {
            type: { in: ['SOCIO', 'CLIENTE', 'SOCIO_FUNDADOR'] }
        },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            email: true,
            type: true,
            debtStatus: true,
            image: true,
            billingProfile: true, // New Field
            membershipExpiresAt: true, // New Field (was already there but maybe not selected?)
            rut: true, // Needed for search/display
            currentDebt: true,
            debtLimit: true
        }
    })

    const userRole = session.user?.role
    const isSuperUser = userRole === 'SUPERUSER';

    // Calculation Logic (Shared with actions-members ideally, but kept here for Server Component efficiency)
    const now = new Date();
    const enrichedMembers = members.map(m => {
        let status = 'AL_DIA';

        if (m.type === 'CLIENTE') {
            status = 'CLIENTE';
        } else if (m.billingProfile === 'HONORARY') {
            status = 'HONORARIO';
        } else if (m.billingProfile === 'EXCEPTION') {
            status = 'CONVENIO';
        } else {
            if (!m.membershipExpiresAt) {
                status = 'PENDIENTE';
            } else {
                const exp = new Date(m.membershipExpiresAt);
                const diffTime = now.getTime() - exp.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) {
                    status = 'AL_DIA';
                } else if (diffDays <= 60) {
                    status = 'PENDIENTE';
                } else {
                }
            }
        }

        return {
            ...m,
            name: m.name || "Sin Nombre",
            email: m.email || "",
            type: m.type as string,
            paymentStatus: status,
            billingProfile: m.billingProfile as string,
            currentDebt: m.currentDebt ? Number(m.currentDebt) : 0,
            debtLimit: m.debtLimit ? Number(m.debtLimit) : 0
        };
    });

    return (
        <div className="min-h-screen bg-background p-8 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Socios</h1>
                    <p className="text-zinc-400">Directorio de Socios del Club (v2)</p>
                </div>
                <div className="flex gap-2">
                    {isSuperUser && <MigrationControl />}
                    {isSuperUser && <HistoricalUploadDialog />}
                    <ImportMembersDialog userRole={userRole} />
                    <CreateMemberDialog />
                </div>
            </div>

            <div className="relative z-10">
                <MembersTable members={enrichedMembers} />
            </div>
        </div>
    )
}
