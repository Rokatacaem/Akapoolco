'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { endSession } from '@/app/lib/actions-sessions';

interface PaymentModalProps {
    totalTimeAmount: number;
    consumptionTotal: number; // passed from parent
    sessionId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PaymentModal({ totalTimeAmount, consumptionTotal, sessionId, onSuccess, onCancel }: PaymentModalProps) {
    const total = totalTimeAmount + consumptionTotal;
    const [method, setMethod] = useState('CASH');
    const [isPending, startTransition] = useTransition();

    // Split Bill State
    const [splitCount, setSplitCount] = useState(1);

    const handlePayment = () => {
        startTransition(async () => {
            // Default to full payment by one method for this modal's scope
            // or handle split if splitCount logic is implemented deeply
            const res = await endSession(sessionId, [{ amount: total, method }]);
            if (res.success) {
                onSuccess();
            } else {
                alert('Error al procesar el pago: ' + res.error);
            }
        });
    };

    return (
        <div className="space-y-4 p-4">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-1">Total a Pagar</h2>
                <div className="text-4xl font-mono text-green-600">
                    ${total.toLocaleString('es-CL')}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                    Tiempo: ${totalTimeAmount.toLocaleString('es-CL')} | Consumo: ${consumptionTotal.toLocaleString('es-CL')}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CASH">Efectivo</SelectItem>
                        <SelectItem value="DEBIT">Débito</SelectItem>
                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                        <SelectItem value="FIADO">Fiado (Cuenta)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Dividir Cuenta (Personas)</Label>
                <Input
                    type="number"
                    min={1}
                    value={splitCount}
                    onChange={(e) => setSplitCount(Number(e.target.value))}
                />
                {splitCount > 1 && (
                    <div className="text-right text-sm font-medium text-blue-600">
                        ${Math.ceil(total / splitCount).toLocaleString('es-CL')} cada uno
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handlePayment}
                    disabled={isPending}
                >
                    {isPending ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
            </div>
        </div>
    );
}
