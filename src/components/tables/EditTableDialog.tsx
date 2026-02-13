'use client';

import { useState, useTransition, useEffect } from 'react';
import { updateTable } from '@/app/lib/actions-tables';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableType } from '@prisma/client';

interface EditTableDialogProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any; // Using any for flexibility with serialized props, or define strict interface
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTableDialog({ table, open, onOpenChange }: EditTableDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [type, setType] = useState<TableType | ''>('');
    const [priceMember, setPriceMember] = useState('');
    const [priceClient, setPriceClient] = useState('');

    useEffect(() => {
        if (table) {
            setTimeout(() => {
                setName(table.name);
                setType(table.type as TableType);
                setPriceMember(table.priceMember?.toString() || '0');
                setPriceClient(table.priceClient?.toString() || '0');
            }, 0);
        }
    }, [table]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !type || !table?.id) return;

        startTransition(async () => {
            const result = await updateTable(table.id, {
                name,
                type: type as TableType,
                priceMember: Number(priceMember),
                priceClient: Number(priceClient)
            });
            if (result.success) {
                onOpenChange(false);
            } else {
                alert(result.error || 'Error al actualizar la mesa');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 text-white border-slate-800">
                <DialogHeader>
                    <DialogTitle>Editar Mesa</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Modifica los datos de la mesa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3 bg-slate-900 border-slate-700"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-type" className="text-right">
                                Tipo
                            </Label>
                            <Select
                                value={type}
                                onValueChange={(val) => setType(val as TableType)}
                                required
                            >
                                <SelectTrigger className="col-span-3 bg-slate-900 border-slate-700">
                                    <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    <SelectItem value="POOL">Pool</SelectItem>
                                    <SelectItem value="CARAMBOLA">Carambola</SelectItem>
                                    <SelectItem value="POOL_CHILENO">Pool Chileno</SelectItem>
                                    <SelectItem value="NINE_BALL">9 Ball</SelectItem>
                                    <SelectItem value="CARDS">Cartas</SelectItem>
                                    <SelectItem value="SNOOKER">Snooker</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-priceClient" className="text-right">
                                $ Cliente
                            </Label>
                            <Input
                                id="edit-priceClient"
                                type="number"
                                value={priceClient}
                                onChange={(e) => setPriceClient(e.target.value)}
                                className="col-span-3 bg-slate-900 border-slate-700"
                                min="0"
                                step="100"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-priceMember" className="text-right">
                                $ Socio
                            </Label>
                            <Input
                                id="edit-priceMember"
                                type="number"
                                value={priceMember}
                                onChange={(e) => setPriceMember(e.target.value)}
                                className="col-span-3 bg-slate-900 border-slate-700"
                                min="0"
                                step="100"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            {isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
