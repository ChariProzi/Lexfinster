import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildSeed, type Seed } from './seed'

type DbState = Seed & {
  seedVersion: number
  set: <K extends keyof Seed>(key: K, value: Seed[K]) => void
  update: <K extends keyof Seed>(key: K, fn: (prev: Seed[K]) => Seed[K]) => void
  resetDemoData: () => void
}

const SEED_VERSION = 9 // bump to force-refresh persisted demo data after a seed shape (or content) change

export const useDb = create<DbState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),
      seedVersion: SEED_VERSION,
      set: (key, value) => set({ [key]: value } as unknown as Partial<DbState>),
      update: (key, fn) => set({ [key]: fn(get()[key]) } as unknown as Partial<DbState>),
      resetDemoData: () => set({ ...buildSeed(), seedVersion: SEED_VERSION }),
    }),
    {
      name: 'litigation-app-db-v1',
      version: SEED_VERSION,
      migrate: (_persisted, version) => {
        if (version !== SEED_VERSION) return { ...buildSeed(), seedVersion: SEED_VERSION }
        return _persisted as DbState
      },
    },
  ),
)

/** Non-hook accessor for use inside plain async API functions. */
export function db() {
  return useDb.getState()
}

export function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
