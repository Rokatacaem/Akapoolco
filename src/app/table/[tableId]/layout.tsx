'use client';

import { useEffect } from "react";

export default function KioskLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Enforce full dark mode and disable context menu for "kiosk-like" behavior
    useEffect(() => {
        document.documentElement.classList.add('dark');

        // Disable Right Click
        const handleContext = (e: MouseEvent) => e.preventDefault();
        window.addEventListener('contextmenu', handleContext);

        return () => {
            window.removeEventListener('contextmenu', handleContext);
        };
    }, []);

    return (
        <div className="min-h-screen bg-black overflow-hidden select-none">
            {/* Kiosk wrapper */}
            {children}
        </div>
    );
}
