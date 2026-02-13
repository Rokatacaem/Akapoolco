'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { CaromState } from '@/types/game-state';

interface CaromSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (settings: Partial<CaromState>) => void;
    currentSettings?: Partial<CaromState>;
}

export function CaromSettingsDialog({ open, onOpenChange, onConfirm, currentSettings }: CaromSettingsDialogProps) {
    const [targetScore, setTargetScore] = useState<number | ''>(currentSettings?.targetScore || '');
    const [useTournamentMode, setUseTournamentMode] = useState(!!currentSettings?.limitInnings || !!currentSettings?.timerSettings?.enabled);

    const [limitInnings, setLimitInnings] = useState<number | ''>(currentSettings?.limitInnings || '');
    const [useTimer, setUseTimer] = useState(currentSettings?.timerSettings?.enabled || false);
    const [timerSeconds, setTimerSeconds] = useState(currentSettings?.timerSettings?.limitSeconds || 40);

    const handleConfirm = () => {
        const settings: Partial<CaromState> = {
            targetScore: targetScore === '' ? undefined : Number(targetScore),
            // Reset scores on new match configuration usually
            p1Score: 0,
            p2Score: 0,
            innings: 0,
            currentRun: 0,
            p1HighRun: 0,
            p2HighRun: 0
        };

        if (useTournamentMode) {
            settings.limitInnings = limitInnings === '' ? undefined : Number(limitInnings);
            if (useTimer) {
                settings.timerSettings = {
                    enabled: true,
                    limitSeconds: timerSeconds
                };
            } else {
                settings.timerSettings = undefined;
            }
        } else {
            settings.limitInnings = undefined;
            settings.timerSettings = undefined;
        }

        onConfirm(settings);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center uppercase tracking-widest text-emerald-500">
                        Configurar Partido
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Distance / Target Score */}
                    <div className="grid gap-2">
                        <Label htmlFor="targetScore" className="text-zinc-400">Distancia (Carambolas)</Label>
                        <div className="flex gap-2">
                            {[15, 20, 30, 40].map(val => (
                                <Button
                                    key={val}
                                    variant={targetScore === val ? "default" : "outline"}
                                    onClick={() => setTargetScore(val)}
                                    className={targetScore === val ? "bg-emerald-600 hover:bg-emerald-500" : "bg-transparent border-zinc-700"}
                                    size="sm"
                                >
                                    {val}
                                </Button>
                            ))}
                            <Input
                                id="targetScore"
                                type="number"
                                placeholder="Libre"
                                value={targetScore}
                                onChange={(e) => setTargetScore(e.target.value === '' ? '' : Number(e.target.value))}
                                className="bg-zinc-800 border-zinc-700 w-24 text-center"
                            />
                        </div>
                    </div>

                    <div className="border-t border-zinc-800" />

                    {/* Tournament Mode Switch */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="tournament-mode" className="flex flex-col gap-1">
                            <span className="font-bold text-white">Modo Torneo / Avanzado</span>
                            <span className="text-xs text-zinc-500">Habilitar entradas y reloj</span>
                        </Label>
                        <Switch
                            id="tournament-mode"
                            checked={useTournamentMode}
                            onCheckedChange={setUseTournamentMode}
                            className="data-[state=checked]:bg-amber-500"
                        />
                    </div>

                    {useTournamentMode && (
                        <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 space-y-4 animate-in fade-in slide-in-from-top-2">
                            {/* Innings */}
                            <div className="grid gap-2">
                                <Label htmlFor="limitInnings" className="text-zinc-400">Límite de Entradas</Label>
                                <Input
                                    id="limitInnings"
                                    type="number"
                                    placeholder="Sin Límite"
                                    value={limitInnings}
                                    onChange={(e) => setLimitInnings(e.target.value === '' ? '' : Number(e.target.value))}
                                    className="bg-zinc-900 border-zinc-700"
                                />
                            </div>

                            {/* Timer */}
                            <div className="flex items-center justify-between pt-2">
                                <Label className="text-zinc-400">Reloj de Tiro</Label>
                                <Switch
                                    checked={useTimer}
                                    onCheckedChange={setUseTimer}
                                    className="data-[state=checked]:bg-red-500"
                                />
                            </div>

                            {useTimer && (
                                <div className="flex gap-2 justify-end">
                                    {[30, 40, 50].map(sec => (
                                        <Button
                                            key={sec}
                                            size="sm"
                                            variant={timerSeconds === sec ? "secondary" : "ghost"}
                                            onClick={() => setTimerSeconds(sec)}
                                            className={timerSeconds === sec ? "bg-red-900/50 text-red-200" : "text-zinc-500"}
                                        >
                                            {sec}s
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-500 font-bold uppercase tracking-widest">
                        Iniciar Partido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
