'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdBanner } from '@prisma/client';

// Fallback images if no ads are configured
const DEFAULT_ADS: Partial<AdBanner>[] = [
    { id: '1', imageUrl: 'https://images.unsplash.com/photo-1571216524316-2de96328bc64?q=80&w=2000&auto=format&fit=crop', title: 'Bienvenidos' },
    { id: '2', imageUrl: 'https://images.unsplash.com/photo-1542322307-e83fa3d6664d?q=80&w=2000&auto=format&fit=crop', title: 'Torneo Mensual' }
];

interface IdleScreenProps {
    ads: AdBanner[];
    tableName?: string;
    tableType?: string;
}

export function IdleScreen({ ads, tableName, tableType }: IdleScreenProps) {
    const displayAds = ads.length > 0 ? ads : DEFAULT_ADS;
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % displayAds.length);
        }, 8000); // 8 seconds per slide
        return () => clearInterval(timer);
    }, [displayAds.length]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                >
                    <img
                        src={displayAds[currentIndex].imageUrl}
                        alt={displayAds[currentIndex].title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                </motion.div>
            </AnimatePresence>

            {/* Center Content: Table Name & Game Graphic */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm p-10 rounded-3xl border border-white/10 flex flex-col items-center">
                {/* Game Graphic */}
                <div className="mb-6 scale-150">
                    {(!tableType || tableType === 'POOL') && (
                        <div className="flex gap-2">
                            <div className="w-12 h-12 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center font-bold text-black shadow-lg">1</div>
                            <div className="w-12 h-12 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center font-bold text-white shadow-lg">2</div>
                            <div className="w-12 h-12 rounded-full bg-red-600 border-4 border-white flex items-center justify-center font-bold text-white shadow-lg">3</div>
                            <div className="w-12 h-12 rounded-full bg-black border-4 border-white flex items-center justify-center font-bold text-white shadow-lg">8</div>
                        </div>
                    )}
                    {tableType === 'CARAMBOLA' && (
                        <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-300 shadow-[0_0_20px_white]"></div>
                            <div className="w-16 h-16 rounded-full bg-yellow-300 border-4 border-yellow-100 shadow-[0_0_20px_yellow]"></div>
                            <div className="w-16 h-16 rounded-full bg-red-600 border-4 border-red-300 shadow-[0_0_20px_red]"></div>
                        </div>
                    )}
                    {(tableType === 'CARDS' || tableType === 'POKER') && (
                        <div className="flex gap-4 text-7xl">
                            <span className="text-white drop-shadow-[0_0_10px_white]">♠️</span>
                            <span className="text-red-500 drop-shadow-[0_0_10px_red]">♥️</span>
                            <span className="text-red-500 drop-shadow-[0_0_10px_red]">♦️</span>
                            <span className="text-white drop-shadow-[0_0_10px_white]">♣️</span>
                        </div>
                    )}
                </div>

                {/* Table Name */}
                <h2 className="text-4xl font-bold uppercase tracking-wider text-blue-400 mb-2">
                    {tableName || "MESA"}
                </h2>
                <h1 className="text-6xl font-black uppercase tracking-widest text-shadow-lg mb-4 text-white">
                    DISPONIBLE
                </h1>
                <p className="text-xl font-light text-slate-300 uppercase tracking-widest">
                    Solicita tu activación en barra
                </p>
            </div>

            {/* Tap hint to view menu maybe? */}
            <div className="absolute bottom-6 right-6 z-20">
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 animate-pulse">
                    <span className="text-sm font-semibold tracking-wider">CLUB SANTIAGO BSM</span>
                </div>
            </div>
        </div>
    );
}
