import { PrintQueueManager } from "@/components/kiosk/PrintQueueManager";

export const metadata = {
    title: 'Cola de Impresión - BSM',
};

export default function PrintQueuePage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <PrintQueueManager />
        </div>
    );
}
