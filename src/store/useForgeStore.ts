import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ForgeConfig } from '@/lib/config';
import { generateStatement } from '@/lib/generator';
import { generateHTMLStatement } from '@/lib/templates/statement';
import { DEFAULT_CONFIG } from '@/lib/config';

interface StatementRecord {
  id: string;
  name: string;
  config: ForgeConfig;
  html: string;
  createdAt: string;
}

interface ForgeState {
  statements: StatementRecord[];
  currentStatement: StatementRecord | null;
  addStatement: (partial: Partial<ForgeConfig>) => string;
  loadStatement: (id: string) => void;
  deleteStatement: (id: string) => void;
  clearAll: () => void;
}

export const useForgeStore = create<ForgeState>()(
  persist(
    (set, get) => ({
      statements: [],
      currentStatement: null,
      addStatement: (partial) => {
        const fullConfig = generateStatement({ ...DEFAULT_CONFIG, ...partial } as ForgeConfig);
        const html = generateHTMLStatement(fullConfig);
        const record: StatementRecord = {
          id: 'stmt_' + Date.now().toString(36),
          name: `Statement ${new Date().toLocaleDateString('en-AU')}`,
          config: fullConfig,
          html,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          statements: [record, ...state.statements].slice(0, 50),
          currentStatement: record,
        }));
        return record.id;
      },
      loadStatement: (id) => {
        const found = get().statements.find(s => s.id === id);
        if (found) set({ currentStatement: found });
      },
      deleteStatement: (id) => set((state) => ({
        statements: state.statements.filter(s => s.id !== id),
        currentStatement: state.currentStatement?.id === id ? null : state.currentStatement,
      })),
      clearAll: () => set({ statements: [], currentStatement: null }),
    }),
    { name: 'auspayforge-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
