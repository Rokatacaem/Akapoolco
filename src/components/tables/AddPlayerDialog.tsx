'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { joinCardSession } from '@/app/lib/actions-card-tables';
import { searchMembers } from '@/app/lib/actions-members';
import { toast } from 'sonner';

interface AddPlayerDialogProps {
    sessionId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddPlayerDialog({ sessionId, isOpen, onClose, onSuccess }: AddPlayerDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showGuestInput, setShowGuestInput] = useState(false);
    const [guestName, setGuestName] = useState('');

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const results = await searchMembers(term);
        setSearchResults(results);
    };

    const handleAddUser = async (user: any) => {
        setIsLoading(true);
        const result = await joinCardSession(sessionId, { userId: user.id });
        setIsLoading(false);

        if (result.success) {
            toast.success('Jugador agregado correctamente');
            onSuccess();
            onClose();
        } else {
            toast.error(result.error || 'Error al agregar jugador');
        }
    };

    const handleAddGuest = async () => {
        if (!guestName.trim()) return;
        setIsLoading(true);
        const result = await joinCardSession(sessionId, { guestName: guestName });
        setIsLoading(false);

        if (result.success) {
            toast.success('Invitado agregado correctamente');
            onSuccess();
            onClose();
        } else {
            toast.error(result.error || 'Error al agregar invitado');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Jugador a la Mesa</DialogTitle>
                    <DialogDescription>
                        Busque un socio o ingrese el nombre de un invitado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!showGuestInput ? (
                        <div className="relative space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar socio..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-md shadow-sm max-h-40 overflow-y-auto mt-2">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="text-center pt-2">
                                <Button variant="link" size="sm" onClick={() => setShowGuestInput(true)}>
                                    Agregar Invitado (Manual)
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">
                            <Input
                                placeholder="Nombre del Invitado"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                            <Button onClick={handleAddGuest} disabled={isLoading || !guestName.trim()}>
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar'}
                            </Button>
                            <Button variant="ghost" onClick={() => setShowGuestInput(false)}>Cancelar</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
