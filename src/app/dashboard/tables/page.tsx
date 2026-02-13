import { getTables } from '@/app/lib/actions-tables';
import { TableCard } from '@/components/tables/TableCard';
import { NewTableDialog } from '@/components/tables/NewTableDialog';

export default async function TablesPage() {
    const tables = await getTables();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Mesas</h1>
                <NewTableDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map((table) => (
                    <TableCard key={table.id} table={table} />
                ))}
                {tables.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No hay mesas registradas.
                    </div>
                )}
            </div>
        </div>
    );
}
