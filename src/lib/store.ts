import { create } from 'zustand'

type TableStatus = 'FREE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'

interface TableState {
    id: string
    name: string
    status: TableStatus
    startTime: Date | null
    currentSessionId: string | null
    totalAmount: number // Client-side calculation for display
}

interface CockpitStore {
    tables: TableState[]
    setTables: (tables: TableState[]) => void
    updateTableStatus: (id: string, status: TableStatus) => void
    startTable: (id: string) => void
    stopTable: (id: string) => void
}

export const useCockpitStore = create<CockpitStore>((set) => ({
    tables: [],
    setTables: (tables) => set({ tables }),
    updateTableStatus: (id, status) =>
        set((state) => ({
            tables: state.tables.map((t) =>
                t.id === id ? { ...t, status } : t
            ),
        })),
    startTable: (id) =>
        set((state) => ({
            tables: state.tables.map((t) =>
                t.id === id ? { ...t, status: 'OCCUPIED', startTime: new Date() } : t
            ),
        })),
    stopTable: (id) =>
        set((state) => ({
            tables: state.tables.map((t) =>
                t.id === id ? { ...t, status: 'FREE', startTime: null, totalAmount: 0 } : t
            ),
        })),
}))
