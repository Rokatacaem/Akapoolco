'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Calendar, UserCheck } from 'lucide-react';
import { processMembershipPayment } from '@/app/lib/actions-payments';
import { searchMembers } from '@/app/lib/actions-members';
import { toast } from 'sonner';

interface MembershipPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Configurable pricing (could be dynamic later)
const MONTHLY_PRICE = 15000;

export function MembershipPaymentDialog({ isOpen, onClose, onSuccess }: MembershipPaymentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Payment State
    const [months, setMonths] = useState('1');
    const [method, setMethod] = useState('CASH');

    const totalAmount = Number(months) * MONTHLY_PRICE;

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
    };

    const handleSubmit = async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        const result = await processMembershipPayment(selectedUser.id, Number(months), totalAmount, method);
        setIsLoading(false);

        if (result.success && result.newExpire) {
            toast.success(`Membresía renovada hasta ${new Date(result.newExpire).toLocaleDateString()}`);
            onSuccess();
            onClose();
            setSelectedUser(null);
            setMonths('1');
        } else {
            toast.error(result.error || 'Error al procesar membresía');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Renovar Membresía</DialogTitle>
                    <DialogDescription>
                        Extiende la vigencia del socio.
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
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-emerald-400" />
                                                <span className="font-medium">{user.name}</span>
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
                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Vence: {selectedUser.membershipExpiresAt ? new Date(selectedUser.membershipExpiresAt).toLocaleDateString() : 'Vencida/Inactiva'}
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Cambiar</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Periodo</Label>
                                    <Select value={months} onValueChange={setMonths}>
                                        <SelectTrigger className="bg-slate-900 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Mes (${MONTHLY_PRICE.toLocaleString()})</SelectItem>
                                            <SelectItem value="3">3 Meses (${(MONTHLY_PRICE * 3).toLocaleString()})</SelectItem>
                                            <SelectItem value="6">6 Meses (${(MONTHLY_PRICE * 6).toLocaleString()})</SelectItem>
                                            <SelectItem value="12">1 Año (${(MONTHLY_PRICE * 12).toLocaleString()})</SelectItem>
                                        </SelectContent>
                                    </Select>
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

                            <div className="flex justify-between items-center p-2 border-t border-white/10 pt-4 mt-2">
                                <span className="font-semibold text-slate-300">Total a Pagar</span>
                                <span className="text-xl font-bold text-emerald-400">${totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedUser || isLoading}
                        className="bg-blue-600 hover:bg-blue-500"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Procesar Renovarción
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
