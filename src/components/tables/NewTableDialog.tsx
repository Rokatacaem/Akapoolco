'use client';

import { useState } from 'react';
import { useTransition } from 'react';
import { createTable } from '@/app/lib/actions-tables';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

export function NewTableDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [type, setType] = useState<TableType | ''>('');
    const [priceMember, setPriceMember] = useState('5000');
    const [priceClient, setPriceClient] = useState('6000');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !type) return;

        startTransition(async () => {
            const result = await createTable({
                name,
                type: type as TableType,
                priceMember: Number(priceMember),
                priceClient: Number(priceClient)
            });
            if (result.success) {
                setOpen(false);
                setName('');
                setType('');
                setPriceMember('5000');
                setPriceClient('6000');
            } else {
                alert(result.error || 'Error al crear la mesa');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    + Nueva Mesa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-950 text-white border-slate-800">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Mesa</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Ingresa el nombre, tipo y valores por hora de la mesa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3 bg-slate-900 border-slate-700"
                                placeholder="Ej: Mesa 1"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
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
                            <Label htmlFor="priceClient" className="text-right">
                                $ Cliente
                            </Label>
                            <Input
                                id="priceClient"
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
                            <Label htmlFor="priceMember" className="text-right">
                                $ Socio
                            </Label>
                            <Input
                                id="priceMember"
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
                            {isPending ? 'Creando...' : 'Crear Mesa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
