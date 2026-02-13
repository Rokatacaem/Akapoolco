'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getProducts, registerSale } from '@/app/lib/actions-pos';

interface Product {
    id: string;
    name: string;
    priceClient: number; // Decimal in Prisma is string/number, check type
    stock: number;
}

interface TableConsumptionProps {
    sessionId: string;
    onSuccess: () => void;
}

export function TableConsumption({ sessionId, onSuccess }: TableConsumptionProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProducts().then((data) => {
            // Normalize Decimal to number if needed
            const normalized = data.map(p => ({
                ...p,
                priceClient: Number(p.priceClient)
            }));
            setProducts(normalized);
            setLoading(false);
        });
    }, []);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleAddConsumption = () => {
        if (cart.length === 0) return;

        const total = cart.reduce((sum, item) => sum + (item.product.priceClient * item.quantity), 0);
        const items = cart.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.priceClient,
            quantity: item.quantity
        }));

        startTransition(async () => {
            // Method "ACCOUNT" used here to signify "On Tab" / "Fiado for Table"
            // Or we could define a new constant if strictly needed, but ACCOUNT/CASH/CARD are strict in schema?
            // Checking schema: method is String (no enum). So "TAB" is fine.
            const res = await registerSale(sessionId, items, total, 'ACCOUNT');

            if (res.error) {
                alert('Error al agregar consumo: ' + res.error);
            } else {
                setCart([]);
                onSuccess(); // Triggers refresh or toast
            }
        });
    };

    if (loading) return <div>Cargando productos...</div>;

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm">Agregar Consumo</h3>

            {/* Quick Product List (Simplified) */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                {products.map(p => (
                    <Button
                        key={p.id}
                        variant="outline"
                        size="sm"
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className="justify-start text-xs h-auto py-2"
                    >
                        <div className="flex flex-col items-start truncate">
                            <span>{p.name}</span>
                            <span className="text-muted-foreground">${p.priceClient}</span>
                        </div>
                    </Button>
                ))}
            </div>

            {/* Cart Preview */}
            {cart.length > 0 && (
                <div className="border rounded p-2 bg-muted/50 text-sm space-y-2">
                    {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center">
                            <span>{item.quantity}x {item.product.name}</span>
                            <div className="flex items-center gap-2">
                                <span>${item.product.priceClient * item.quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 text-destructive"
                                    onClick={() => removeFromCart(item.product.id)}
                                >
                                    x
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>
                            ${cart.reduce((sum, item) => sum + (item.product.priceClient * item.quantity), 0).toLocaleString('es-CL')}
                        </span>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleAddConsumption}
                        disabled={isPending}
                    >
                        {isPending ? 'Guardando...' : 'Confirmar Consumo'}
                    </Button>
                </div>
            )}
        </div>
    );
}
