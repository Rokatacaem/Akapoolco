"use client"

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Play, Pause, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { startSession } from "@/app/lib/actions-cockpit"
import { QuickSaleModal } from "@/components/pos/quick-sale-modal"
import { CheckoutModal } from "@/components/pos/checkout-modal"

interface Product {
    id: string
    name: string
    priceClient: number
    category: string | null
}

interface TableCardProps {
    id: string
    name: string
    status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
    startTime: Date | null
    currentSessionId: string | null
    products: Product[]
    members: { id: string, name: string, type: string }[]
}

export function TableCard({ id, name, status, startTime, currentSessionId, products, members }: TableCardProps) {
    const [elapsed, setElapsed] = useState("00:00:00")
    const [isLoading, setIsLoading] = useState(false)

    // Timer Effect
    useEffect(() => {
        if (status !== 'OCCUPIED' || !startTime) {
            setElapsed("00:00:00")
            return
        }

        const interval = setInterval(() => {
            const now = new Date()
            // Ensure startTime is a Date object
            const start = new Date(startTime)
            const diff = now.getTime() - start.getTime()

            if (diff < 0) {
                setElapsed("00:00:00")
                return
            }

            const hours = Math.floor(diff / 3600000)
            const minutes = Math.floor((diff % 3600000) / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)

            setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }, 1000)

        return () => clearInterval(interval)
    }, [status, startTime])

    // Status Styling
    const statusColors = {
        FREE: "border-green-500/50 bg-green-950/20 hover:bg-green-900/30",
        OCCUPIED: "border-red-500/80 bg-red-950/20 hover:bg-red-900/30 shadow-[0_0_15px_rgba(220,38,38,0.3)]",
        RESERVED: "border-yellow-500/50 bg-yellow-950/20",
        CLEANING: "border-blue-500/50 bg-blue-950/20"
    }

    const onStart = async () => {
        setIsLoading(true)
        try {
            await startSession(id)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={cn("transition-all duration-300 backdrop-blur-md", statusColors[status])}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    {name}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-500 hover:text-white"
                        title="Abrir Kiosco / Marcador"
                        onClick={() => window.open(`/table/${id}`, '_blank')}
                    >
                        <Monitor className="w-4 h-4" />
                    </Button>
                </CardTitle>
                <Badge variant={status === 'FREE' ? 'default' : 'destructive'} className="uppercase">
                    {status}
                </Badge>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col items-center justify-center p-4 space-y-4">
                    {/* Timer Display */}
                    <div className="font-mono text-4xl font-bold tracking-wider text-white">
                        {elapsed}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground w-full justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Started: {startTime ? new Date(startTime).toLocaleTimeString() : '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Players: 0</span>
                        </div>
                    </div>

                    {/* Financial Preview (Mockup) */}
                    <div className="w-full bg-black/40 rounded-md p-2 flex justify-between items-center border border-white/5">
                        <span className="text-xs text-muted-foreground">Current Total</span>
                        <span className="text-lg font-bold text-green-400">$0</span>
                    </div>

                    {/* Quick Sale Trigger */}
                    {status === 'OCCUPIED' && currentSessionId && (
                        <QuickSaleModal
                            sessionId={currentSessionId}
                            products={products}
                            tableName={name}
                        />
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-2">
                {status === 'FREE' ? (
                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                        disabled={isLoading}
                        onClick={onStart}
                    >
                        <Play className="w-4 h-4 mr-2" /> {isLoading ? 'OPENING...' : 'OPEN TABLE'}
                    </Button>
                ) : (
                    <>
                        <Button variant="secondary" className="flex-1" disabled={isLoading}>
                            <Pause className="w-4 h-4" />
                        </Button>
                        {/* Replaced direct Stop with CheckoutModal */}
                        {currentSessionId && (
                            <CheckoutModal
                                sessionId={currentSessionId}
                                tableName={name}
                                tableId={id}
                                members={members}
                            />
                        )}
                        {/* Fallback if no session (shouldn't happen in OCCUPIED) */}
                        {!currentSessionId && (
                            <Button variant="destructive" className="flex-1">Err</Button>
                        )}
                    </>
                )}
            </CardFooter>
        </Card>
    )
}
