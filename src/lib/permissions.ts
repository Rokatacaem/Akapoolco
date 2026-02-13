import { UserRole } from "@prisma/client"

/**
 * Definición centralizada de permisos por funcionalidad
 * 
 * Cada permiso define qué roles tienen acceso a una funcionalidad específica
 */
export const PERMISSIONS: Record<string, UserRole[]> = {
    VIEW_DASHBOARD: ["ADMIN", "STAFF", "SUPERUSER"],
    MANAGE_TABLES: ["ADMIN", "STAFF", "SUPERUSER"], // Staff needs to open tables
    MANAGE_MEMBERS: ["ADMIN", "SUPERUSER", "STAFF"], // Staff needs to create members? User said "Cajero... pueden crear clientes/socios"
    VIEW_REPORTS: ["ADMIN", "SUPERUSER"],
    MANAGE_PRODUCTS: ["ADMIN", "SUPERUSER"], // Staff sells, doesn't manage stock/products usually? User said "utilizar el sistema para ventas", implied existing products.
    EDIT_SETTINGS: ["ADMIN", "SUPERUSER"],
    MANAGE_USERS: ["ADMIN", "SUPERUSER"], // New permission for User Management
}

export const AVAILABLE_PERMISSIONS = {
    VIEW_DASHBOARD: "Ver Dashboard",
    MANAGE_TABLES: "Gestionar Mesas (Cockpit)",
    MANAGE_MEMBERS: "Gestionar Socios",
    VIEW_REPORTS: "Ver Reportes",
    MANAGE_PRODUCTS: "Gestionar Productos",
    EDIT_SETTINGS: "Configuración del Sistema",
    MANAGE_USERS: "Gestionar Usuarios"
} as const;

/**
 * Verifica si un usuario tiene permiso para una funcionalidad
 *
 * @param userRole - Rol del usuario autenticado
 * @param permission - Permiso a verificar
 * @param customPermissions - (Opcional) JSON con permisos sobreescritos { permissionKey: boolean }
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function hasPermission(
    userRole: UserRole | undefined,
    permission: keyof typeof PERMISSIONS,
    customPermissions?: Record<string, boolean> | null
): boolean {
    if (!userRole) return false

    // 1. Check Custom Overrides
    if (customPermissions && typeof customPermissions[permission] === 'boolean') {
        return customPermissions[permission]
    }

    // 2. Check Default Role
    return PERMISSIONS[permission].includes(userRole)
}

/**
 * Filtra una lista de items según los permisos del usuario
 * 
 * @param items - Lista de items con campo roles
 * @param userRole - Rol del usuario autenticado
 * @returns Lista filtrada de items accesibles para el usuario
 */
export function filterByRole<T extends { roles: UserRole[] }>(
    items: T[],
    userRole: UserRole | undefined
): T[] {
    if (!userRole) return []
    return items.filter(item => item.roles.includes(userRole))
}
