"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(formData: FormData) {
    try {
        console.log("🔐 Attempting login with:", Object.fromEntries(formData))
        const result = await signIn("credentials", {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            redirectTo: "/dashboard",
        })
        console.log("✅ Login successful")
        return { success: true }
    } catch (error) {
        console.error("❌ Login error:", error)
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials." }
                default:
                    return { error: "Something went wrong." }
            }
        }
        throw error
    }
}
