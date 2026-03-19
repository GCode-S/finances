import Dexie, { type Table } from 'dexie'

export type Theme = 'light' | 'dark'
export type TransactionKind = 'expense' | 'income'

export interface AppSettings {
  id: 'main'
  monthlyIncome: number
  theme: Theme
  updatedAt: string
}

export interface TransactionItem {
  id?: number
  kind: TransactionKind
  category: string
  amount: number
  date: string
  isRecurring?: boolean
  note: string
  createdAt: string
}

export interface BudgetItem {
  id?: number
  category: string
  limit: number
}

export interface FixedExpenseItem {
  id?: number
  label: string
  category: string
  amount: number
}

class FinancesDatabase extends Dexie {
  settings!: Table<AppSettings, AppSettings['id']>
  transactions!: Table<TransactionItem, number>
  budgets!: Table<BudgetItem, number>
  fixedExpenses!: Table<FixedExpenseItem, number>

  constructor() {
    super('fluxo-pessoal-db')

    this.version(1).stores({
      settings: 'id, theme, updatedAt',
      transactions: '++id, kind, category, date, createdAt',
    })

    this.version(2).stores({
      budgets: '++id, category',
    })

    this.version(3).stores({
      fixedExpenses: '++id, category, label',
    })

    this.version(4).stores({
      transactions: '++id, kind, category, date, createdAt, isRecurring',
    })
  }
}

export const db = new FinancesDatabase()

export const expenseCategories = [
  'Moradia',
  'Alimentacao',
  'Transporte',
  'Saude',
  'Lazer',
  'Educacao',
  'Assinaturas',
  'Reserva',
  'Outros',
]

export const incomeCategories = [
  'Renda extra',
  'Freelance',
  'Investimentos',
  'Reembolso',
  'Venda',
  'Outros ganhos',
]

export async function ensureSettings(): Promise<AppSettings> {
  const current = await db.settings.get('main')

  if (current) {
    return current
  }

  const defaults: AppSettings = {
    id: 'main',
    monthlyIncome: 0,
    theme: 'light',
    updatedAt: new Date().toISOString(),
  }

  await db.settings.put(defaults)
  return defaults
}