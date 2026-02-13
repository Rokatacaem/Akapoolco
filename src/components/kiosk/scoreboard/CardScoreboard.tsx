"use strict";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Clock } from "lucide-react";
import { TableLiveStream } from "../TableLiveStream";
import { cn } from "@/lib/utils";

interface CardScoreboardProps {
    playerNames: [string, string]; // We might ignore this or show list of players if passed differently
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function CardScoreboard({
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: CardScoreboardProps) {

    return (
        <div className="h-full w-full grid grid-cols-12 gap-1 p-2 bg-black">

            {/* LEFT COLUMN (25%) - Info / Decoration */}
            <div className="col-span-3 flex flex-col h-full gap-2 bg-zinc-900/30 rounded-xl border border-white/5 p-4 items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                    <span className="text-4xl">♠️</span>
                </div>
                <h2 className="text-2xl font-bold text-indigo-400 uppercase tracking-widest text-center">Mesa de Cartas</h2>
                <p className="text-zinc-500 text-sm text-center">Disfrute su juego</p>
            </div>

            {/* CENTER COLUMN (50%) - Video & Actions */}
            <div className="col-span-6 flex flex-col h-full gap-2 px-1">
                {/* 1. Video Feed */}
                <div className="flex-grow flex items-center justify-center bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
                    <TableLiveStream
                        cameraTopUrl={cameraTopUrl}
                        cameraFrontUrl={cameraFrontUrl}
                    />
                </div>

                {/* 2. Action Buttons */}
                <div className="h-24">
                    <Button
                        onClick={onOrderClick}
                        className="w-full h-full bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 flex items-center justify-center gap-2 text-lg"
                    >
                        <UtensilsCrossed className="w-6 h-6" />
                        <span className="font-bold uppercase">Solicitar Servicio a la Mesa</span>
                    </Button>
                </div>
            </div>

            {/* RIGHT COLUMN (25%) - Timer or Info */}
            <div className="col-span-3 flex flex-col h-full gap-2 bg-zinc-900/30 rounded-xl border border-white/5 p-4 items-center justify-center">
                {/* Decorative / Info */}
                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <span className="text-4xl">♥️</span>
                </div>
                <div className="flex flex-col items-center">
                    <Clock className="w-8 h-8 text-zinc-600 mb-2" />
                    <span className="text-zinc-500 text-xs uppercase">Tiempo Transcurrido</span>
                    {/* Note: We don't have the timer prop passed down here yet. 
                        For now just static or removing. 
                        Ideally we pass the session start time to show a clock.
                    */}
                </div>
            </div>
        </div>
    );
}
