'use client';

import { useState } from 'react';
import { uploadAdBanner, toggleAdStatus, deleteAd } from '@/app/lib/actions-ads';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Trash2, Upload, MonitorPlay, Image as ImageIcon } from 'lucide-react';
import { AdBanner } from '@prisma/client';
import { cn } from '@/lib/utils';

interface AdManagerProps {
    initialAds: AdBanner[];
}

export function AdManager({ initialAds }: AdManagerProps) {
    const [ads, setAds] = useState<AdBanner[]>(initialAds);
    const [isUploading, setIsUploading] = useState(false);

    // Upload Handler
    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUploading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await uploadAdBanner(formData);
            if (result.error) {
                toast.error(result.error);
            } else if (result.success && result.ad) {
                toast.success('Anuncio subido correctamente');
                // Optimistic update (or waiting for revalidate) - here we just refetch handled by page reload or we can append
                // Ideally server revalidates and we might need to router.refresh(), but manual append works for instant feedback
                setAds(prev => [result.ad!, ...prev]);
                (e.target as HTMLFormElement).reset();
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsUploading(false);
        }
    };

    // Toggle Handler
    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic UI
        setAds(prev => prev.map(ad => ad.id === id ? { ...ad, active: !currentStatus } : ad));

        const result = await toggleAdStatus(id, !currentStatus);
        if (result.error) {
            toast.error(result.error);
            // Revert
            setAds(prev => prev.map(ad => ad.id === id ? { ...ad, active: currentStatus } : ad));
        }
    };

    // Delete Handler
    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm('¿Seguro que deseas eliminar este anuncio permanentemente?')) return;

        // Optimistic UI
        setAds(prev => prev.filter(ad => ad.id !== id));

        const result = await deleteAd(id, imageUrl);
        if (result.error) {
            toast.error(result.error);
            // Revert (trickier without fetching, but less critical for delete)
            toast.warning('Recarga la página si el error persiste');
        } else {
            toast.success('Anuncio eliminado');
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-900/80 transition-colors">
                <form onSubmit={handleUpload} className="w-full max-w-md space-y-4">
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Subir Nuevo Anuncio</h3>
                        <p className="text-sm text-slate-400">Arrastra una imagen o selecciónala (JPG, PNG, WEBP)</p>
                    </div>

                    <div className="grid gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-left">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-slate-300">Título / Descripción</Label>
                            <Input name="title" id="title" placeholder="Ej: Promo Pisco Sour" required className="bg-slate-900 border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file" className="text-slate-300">Imagen</Label>
                            <Input name="file" id="file" type="file" accept="image/*" required className="bg-slate-900 border-slate-700 file:text-blue-400" />
                        </div>
                    </div>

                    <Button type="submit" disabled={isUploading} className="w-full bg-blue-600 hover:bg-blue-500 font-bold">
                        {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : 'Publicar Anuncio'}
                    </Button>
                </form>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ads.map((ad) => (
                    <div key={ad.id} className={cn(
                        "group relative rounded-xl overflow-hidden border transition-all duration-300 bg-slate-900",
                        ad.active ? "border-slate-700 shadow-lg" : "border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                    )}>
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 z-10">
                            {ad.active ? (
                                <span className="bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                    <MonitorPlay className="w-3 h-3" /> ACTIVO
                                </span>
                            ) : (
                                <span className="bg-slate-500/90 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                    INACTIVO
                                </span>
                            )}
                        </div>

                        {/* Image Preview */}
                        <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                            {ad.imageUrl ? (
                                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700"><ImageIcon className="w-12 h-12" /></div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="p-4 space-y-4">
                            <div>
                                <h4 className="font-bold text-white truncate" title={ad.title}>{ad.title}</h4>
                                <p className="text-xs text-slate-500">{new Date(ad.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={ad.active}
                                        onCheckedChange={() => handleToggle(ad.id, ad.active)}
                                    />
                                    <span className="text-xs font-medium text-slate-400">
                                        {ad.active ? 'Visible' : 'Oculto'}
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => handleDelete(ad.id, ad.imageUrl)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}

                {ads.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                            <ImageIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p>No hay anuncios cargados aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
