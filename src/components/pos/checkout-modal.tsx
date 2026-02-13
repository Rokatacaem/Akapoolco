"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Square, CreditCard, Banknote, User, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { stopSession } from "@/app/lib/actions-cockpit"
import { processCheckout, getSessionDetails } from "@/app/lib/actions-checkout"
import { Separator } from "@/components/ui/separator"

interface CheckoutModalProps {
    sessionId: string
    tableName: string
    tableId: string
    members: { id: string, name: string, type: string }[]
}

export function CheckoutModal({ sessionId, tableName, tableId, members }: CheckoutModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [details, setDetails] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ACCOUNT' | null>(null)
    const [selectedMember, setSelectedMember] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    const getDetails = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getSessionDetails(sessionId)
            setDetails(data)
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (isOpen) {
            getDetails()
            setPaymentMethod(null)
            setSelectedMember("")
            setError(null)
        }
    }, [isOpen, getDetails])


    const handlePayment = async () => {
        if (!paymentMethod) return
        if (paymentMethod === 'ACCOUNT' && !selectedMember) {
            setError("Must select a member for account charge.")
            return
        }

        setIsProcessing(true)
        setError(null)

        const result = await processCheckout(sessionId, paymentMethod, paymentMethod === 'ACCOUNT' ? selectedMember : undefined)

        if (result?.error) {
            setError(result.error)
            setIsProcessing(false)
        } else {
            // Success
            setIsOpen(false)
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700">
                    <Square className="w-4 h-4 mr-2" /> CLOSE
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Checkout: {tableName}</DialogTitle>
                </DialogHeader>

                {isLoading || !details ? (
                    <div className="py-8 text-center text-zinc-500">Calculating final usage...</div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Time ({details.durationMin} min)</span>
                                <span>${details.timeTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Bar Consumption</span>
                                <span>${details.consumptionTotal.toLocaleString()}</span>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex justify-between text-xl font-bold text-green-400">
                                <span>Total to Pay</span>
                                <span>${details.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        {error && <div className="p-2 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-xs text-center">{error}</div>}

                        <div className="pt-4">
                            <p className="text-sm font-medium mb-2 text-zinc-400">Select Payment Method</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <Button
                                    variant={paymentMethod === 'CASH' ? "default" : "outline"}
                                    className={`flex flex-col items-center h-20 gap-2 ${paymentMethod === 'CASH' ? 'bg-green-600 hover:bg-green-700 border-transparent' : 'border-white/10 hover:bg-white/10'}`}
                                    onClick={() => setPaymentMethod('CASH')}
                                >
                                    <Banknote className="h-6 w-6" />
                                    <span className="text-xs">Cash</span>
                                </Button>
                                <Button
                                    variant={paymentMethod === 'CARD' ? "default" : "outline"}
                                    className={`flex flex-col items-center h-20 gap-2 ${paymentMethod === 'CARD' ? 'bg-blue-600 hover:bg-blue-700 border-transparent' : 'border-white/10 hover:bg-white/10'}`}
                                    onClick={() => setPaymentMethod('CARD')}
                                >
                                    <CreditCard className="h-6 w-6" />
                                    <span className="text-xs">Card</span>
                                </Button>
                                <Button
                                    variant={paymentMethod === 'ACCOUNT' ? "default" : "outline"}
                                    className={`flex flex-col items-center h-20 gap-2 ${paymentMethod === 'ACCOUNT' ? 'bg-amber-600 hover:bg-amber-700 border-transparent' : 'border-white/10 hover:bg-white/10'}`}
                                    onClick={() => setPaymentMethod('ACCOUNT')}
                                >
                                    <User className="h-6 w-6" />
                                    <span className="text-xs">Fiado</span>
                                </Button>
                            </div>

                            {paymentMethod === 'ACCOUNT' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs text-zinc-400">Seleccionar Socio</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                        value={selectedMember}
                                        onChange={(e) => setSelectedMember(e.target.value)}
                                        title="Seleccionar Socio"
                                    >
                                        <option value="">-- Buscar Socio --</option>
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <Button
                                className="w-full mt-4 bg-green-500 hover:bg-green-600 text-black font-bold"
                                disabled={!paymentMethod || (paymentMethod === 'ACCOUNT' && !selectedMember) || isProcessing}
                                onClick={handlePayment}
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "CONFIRM PAYMENT"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
