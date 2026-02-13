'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, DollarSign } from 'lucide-react';
import { processDebtPayment } from '@/app/lib/actions-payments';
import { searchMembers } from '@/app/lib/actions-members';
import { toast } from 'sonner';

interface DebtPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialUser?: any;
}

export function DebtPaymentDialog({ isOpen, onClose, onSuccess, initialUser }: DebtPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Sync initialUser when dialog opens
    useEffect(() => {
        if (isOpen && initialUser) {
            setSelectedUser(initialUser);
        } else if (isOpen && !initialUser) {
            // Optional: clear if no initial user, so previous state doesn't persist if we reuse the component instance?
            // But if we want to keep state, maybe not. 
            // Ideally better to clear.
            setSelectedUser(null);
        }
    }, [isOpen, initialUser]);

    // Payment State
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const results = await searchMembers(term);
        setSearchResults(results);
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
        setSearchResults([]);
        setSearchTerm('');
        // Pre-fill amount with full debt if > 0? Maybe manually is better to avoid mistakes
    };

    const handleSubmit = async () => {
        if (!selectedUser || !amount) return;

        setIsLoading(true);
        const result = await processDebtPayment(selectedUser.id, Number(amount), method);
        setIsLoading(false);

        if (result.success) {
            toast.success('Pago registrado correctamente');
            onSuccess();
            onClose();
            // Reset
            setSelectedUser(null);
            setAmount('');
        } else {
            toast.error(result.error || 'Error al procesar pago');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Registrar Pago de Deuda</DialogTitle>
                    <DialogDescription>
                        Abona a la cuenta corriente de un socio.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!selectedUser ? (
                        <div className="space-y-2">
                            <Label>Buscar Socio</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Nombre..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8 bg-slate-900 border-white/10"
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border border-white/10 rounded-md shadow-sm max-h-40 overflow-y-auto mt-2 bg-slate-900">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-red-400">Deuda: ${Number(user.currentDebt).toLocaleString()}</div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{user.type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-900 border border-white/10 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg">{selectedUser.name}</div>
                                    <div className="text-sm text-red-400">Deuda Actual: ${Number(selectedUser.currentDebt).toLocaleString()}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Cambiar</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monto a Pagar</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-8 bg-slate-900 border-white/10"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Método</Label>
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="bg-slate-900 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">Efectivo</SelectItem>
                                            <SelectItem value="CARD">Tarjeta</SelectItem>
                                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedUser || !amount || isLoading || Number(amount) <= 0}
                        className="bg-emerald-600 hover:bg-emerald-500"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Pago
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
