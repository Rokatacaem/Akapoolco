import { UserType, UserStatus, Table, Product } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function validateActiveShift() {
    const activeShift = await prisma.shift.findFirst({
        where: { status: "OPEN" }
    });

    if (!activeShift) {
        throw new Error("CAJA CERRADA: No se pueden realizar acciones sin un turno abierto.");
    }
    return activeShift;
}

// Constants for Rules
export const MEMBER_GRACE_PERIOD_DAYS = 30;

/**
 * Determines if a user is considered an Active Member (Socio/Fundador)
 * Rules:
 * - Must be SOCIO or SOCIO_FUNDADOR
 * - Status must be ACTIVE
 * - OR Status INACTIVE but within grace period (handled by caller typically, but here we enforce strict status)
 * 
 * Note: The 30-day rule pushes them to INACTIVE, so checking status === ACTIVE is usually sufficient.
 */
export function isUserActiveMember(user: { type: UserType; status: UserStatus; membershipExpiresAt?: Date | null } | null): boolean {
    if (!user) return false;

    // Must be a Member Type
    if (user.type !== "SOCIO" && user.type !== "SOCIO_FUNDADOR") return false;

    // Must be explicitly ACTIVE (not Banned/Deleted)
    if (user.status !== "ACTIVE") return false;

    // Check Expiration + Grace Period
    // If no expiration date, assume active (legacy) or indefinite
    if (!user.membershipExpiresAt) return true;

    const now = new Date();
    const gracePeriodEnd = new Date(user.membershipExpiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + MEMBER_GRACE_PERIOD_DAYS); // 30 Days Grace

    // If Now is after Grace Period End, they are NOT active member (Financial Inactivity)
    if (now > gracePeriodEnd) {
        return false;
    }

    return true;
}

/**
 * Calculates the product price for a specific user.
 * Returns member price if user is an active member, otherwise client price.
 */
export function calculateProductPrice(product: Product, user: { type: UserType; status: UserStatus; membershipExpiresAt?: Date | null } | null): number {
    if (isUserActiveMember(user)) {
        return Number(product.priceMember);
    }
    return Number(product.priceClient);
}

/**
 * Calculates the hourly rate for a table session/player.
 * 
 * Logic:
 * - Pool/Snooker (Per Table): 
 *   - If the payer (or session starter) is a Member, use priceMember for the whole table.
 *   - Else, priceClient.
 *   - **Note**: This logic often resides in the Session creation, but we provide the helper here.
 * 
 * - Cards (Per Person):
 *   - Each player pays based on their own status.
 */
export function calculateTableRate(table: Table, user: { type: UserType; status: UserStatus; membershipExpiresAt?: Date | null } | null): number {
    if (isUserActiveMember(user)) {
        return Number(table.priceMember);
    }
    return Number(table.priceClient);
}

/**
 * Helper to check if a specific debt amount allows purchasing (credit check).
 * Currently the rule is "Accumulates Debt", so we just warn or track, but don't block 
 * unless strictly enforced by a flag not yet fully implemented.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canPurchaseOnAccount(_user: { currentDebt: number; debtLimit: number }): boolean {
    // Current Rule: "accumulates debt now" - permissive
    // But we might want to flag if over limit
    return true;
}
