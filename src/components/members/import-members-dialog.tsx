/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { importMembersBulk } from '@/app/lib/actions-members';

interface ImportMembersDialogProps {
    userRole?: string;
}

export function ImportMembersDialog({ userRole }: ImportMembersDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [fileData, setFileData] = useState<any[]>([]);
    const [stats, setStats] = useState<{ count?: number; failures?: number; errors?: any[] } | null>(null);

    // Allow ADMIN and SUPERUSER
    if (userRole !== 'SUPERUSER' && userRole !== 'ADMIN') return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            // Read as json
            const data = XLSX.utils.sheet_to_json(ws);
            // Map keys to expected format (normalize headers if needed)
            // Expecting: Name/Nombre, Email/Correo, Rut, Type/Tipo
            const normalized = data.map((row: any) => ({
                name: row.Name || row.Nombre || row.name || row.nombre,
                email: row.Email || row.Correo || row.email || row.correo,
                rut: row.Rut || row.Run || row.rut || row.run,
                type: row.Type || row.Tipo || row.type || row.tipo || 'CLIENTE'
            })).filter((r: any) => r.name); // Filter empty rows without name

            setFileData(normalized);
            setStats(null); // Reset stats
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = () => {
        if (fileData.length === 0) return;
        startTransition(async () => {
            const result = await importMembersBulk(fileData);
            if (result.success) {
                setStats({ count: result.count, failures: result.failures, errors: result.errors });
                if (result.failures === 0) {
                    // Auto close if perfect? Maybe wait for user to see success
                    // setOpen(false);
                    setFileData([]); // Clear data
                }
            } else {
                alert(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 border-emerald-600/50">
                    <FileSpreadsheet className="w-4 h-4" />
                    Importar Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Importar Socios Masivamente</DialogTitle>
                    <DialogDescription>
                        Selecciona un archivo Excel (.xlsx, .xls) con las columnas: Nombre, Rut, Email, Tipo.
                        <br />
                        <span className="text-xs text-yellow-500">Nota: No se importarán fotos. Duplicados por RUT/Email serán actualizados.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!stats ? (
                        <>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-muted-foreground/25">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground"><span className="font-semibold">Click para subir</span> o arrastra el archivo</p>
                                    </div>
                                    <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                                </label>
                            </div>

                            {fileData.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Vista Previa ({fileData.length} registros detectados):</p>
                                    <div className="max-h-[200px] overflow-auto rounded border p-2 text-xs bg-muted/30">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="p-1">Nombre</th>
                                                    <th className="p-1">Tipo</th>
                                                    <th className="p-1">Rut</th>
                                                    <th className="p-1">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fileData.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="border-b last:border-0 border-muted/20">
                                                        <td className="p-1">{row.name}</td>
                                                        <td className="p-1">{row.type}</td>
                                                        <td className="p-1">{row.rut || '-'}</td>
                                                        <td className="p-1">{row.email || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {fileData.length > 5 && <p className="text-center italic mt-2">... y {fileData.length - 5} más</p>}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 border rounded bg-muted/20">
                                <div className="flex-1 text-center">
                                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                                    <p className="text-2xl font-bold text-green-500">{stats.count}</p>
                                    <p className="text-xs text-muted-foreground">Importados</p>
                                </div>
                                <div className="h-10 w-px bg-border" />
                                <div className="flex-1 text-center">
                                    {stats.failures === 0 ? (
                                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                                    ) : (
                                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-1" />
                                    )}
                                    <p className={`text-2xl font-bold ${stats.failures && stats.failures > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                                        {stats.failures}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Fallidos</p>
                                </div>
                            </div>

                            {stats.errors && stats.errors.length > 0 && (
                                <div className="max-h-[150px] overflow-auto text-xs text-red-400 bg-red-950/20 p-2 rounded">
                                    <ul>
                                        {stats.errors.map((e, i) => (
                                            <li key={i}>Fila: {e.row.name} - {e.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!stats ? (
                        <Button onClick={handleImport} disabled={fileData.length === 0 || isPending}>
                            {isPending ? 'Procesando...' : 'Importar Usuarios'}
                        </Button>
                    ) : (
                        <Button onClick={() => setOpen(false)}>Cerrar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
