'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Trash2, User } from "lucide-react";
import { useState, useTransition } from "react";
import { searchProducts } from "@/app/lib/actions-products";
import { processDirectSale } from "@/app/lib/actions-pos";
import { searchMembers } from "@/app/lib/actions-members";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CartItem {
    id: string; // product id
    name: string;
    price: number;
    quantity: number;
}

export function QuickSaleWidget() {
    const [searchTerm, setSearchTerm] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // User search (optional for Fiado)
    const [userSearchTerm, setUserSearchTerm] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userResults, setUserResults] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [isPending, startTransition] = useTransition();

    const handleProductSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const results = await searchProducts(term);
        setSearchResults(results);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { id: product.id, name: product.name, price: Number(product.priceClient), quantity: 1 }];
        });
        setSearchTerm('');
        setSearchResults([]);
        // Focus back on input?
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleUserSearch = async (term: string) => {
        setUserSearchTerm(term);
        if (term.length < 2) {
            setUserResults([]);
            return;
        }
        const results = await searchMembers(term);
        setUserResults(results);
    };

    const handleProcessPayment = () => {
        if (cart.length === 0) return;
        if (paymentMethod === 'ACCOUNT' && !selectedUser) {
            toast.error('Debe seleccionar un socio para Fiado');
            return;
        }

        startTransition(async () => {
            const items = cart.map(i => ({
                productId: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity
            }));

            const res = await processDirectSale(items, paymentMethod, selectedUser?.id);

            if (res.success) {
                toast.success('Venta registrada');
                setCart([]);
                setPaymentMethod('CASH');
                setSelectedUser(null);
                setIsPaymentOpen(false);
            } else {
                toast.error(res.error || 'Error en venta');
            }
        });
    };

    return (
        <Card className="bg-slate-950 border-white/10 h-full flex flex-col border-emerald-500/20 shadow-lg">
            <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                    Punto de Venta Rápido
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 pt-4 min-h-[400px]">

                {/* Search Bar */}
                <div className="relative z-20">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto (ej. Coca Cola)..."
                        className="pl-9 bg-slate-900 border-white/10 focus:border-emerald-500/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => handleProductSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                            {searchResults.map(prod => (
                                <div
                                    key={prod.id}
                                    className="p-3 hover:bg-emerald-900/20 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0"
                                    onClick={() => addToCart(prod)}
                                >
                                    <span className="font-medium text-slate-200">{prod.name}</span>
                                    <span className="text-emerald-400 font-mono">${Number(prod.priceClient).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart List */}
                <div className="flex-1 bg-slate-900/30 rounded-lg p-2 overflow-y-auto space-y-2 border border-white/5">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2 opacity-50">
                            <ShoppingCart className="w-8 h-8" />
                            <span>Carro vacío</span>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded group hover:bg-slate-800">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm text-slate-200">{item.name}</span>
                                    <span className="text-xs text-muted-foreground">${item.price.toLocaleString()} x {item.quantity}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-emerald-400 text-sm">${(item.price * item.quantity).toLocaleString()}</span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Action */}
                <div className="mt-auto pt-2 space-y-4">
                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                        <div className="text-sm text-slate-400">Total a Pagar</div>
                        <div className="text-3xl font-bold text-white tracking-tight">${cartTotal.toLocaleString('es-CL')}</div>
                    </div>
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-lg font-semibold shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        disabled={cart.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                    >
                        Cobrar
                    </Button>
                </div>
            </CardContent>

            {/* Payment Modal inside Widget for speed */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Finalizar Venta Rápida</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="text-center py-4 bg-emerald-950/30 rounded border border-emerald-900/50">
                            <span className="text-3xl font-bold text-emerald-400">${cartTotal.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Método de Pago</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="bg-slate-900 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Efectivo</SelectItem>
                                    <SelectItem value="CARD">Tarjeta</SelectItem>
                                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                    <SelectItem value="ACCOUNT">Fiado (Cta. Cte.)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Optional User Assignment for History or Required for Debt */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <Label className="flex justify-between">
                                <span>Asignar a Cliente / Socio <span className="text-slate-500 font-normal">(Opcional)</span></span>
                                {paymentMethod === 'ACCOUNT' && <span className="text-xs text-red-400 font-bold">* Requerido para Fiado</span>}
                            </Label>

                            {!selectedUser ? (
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre..."
                                        className={`pl-9 bg-slate-900 border-white/10 ${paymentMethod === 'ACCOUNT' ? 'border-red-500/50' : ''}`}
                                        value={userSearchTerm}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                    />
                                    {userResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-md shadow-xl z-50 max-h-40 overflow-y-auto">
                                            {userResults.map(u => (
                                                <div
                                                    key={u.id}
                                                    className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-sm"
                                                    onClick={() => { setSelectedUser(u); setUserSearchTerm(''); setUserResults([]); }}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-200">{u.name}</span>
                                                        <span className="text-[10px] text-slate-500 capitalize">{u.type?.toLowerCase().replace('_', ' ')}</span>
                                                    </div>
                                                    {Number(u.currentDebt) > 0 && <span className="text-xs text-red-400">Deuda: ${Number(u.currentDebt).toLocaleString()}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                                            {selectedUser.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-blue-300 text-sm">{selectedUser.name}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-6 text-xs hover:text-red-400">
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Button
                            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500"
                            onClick={handleProcessPayment}
                            disabled={isPending || (paymentMethod === 'ACCOUNT' && !selectedUser)}
                        >
                            {isPending ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
