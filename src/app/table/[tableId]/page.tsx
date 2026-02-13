import { getKioskState } from '@/app/lib/actions-kiosk';
import { KioskManager } from '@/components/kiosk/KioskManager';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ tableId: string }>;
}

export default async function TableKioskPage({ params }: PageProps) {
    const { tableId } = await params;
    const initialData = await getKioskState(tableId);

    if (initialData.error) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-red-500">
                Error: {initialData.error}
            </div>
        );
    }

    return (
        <KioskManager tableId={tableId} initialData={initialData} />
    );
}
