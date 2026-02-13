import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    trustHost: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            // Agregar role a la sesión
            if (token.role && session.user) {
                session.user.role = token.role as any
            }
            return session
        },
        jwt({ token, user }) {
            // Agregar role al token cuando el usuario se autentica
            if (user) {
                token.role = user.role
            }
            return token
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
