"use client"

// import { signIn } from "@/auth" // We will use client-side signIn for interactivity or server action
// Using Client Component for better interactivity with Shadcn

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Credenciales inválidas")
                setIsLoading(false)
            } else if (result?.ok) {
                router.push("/dashboard")
                router.refresh()
            }
        } catch (e) {
            console.error(e)
            setError("Error de conexión")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen w-full bg-background relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] translate-x-1/2 translate-y-1/2" />

            <Card className="w-[350px] z-10 border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center tracking-tighter bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Akapoolco
                    </CardTitle>
                    <CardDescription className="text-center">
                        System Access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                name="email"
                                placeholder="admin@akapoolco.cl"
                                className="bg-background/50 border-white/10 focus:border-primary/50"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">

                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    className="bg-background/50 border-white/10 focus:border-primary/50 pr-10"
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground w-10"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/80 font-semibold shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                            disabled={isLoading}
                        >
                            {isLoading ? "Ingresando..." : "Ingresar"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">Authorized Personnel Only</p>
                </CardFooter>
            </Card>
        </div>
    )
}
