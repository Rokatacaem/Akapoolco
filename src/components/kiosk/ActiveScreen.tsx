'use client';

import { GameScoreboard } from './scoreboard/GameScoreboard';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, UtensilsCrossed, Trophy, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitTableOrder } from "@/app/lib/actions-kiosk";
import { PaymentSelector } from './PaymentSelector';
import { PrintCategory } from '@prisma/client';

import MatchReferee from '@/components/referee/MatchReferee';

interface ActiveScreenProps {
    session: any;
    products?: any[];
}


export function ActiveScreen({ session }: ActiveScreenProps) {

    // We need a real product fetching or passing here.
    // For this skeleton, I will simulate product list or assume it's fetched by the page wrapper
    const [isOrdering, setIsOrdering] = useState(false);
    const [isPaymentSelectorOpen, setIsPaymentSelectorOpen] = useState(false);
    const [isRefereeMode, setIsRefereeMode] = useState(false);

    // Timer Logic (Simplified for Visuals, use a real hook for precision)
    // const startTime = new Date(session.startTime); // Unused for now
    // In a real app, use a useInterval to update this specific display

    const handleConfirmOrder = async (targetPlayerId?: string) => {
        setIsOrdering(true);
        // Simulate Items for now as we didn't build the catalog UI yet in this step
        // In reality, 'cart' would be populated by the menu.
        const mockItems = [
            { productId: 'mock-1', quantity: 2, price: 5000, name: 'Pisco Sour', printCategory: PrintCategory.BAR }
        ];

        try {
            const result = await submitTableOrder(session.id, mockItems, targetPlayerId);
            if (result.success) {
                toast.success("¡Pedido enviado a barra/cocina!");
                setIsPaymentSelectorOpen(false);
            } else {
                toast.error(result.error);
            }
        } catch (_e) {
            toast.error("Error de conexión");
        } finally {
            setIsOrdering(false);
        }
    };

    // Extract player names safely
    const playerNames: [string, string] = [
        session.players?.[0]?.name || "Jugador 1",
        session.players?.[1]?.name || "Jugador 2"
    ];

    // Determine Table Type from session or inject it via props if needed. 
    // Assuming session.table?.type or session.gameType exists. 
    // Based on previous context, table type is in session.table.type (enum)
    // But here 'session' props seems to correspond to what `getKioskSession` returns.
    // Let's assume session.table.type exists or use a fallback.
    const tableType = session.table?.type || 'POOL';

    if (isRefereeMode) {
        return <MatchReferee session={session} onExit={() => setIsRefereeMode(false)} />;
    }

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col text-slate-100">
            {/* ... (Header) */}

            {/* Main Content Areas */}
            <div className="flex-grow overflow-hidden">
                <Tabs defaultValue="scoreboard" className="h-full flex flex-col">
                    <TabsList className="bg-slate-900/50 p-1 h-16 w-full justify-start rounded-none border-b border-white/5 flex items-center">
                        <TabsTrigger value="scoreboard" className="h-full px-8 text-lg gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            <Trophy className="w-5 h-5" />
                            Marcador
                        </TabsTrigger>
                        <TabsTrigger value="menu" className="h-full px-8 text-lg gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            <UtensilsCrossed className="w-5 h-5" />
                            Carta & Pedidos
                        </TabsTrigger>

                        {/* Referee Toggle */}
                        {tableType === 'CARAMBOLA' && (
                            <Button
                                variant="outline"
                                onClick={() => setIsRefereeMode(true)}
                                className="ml-auto mr-4 bg-orange-900/20 border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white"
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                Modo Juez
                            </Button>
                        )}
                    </TabsList>

                    <TabsContent value="scoreboard" className="flex-grow p-0 overflow-hidden">
                        <GameScoreboard
                            sessionId={session.id}
                            initialState={session.gameState}
                            tableType={tableType}
                            playerNames={playerNames}
                            players={session.players || []}
                            // New Props
                            cameraTopUrl={session.table?.cameraTopUrl}
                            cameraFrontUrl={session.table?.cameraFrontUrl}
                            onOrderClick={() => setIsPaymentSelectorOpen(true)}
                        />
                    </TabsContent>

                    <TabsContent value="menu" className="flex-grow p-6">

                        <div className="h-full flex items-center justify-center">
                            <Button size="lg" onClick={() => setIsPaymentSelectorOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xl py-8 px-12">
                                <ShoppingCart className="mr-3 w-8 h-8" />
                                Simular Pedido (Demo)
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modals */}
            <PaymentSelector
                isOpen={isPaymentSelectorOpen}
                onClose={() => setIsPaymentSelectorOpen(false)}
                players={session.players || []}
                onConfirm={handleConfirmOrder}
                isSubmitting={isOrdering}
            />
        </div>
    );
}
