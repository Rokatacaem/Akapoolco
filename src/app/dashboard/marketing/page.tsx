import { getAds } from "@/app/lib/actions-ads";
import { AdManager } from "@/components/admin/AdManager";
import { MonitorPlay } from "lucide-react";

export const metadata = {
    title: "Marketing & Publicidad Digital | Club Santiago",
    description: "Gestión de anuncios para quioscos y tablets",
};

export default async function MarketingPage() {
    const ads = await getAds();

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <div className="bg-blue-600/20 p-3 rounded-xl">
                    <MonitorPlay className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Publicidad Digital</h1>
                    <p className="text-slate-400">Gestiona los anuncios que aparecen en los tablets de las mesas cuando están en modo espera.</p>
                </div>
            </div>

            <AdManager initialAds={ads} />
        </div>
    );
}
