import { UserRole } from "@prisma/client"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Extiende la interfaz User de NextAuth para incluir el campo role
     */
    interface User {
        role?: UserRole
    }

    /**
     * Extiende la interfaz Session para incluir el role del usuario
     */
    interface Session {
        user: {
            id: string
            role?: UserRole
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    /**
     * Extiende el JWT para incluir el role
     */
    interface JWT {
        role?: UserRole
    }
}
