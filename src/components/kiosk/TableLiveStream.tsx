
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, VideoOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableLiveStreamProps {
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
}

export function TableLiveStream({ cameraTopUrl, cameraFrontUrl }: TableLiveStreamProps) {
    const [activeView, setActiveView] = useState<'TOP' | 'FRONT'>('TOP');
    const [isMock, setIsMock] = useState(true); // For development/demo

    // Resolve URL based on view
    const currentUrl = activeView === 'TOP' ? cameraTopUrl : cameraFrontUrl;

    // Mock Data for Demo if no URL provided
    const mockVideoUrl = "https://cdn.pixabay.com/video/2020/04/18/36427-414674716_large.mp4"; // Generic Abstract Video
    // Or a static image for "Top View" feel
    const mockImage = "https://images.unsplash.com/photo-1579619627768-450ee63c7eb1?auto=format&fit=crop&q=80&w=1000";

    const hasSource = !!currentUrl || isMock;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800 group">

            {/* Video Feed */}
            {hasSource ? (
                isMock && !currentUrl ? (
                    // Mock Render
                    activeView === 'TOP' ? (
                        <img
                            src={mockImage}
                            alt="Top View Mock"
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <video
                            src={mockVideoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover opacity-80"
                        />
                    )
                ) : (
                    // Real Stream
                    <iframe
                        src={currentUrl || ""}
                        className="w-full h-full border-0 pointer-events-none"
                        title="Live Feed"
                    />
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                    <VideoOff className="w-12 h-12 mb-2" />
                    <span>Cámaras Desconectadas</span>
                </div>
            )}

            {/* Overlays / Controls */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/10 flex gap-1 z-10 transition-opacity hover:opacity-100 opacity-60">
                <Button
                    size="sm"
                    variant={activeView === 'TOP' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveView('TOP')}
                    className="text-xs font-bold h-8"
                >
                    CENITAL
                </Button>
                <div className="w-[1px] bg-white/20 my-1" />
                <Button
                    size="sm"
                    variant={activeView === 'FRONT' ? 'secondary' : 'ghost'}
                    onClick={() => setActiveView('FRONT')}
                    className="text-xs font-bold h-8"
                >
                    FRONTAL
                </Button>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 text-white text-[10px] font-black tracking-widest px-2 py-1 rounded">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
            </div>

        </div>
    );
}
