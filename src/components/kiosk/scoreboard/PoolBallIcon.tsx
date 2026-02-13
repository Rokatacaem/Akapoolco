import { cn } from "@/lib/utils";

// Precise Billiard Colors
const getBallColors = (num: number) => {
    // 1 & 9: Yellow
    if (num === 1 || num === 9) return { base: '#fbbf24', dark: '#d97706', darkest: '#78350f' }; // Amber-ish yellow
    // 2 & 10: Blue
    if (num === 2 || num === 10) return { base: '#2563eb', dark: '#1e40af', darkest: '#172554' };
    // 3 & 11: Red
    if (num === 3 || num === 11) return { base: '#dc2626', dark: '#991b1b', darkest: '#450a0a' };
    // 4 & 12: Purple
    if (num === 4 || num === 12) return { base: '#7c3aed', dark: '#5b21b6', darkest: '#2e1065' };
    // 5 & 13: Orange
    if (num === 5 || num === 13) return { base: '#f97316', dark: '#c2410c', darkest: '#7c2d12' };
    // 6 & 14: Green
    if (num === 6 || num === 14) return { base: '#16a34a', dark: '#15803d', darkest: '#14532d' };
    // 7 & 15: Maroon
    if (num === 7 || num === 15) return { base: '#9a3412', dark: '#7c2d12', darkest: '#431407' };
    // 8: Black
    if (num === 8) return { base: '#262626', dark: '#171717', darkest: '#000000' };

    // Default White
    return { base: '#f5f5f5', dark: '#d4d4d4', darkest: '#737373' };
};

export function PoolBallIcon({ value, size = "md", className, onClick }: { value: number, size?: "sm" | "md" | "lg" | "xl", className?: string, onClick?: () => void }) {
    const isStripe = value > 8 && value !== 8;
    const colors = getBallColors(value);

    // Sizes
    let dim = "w-10 h-10 text-sm";
    if (size === "sm") dim = "w-7 h-7 text-[10px]"; // Slightly larger sm for readability
    if (size === "lg") dim = "w-16 h-16 text-xl";
    if (size === "xl") dim = "w-24 h-24 text-3xl";

    // Dynamic Gradients
    const solidGradient = `radial-gradient(circle at 35% 25%, ${colors.base} 0%, ${colors.dark} 40%, ${colors.darkest} 85%, #000001 100%)`;
    const whiteGradient = `radial-gradient(circle at 35% 25%, #ffffff 0%, #e5e5e5 35%, #a3a3a3 85%, #404040 100%)`;

    // Stripe Color (Linear for the band, but properly shaded by overlays)
    // We use a rich gradient for the stripe itself to give it 'texture'
    const stripeGradient = `linear-gradient(to bottom, ${colors.base}, ${colors.dark})`;

    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-full relative flex items-center justify-center font-black select-none transition-all active:scale-95 cursor-pointer group",
                dim,
                className
            )}
            style={{
                background: isStripe ? whiteGradient : solidGradient,
                boxShadow: `
                    0 20px 30px -10px rgba(0,0,0,0.6), 
                    inset 0 -6px 10px -4px rgba(0,0,0,0.4),
                    inset 0 2px 4px rgba(255,255,255,0.2)
                `
            }}
        >
            {/* 1. The Stripe (Layered under the gloss/shadows) */}
            {isStripe && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full z-0 clip-circle">
                    {/* The Stripe Band */}
                    <div
                        className="w-[140%] h-[58%] absolute transform -rotate-[35deg] shadow-lg"
                        style={{
                            background: stripeGradient,
                            // Inner shadow on the stripe to make it look embedded/curved
                            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)'
                        }}
                    ></div>
                </div>
            )}

            {/* 2. Global Spherical Shading Overlay (Multiplies darkness on edges) */}
            <div className="absolute inset-0 rounded-full z-10 pointer-events-none mix-blend-multiply"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.8) 100%)'
                }}
            />

            {/* 3. Specular Highlight (The "Hot" Reflection) */}
            <div className="absolute inset-0 rounded-full z-20 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 10%, rgba(255,255,255,0) 40%)',
                    filter: 'blur(1px)'
                }}
            />

            {/* 4. Rim Light (Fresnel effect on bottom/side) */}
            <div className="absolute inset-0 rounded-full z-20 pointer-events-none mix-blend-soft-light"
                style={{
                    background: 'radial-gradient(circle at 70% 80%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0) 50%)'
                }}
            />

            {/* 5. Number Circle (The "Badge") */}
            <div className={cn(
                "rounded-full bg-[#fdfdfd] flex items-center justify-center z-30 relative",
                size === 'xl' ? "w-12 h-12" : (size === 'lg' ? "w-8 h-8" : "w-[55%] h-[55%]"),
                // Subtle shading on the white circle itself
                "shadow-[0_2px_5px_rgba(0,0,0,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
            )}>
                {/* Number Text */}
                <span className="leading-none text-black font-sans tracking-tight opacity-90" style={{
                    fontFamily: 'Arial, sans-serif',
                    transform: 'scaleY(0.9)', // Condensed look typical of balls
                    textShadow: '0 1px 0 rgba(255,255,255,1)'
                }}>
                    {value}
                </span>
            </div>

            {/* 6. Subtle Drop Shadow for floating effect (optional, if on felt) */}
        </div>
    );
}
