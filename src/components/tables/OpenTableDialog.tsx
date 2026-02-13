/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserPlus, X, Search, User as UserIcon } from 'lucide-react'; // Added generic icons
import { startSession } from '@/app/lib/actions-sessions';
import { startCardSession } from '@/app/lib/actions-card-tables';
import { searchMembers } from '@/app/lib/actions-members';
import { SessionPlayer } from '@/lib/types';
import { toast } from 'sonner';

interface OpenTableDialogProps {
    tableId: string;
    tableName: string;
    tableType?: string;
    priceClient?: number;
    priceMember?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function OpenTableDialog({ tableId, tableName, tableType, priceClient, priceMember, isOpen, onClose }: OpenTableDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [players, setPlayers] = useState<SessionPlayer[]>([]);
    const [isTraining, setIsTraining] = useState(false);
    const [note, setNote] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const results = await searchMembers(term);
        setSearchResults(results);
        setIsSearching(false);
    };

    const addMemberPlayer = (user: any) => {
        if (players.some(p => p.userId === user.id)) return;
        setPlayers([...players, { userId: user.id, name: user.name, type: 'MEMBER' }]);
        setSearchTerm('');
        setSearchResults([]);
    };

    const addGuestPlayer = () => {
        if (!guestName.trim()) return;
        setPlayers([...players, { name: guestName, type: 'GUEST' }]);
        setGuestName('');
        setShowGuestInput(false);
    };

    const removePlayer = (index: number) => {
        setPlayers(players.filter((_, i) => i !== index));
    };

    const handleStartSession = async () => {
        if (players.length === 0) {
            toast.error('Debe agregar al menos un jugador');
            return;
        }

        setIsLoading(true);
        let result;

        if (tableType === 'CARDS') {
            // Adapt players to simplified input for cards
            const cardPlayers = players.map(p => ({
                userId: p.userId,
                guestName: p.type === 'GUEST' ? p.name : undefined
            }));
            result = await startCardSession(tableId, cardPlayers);
        } else {
            result = await startSession(tableId, { players, isTraining, note });
        }

        setIsLoading(false);

        if (result.success) {
            toast.success('Mesa abierta correctamente');
            onClose();
            // Reset form
            setPlayers([]);
            setIsTraining(false);
            setNote('');
        } else {
            toast.error(result.error || 'Error al abrir la mesa');
        }
    };

    // Calculate Estimated Rate for Display
    const getEstimatedRate = () => {
        if (tableType === 'CARDS') return null; // Cards is per player
        let rate = Number(priceClient) || 4000;

        // If has members? Logic in backend is: if ANY member -> Member Price.
        const hasMember = players.some(p => p.type === 'MEMBER');
        if (hasMember && priceMember) {
            rate = Number(priceMember);
        }

        if (isTraining) rate *= 0.5;
        return rate;
    };

    const estimatedRate = getEstimatedRate();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Abrir Mesa: {tableName}</DialogTitle>
                    <DialogDescription>
                        Configure la sesión para comenzar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Pricing Info Badge */}
                    {tableType !== 'CARDS' && (
                        <div className="flex justify-center">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 text-center border border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-muted-foreground block uppercase tracking-wider">Tarifa Aplicable</span>
                                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    ${estimatedRate?.toLocaleString()} /hr
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Players Section */}
                    <div className="space-y-2">
                        <Label>Jugadores</Label>

                        {/* List Selected Players */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {players.map((p, i) => (
                                <div key={i} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center">
                                    <span className="mr-1">{p.type === 'MEMBER' ? '👤' : '👋'}</span>
                                    {p.name}
                                    <button onClick={() => removePlayer(i)} className="ml-2 hover:text-destructive">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {players.length === 0 && (
                                <span className="text-sm text-muted-foreground italic">Sin jugadores seleccionados</span>
                            )}
                        </div>

                        {/* Search / Add Actions */}
                        {!showGuestInput ? (
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar socio..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full bg-popover border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between"
                                                onClick={() => addMemberPlayer(user)}
                                            >
                                                <span>{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-2 text-right">
                                    <Button variant="link" size="sm" onClick={() => setShowGuestInput(true)} className="text-xs">
                                        + Agregar Invitado (Solo Nombre)
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nombre del invitado"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGuestPlayer()}
                                />
                                <Button size="sm" onClick={addGuestPlayer}>Agregar</Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowGuestInput(false)}>Cancelar</Button>
                            </div>
                        )}
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center justify-between space-x-2 border rounded p-3">
                        <div className="space-y-0.5">
                            <Label>Modo Entrenamiento</Label>
                            <div className="text-xs text-muted-foreground">
                                Aplica 50% de descuento a la tarifa.
                            </div>
                        </div>
                        <Switch
                            checked={isTraining}
                            onCheckedChange={setIsTraining}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleStartSession} disabled={isLoading || players.length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Iniciar Sesión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
