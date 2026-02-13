/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadHistoricalPayments } from '@/app/lib/actions-admin-finance';

export function HistoricalUploadDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fileStats, setFileStats] = useState<{ total: number } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Validate structure
                // Expected: rut, amount, paymentDate (YYYY-MM-DD), months
                const validRows = data.filter((row: any) => row.rut && row.amount && row.paymentDate).map((row: any) => ({
                    rut: String(row.rut).trim(),
                    amount: Number(row.amount),
                    paymentDate: row.paymentDate, // Date formatting might be tricky from Excel
                    months: Number(row.months || 12)
                }));

                setPreviewData(validRows);
                setFileStats({ total: validRows.length });

                if (validRows.length === 0) {
                    toast.error('No se encontraron filas válidas. Verifique el formato (rut, amount, paymentDate).');
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al leer el archivo Excel.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirm = async () => {
        if (previewData.length === 0) return;
        setIsLoading(true);

        const result = await uploadHistoricalPayments(previewData);

        setIsLoading(false);

        if (result.success) {
            toast.success(`Carga completada. ${result.count} registros procesados.`);
            if (result.errors && result.errors.length > 0) {
                toast.warning(`${result.errors.length} errores detectados. Revise consola.`);
                console.warn("Import Errors:", result.errors);
            }
            setIsOpen(false);
            setPreviewData([]);
            setFileStats(null);
        } else {
            toast.error(result.error || 'Error en la carga masiva.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload size={16} />
                    Carga Histórica
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Carga de Pagos Históricos</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm flex gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                        <div className="text-yellow-700 dark:text-yellow-400">
                            <strong>Atención:</strong> Estos registros actualizarán el estado de "Al día" de los socios pero
                            <strong> NO afectarán</strong> los reportes de Caja ni Ingresos Reales del sistema actual.
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Seleccionar Archivo Excel (.xlsx, .csv)</Label>
                        <Input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                        />
                        <p className="text-xs text-muted-foreground">
                            Columnas esperadas: <code>rut</code>, <code>amount</code>, <code>paymentDate</code> (YYYY-MM-DD), <code>months</code>
                        </p>
                    </div>

                    {fileStats && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <FileSpreadsheet className="text-emerald-500" />
                                <span className="font-medium">{fileStats.total} Registros Válidos</span>
                            </div>
                            <Button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Confirmar Importación
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
