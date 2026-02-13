/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Uploads historical payments for a user.
 * - Updates membership expiration date.
 * - Creates a Sale record with isHistorical = true (ignored in cash flow).
 * - Restricted to ADMIN/SUPERUSER (Preference: SUPERUSER as per request).
 */
export async function uploadHistoricalPayments(data: { rut: string, amount: number, paymentDate: string, months: number }[]) {
    const session = await auth();
    // Restriction: Only SUPERUSER (or ADMIN if needed, but text said 'exclusiva del Súper Administrador')
    if (session?.user?.role !== 'SUPERUSER') {
        return { success: false, error: 'Acceso Denegado: Solo el Súper Administrador puede cargar datos históricos.' };
    }

    let successCount = 0;
    const errors: any[] = [];

    for (const row of data) {
        try {
            // Find User by RUT
            const user = await prisma.user.findUnique({ where: { rut: row.rut } });

            if (!user) {
                errors.push({ rut: row.rut, error: 'Usuario no encontrado' });
                continue;
            }

            // Calculate new Expiration Date
            // Logic: If user has a future expiration, add to it? Or just set it from the payment date?
            // "Cargar historial del último año".
            // If the excel says "Paid in Jan 2024 for 12 months", expiration should be Jan 2025.
            // We will assume the Excel provides the "Execution Date" (paymentDate) and "Months Covered".

            // Logic A: Set expiration relative to Payment Date?
            // Logic B: Set expiration relative to Current Expiration?
            // Given this is "Legacy Load", likely we want to set the expiration to a specific resulting date.
            // Simplified: New Expiration = Payment Date + Months.

            const payDate = new Date(row.paymentDate);
            const newExpiration = new Date(payDate);
            newExpiration.setMonth(newExpiration.getMonth() + row.months);

            // Update User
            // check if this new expiration is later than what they currently have (to avoid overwriting with older data if multiple rows)
            const currentExp = user.membershipExpiresAt ? new Date(user.membershipExpiresAt) : new Date(0);

            if (newExpiration > currentExp) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { membershipExpiresAt: newExpiration }
                });
            }

            // Create Historical Sale
            await prisma.sale.create({
                data: {
                    userId: user.id,
                    total: row.amount,
                    method: 'HISTORICAL', // Generic method
                    type: 'MEMBERSHIP',
                    isHistorical: true, // ERROR: Field needs to be in schema. Verified it was added.
                    createdAt: payDate, // Backdate the creation? Or keep now? 
                    // Better to keep `createdAt` as NOW (audit trail of when it was uploaded) 
                    // and store the real date in metadata or a specific field?
                    // Prisma `createdAt` is usually default(now).
                    // If we want reporting by date, we might want to override createdAt or use `metadata.paymentDate`.
                    // For "Legacy Data", we usually want it to affect "Status" (Expiration) but NOT "Cash Flow of TODAY".
                    // So `createdAt` = NOW is fine for the record insertion, but we flag it isHistorical.

                    items: [{
                        name: `Carga Histórica: Pago ${row.months} meses`,
                        price: row.amount,
                        quantity: 1,
                        productId: 'HISTORICAL_IMPORT'
                    }],
                    metadata: {
                        originalPaymentDate: row.paymentDate,
                        importedBy: session.user.email
                    }
                }
            });

            successCount++;

        } catch (error: any) {
            console.error(`Error importing row for RUT ${row.rut}:`, error);
            errors.push({ rut: row.rut, error: error.message });
        }
    }

    revalidatePath('/dashboard/members');
    return { success: true, count: successCount, errors };
}
