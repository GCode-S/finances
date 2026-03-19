import {
  CloudDownload,
  LayoutDashboard,
  MoonStar,
  ReceiptText,
  Settings,
  SunMedium,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { ChangeEvent, FormEvent, PointerEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BackupPage } from './pages/BackupPage.tsx'
import { DashboardPage, type DashboardInsight } from './pages/DashboardPage.tsx'
import { EntriesPage } from './pages/EntriesPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import {
  db,
  ensureDefaultFixedExpenses,
  ensureSettings,
  expenseCategories,
  incomeCategories,
  type AppSettings,
  type FixedExpenseItem,
  type Theme,
  type TransactionItem,
  type TransactionKind,
} from './lib/db'

const defaultTheme: Theme = 'light'

type FilterKind = 'all' | TransactionKind
type PageKey = 'dashboard' | 'entries' | 'backup' | 'settings'

interface FlashMessage {
  tone: 'success' | 'error' | 'info'
  text: string
}

interface EntryFormState {
  kind: TransactionKind
  category: string
  amount: string
  date: string
  note: string
  isRecurring: boolean
}

interface ExportPayload {
  version: number
  exportedAt: string
  settings: AppSettings
  transactions: TransactionItem[]
  fixedExpenses?: FixedExpenseItem[]
}

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function formatMoney(value: number) {
  return moneyFormatter.format(value)
}

function formatPercent(value: number) {
  return percentFormatter.format(Number.isFinite(value) ? value : 0)
}

function moneyEquals(left: number, right: number) {
  return Math.abs(left - right) < 0.0001
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)

  if (!year || !monthNumber) {
    return 'Mes atual'
  }

  const value = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1))

  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

function getEntryDefaults(kind: TransactionKind = 'expense'): EntryFormState {
  return {
    kind,
    category: kind === 'expense' ? expenseCategories[0] : incomeCategories[0],
    amount: '',
    date: getToday(),
    note: '',
    isRecurring: false,
  }
}

function activateRipple(event: PointerEvent<HTMLElement>) {
  const element = event.currentTarget
  const bounds = element.getBoundingClientRect()

  element.style.setProperty('--ripple-x', `${event.clientX - bounds.left}px`)
  element.style.setProperty('--ripple-y', `${event.clientY - bounds.top}px`)
  element.classList.remove('ripple-active')
  void element.getBoundingClientRect()
  element.classList.add('ripple-active')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function isTransactionKind(value: unknown): value is TransactionKind {
  return value === 'expense' || value === 'income'
}

function normalizeSettings(value: unknown, fallbackTheme: Theme): AppSettings {
  if (!isRecord(value)) {
    throw new Error('Configuracao invalida')
  }

  const monthlyIncome =
    typeof value.monthlyIncome === 'number' && Number.isFinite(value.monthlyIncome)
      ? value.monthlyIncome
      : 0

  return {
    id: 'main',
    monthlyIncome,
    theme: isTheme(value.theme) ? value.theme : fallbackTheme,
    updatedAt:
      typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  }
}

function normalizeTransactions(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('Lancamentos invalidos')
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error('Lancamento invalido')
    }

    const amount = typeof item.amount === 'number' ? item.amount : Number.NaN

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Valor de lancamento invalido')
    }

    return {
      kind: isTransactionKind(item.kind) ? item.kind : 'expense',
      category: typeof item.category === 'string' ? item.category : 'Outros',
      amount,
      date: typeof item.date === 'string' ? item.date : getToday(),
      note: typeof item.note === 'string' ? item.note : '',
      isRecurring: Boolean(item.isRecurring),
      createdAt:
        typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    } satisfies TransactionItem
  })
}

function normalizeFixedExpenses(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as FixedExpenseItem[]
  }

  return value
    .filter(isRecord)
    .map((item) => {
      const amount = typeof item.amount === 'number' ? item.amount : Number.NaN

      if (!Number.isFinite(amount) || amount <= 0) {
        return null
      }

      return {
        label:
          typeof item.label === 'string' && item.label.trim()
            ? item.label.trim()
            : 'Gasto fixo',
        category:
          typeof item.category === 'string' && item.category.trim()
            ? item.category.trim()
            : 'Moradia',
        amount,
      } satisfies FixedExpenseItem
    })
    .filter((item): item is FixedExpenseItem => item !== null)
}

function getPageFromHash(): PageKey {
  const hash = window.location.hash.replace('#', '')

  if (hash === 'dashboard' || hash === 'entries' || hash === 'backup' || hash === 'settings') {
    return hash
  }

  return 'dashboard'
}

function App() {
  const settings = useLiveQuery(() => db.settings.get('main'), [])
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    [],
  )
  const fixedExpenses = useLiveQuery(() => db.fixedExpenses.toArray(), [])

  const [page, setPage] = useState<PageKey>(getPageFromHash)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)
  const [filterKind, setFilterKind] = useState<FilterKind>('all')
  const [entryForm, setEntryForm] = useState<EntryFormState>(getEntryDefaults())
  const [flash, setFlash] = useState<FlashMessage | null>(null)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  const activeTheme = settings?.theme ?? defaultTheme
  const availableCategories =
    entryForm.kind === 'expense' ? expenseCategories : incomeCategories
  const allTransactions = useMemo(() => transactions ?? [], [transactions])
  const legacyFixedExpenses = useMemo(() => fixedExpenses ?? [], [fixedExpenses])

  const recurringFromEntries = allTransactions
    .filter((item) => item.kind === 'expense' && item.isRecurring)
    .reduce((sum, item) => sum + item.amount, 0)

  const recurringFromLegacy = legacyFixedExpenses.reduce((sum, item) => sum + item.amount, 0)

  const recurringExpensesTotal = recurringFromEntries + recurringFromLegacy

  const monthTransactions = allTransactions.filter((item) => item.date.startsWith(selectedMonth))
  const monthIncome = monthTransactions
    .filter((item) => item.kind === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const monthNonRecurringExpense = monthTransactions
    .filter((item) => item.kind === 'expense' && !item.isRecurring)
    .reduce((sum, item) => sum + item.amount, 0)

  const fixedIncome = settings?.monthlyIncome ?? 0
  const expenses = monthNonRecurringExpense + recurringExpensesTotal
  const available = fixedIncome + monthIncome
  const balance = available - expenses

  const visibleTransactions =
    filterKind === 'all'
      ? monthTransactions
      : monthTransactions.filter((item) => item.kind === filterKind)

  const categorySummary = useMemo(() => {
    const summary = monthTransactions
      .filter((item) => item.kind === 'expense' && !item.isRecurring)
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + item.amount
        return acc
      }, {})

    allTransactions
      .filter((item) => item.kind === 'expense' && item.isRecurring)
      .forEach((item) => {
        summary[item.category] = (summary[item.category] ?? 0) + item.amount
      })

    legacyFixedExpenses.forEach((item) => {
      summary[item.category] = (summary[item.category] ?? 0) + item.amount
    })

    return Object.entries(summary)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([category, amount]) => ({ category, amount }))
  }, [monthTransactions, allTransactions, legacyFixedExpenses])

  const biggestCategory = categorySummary[0]

  const monthlyTrend = useMemo(() => {
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - (5 - i))
      return d.toISOString().slice(0, 7)
    })

    return last6.map((month) => {
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(new Date(`${month}-15`))
        .replace('.', '')

      const monthItems = allTransactions.filter((item) => item.date.startsWith(month))
      const income = monthItems
        .filter((item) => item.kind === 'income')
        .reduce((sum, item) => sum + item.amount, 0)

      const monthOneTimeExpense = monthItems
        .filter((item) => item.kind === 'expense' && !item.isRecurring)
        .reduce((sum, item) => sum + item.amount, 0)

      return {
        month,
        label,
        income,
        expenses: monthOneTimeExpense + recurringExpensesTotal,
      }
    })
  }, [allTransactions, recurringExpensesTotal])

  const insights: DashboardInsight[] = [
    balance < 0
      ? {
          title: 'Saldo mensal negativo',
          body: 'Reduza gastos variaveis e revise gastos fixos para recuperar margem no proximo ciclo.',
        }
      : {
          title: 'Saldo mensal positivo',
          body: 'Sua margem esta saudavel. Continue registrando entradas e saidas para manter previsibilidade.',
        },
    recurringExpensesTotal > 0
      ? {
          title: 'Recorrencias impactam todo mes',
          body: `${formatMoney(recurringExpensesTotal)} sao aplicados automaticamente na leitura mensal.`,
        }
      : {
          title: 'Sem recorrencias cadastradas',
          body: 'Marque gastos fixos no cadastro de lancamento para projetar melhor sua saude financeira.',
        },
    biggestCategory
      ? {
          title: `${biggestCategory.category} e a maior pressao`,
          body: `${formatMoney(biggestCategory.amount)} representam ${formatPercent(
            biggestCategory.amount / Math.max(expenses, 1),
          )} das saidas.`,
        }
      : {
          title: 'Sem gastos no periodo',
          body: 'Ao cadastrar gastos, o painel mostrara onde otimizar com mais impacto.',
        },
  ]

  useEffect(() => {
    void ensureSettings()
    void ensureDefaultFixedExpenses()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

    root.classList.toggle('dark', activeTheme === 'dark')
    root.style.colorScheme = activeTheme

    if (themeColor) {
      themeColor.content = activeTheme === 'dark' ? '#0d141f' : '#f4efe7'
    }
  }, [activeTheme])

  useEffect(() => {
    const onHashChange = () => {
      setPage(getPageFromHash())
    }

    onHashChange()
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])

  useEffect(() => {
    const handleNetworkChange = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', handleNetworkChange)
    window.addEventListener('offline', handleNetworkChange)

    return () => {
      window.removeEventListener('online', handleNetworkChange)
      window.removeEventListener('offline', handleNetworkChange)
    }
  }, [])

  useEffect(() => {
    if (!flash) {
      return
    }

    const timerId = window.setTimeout(() => setFlash(null), 2800)
    return () => window.clearTimeout(timerId)
  }, [flash])

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(entryForm.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      setFlash({ tone: 'error', text: 'Informe um valor maior que zero.' })
      return
    }

    await db.transactions.add({
      kind: entryForm.kind,
      category: entryForm.category.trim() || availableCategories[0],
      amount,
      date: entryForm.date,
      note: entryForm.note.trim(),
      isRecurring: entryForm.kind === 'expense' ? entryForm.isRecurring : false,
      createdAt: new Date().toISOString(),
    })

    setEntryForm(getEntryDefaults(entryForm.kind))
    setFlash({ tone: 'success', text: 'Lancamento salvo no dispositivo.' })
  }

  async function removeEntry(id: number | undefined) {
    if (!id) {
      return
    }

    await db.transaction('rw', db.transactions, db.fixedExpenses, db.budgets, async () => {
      const existingEntry = await db.transactions.get(id)

      if (!existingEntry) {
        return
      }

      await db.transactions.delete(id)

      if (existingEntry.kind === 'expense') {
        const fixedCandidates = await db.fixedExpenses
          .where('category')
          .equals(existingEntry.category)
          .toArray()

        const noteText = existingEntry.note.trim().toLowerCase()

        const relatedFixedIds = fixedCandidates
          .filter((item) => {
            if (!moneyEquals(item.amount, existingEntry.amount)) {
              return false
            }

            if (!noteText) {
              return true
            }

            return item.label.trim().toLowerCase() === noteText
          })
          .map((item) => item.id)
          .filter((itemId): itemId is number => typeof itemId === 'number')

        if (relatedFixedIds.length > 0) {
          await db.fixedExpenses.bulkDelete(relatedFixedIds)
        }
      }

      const remainingCategoryCount = await db.transactions
        .where('category')
        .equals(existingEntry.category)
        .count()

      if (remainingCategoryCount === 0) {
        const relatedBudgets = await db.budgets
          .where('category')
          .equals(existingEntry.category)
          .toArray()

        const relatedBudgetIds = relatedBudgets
          .map((item) => item.id)
          .filter((itemId): itemId is number => typeof itemId === 'number')

        if (relatedBudgetIds.length > 0) {
          await db.budgets.bulkDelete(relatedBudgetIds)
        }
      }
    })

    setFlash({ tone: 'info', text: 'Lancamento removido com limpeza dos dados relacionados.' })
  }

  async function toggleTheme() {
    await db.settings.put({
      id: 'main',
      monthlyIncome: fixedIncome,
      theme: activeTheme === 'dark' ? 'light' : 'dark',
      updatedAt: new Date().toISOString(),
    })

    setFlash({ tone: 'success', text: 'Tema atualizado.' })
  }

  async function saveMonthlyIncome(value: string) {
    const monthlyIncome = Number(value)

    if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
      setFlash({ tone: 'error', text: 'Informe uma renda mensal valida.' })
      return
    }

    await db.settings.put({
      id: 'main',
      monthlyIncome,
      theme: activeTheme,
      updatedAt: new Date().toISOString(),
    })

    setFlash({ tone: 'success', text: 'Renda mensal atualizada.' })
  }

  async function exportData() {
    const currentSettings = settings ?? (await ensureSettings())
    const payload: ExportPayload = {
      version: 3,
      exportedAt: new Date().toISOString(),
      settings: currentSettings,
      transactions: await db.transactions.toArray(),
      fixedExpenses: await db.fixedExpenses.toArray(),
    }

    const file = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')

    link.href = url
    link.download = `fluxo-pessoal-${selectedMonth}.json`
    link.click()
    URL.revokeObjectURL(url)
    setFlash({ tone: 'success', text: 'Arquivo JSON exportado.' })
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<ExportPayload>
      const nextSettings = normalizeSettings(parsed.settings, activeTheme)
      const nextTransactions = normalizeTransactions(parsed.transactions)
      const nextFixedExpenses = normalizeFixedExpenses(parsed.fixedExpenses)

      await db.transaction('rw', db.settings, db.transactions, db.fixedExpenses, async () => {
        await db.settings.clear()
        await db.transactions.clear()
        await db.fixedExpenses.clear()
        await db.settings.put(nextSettings)
        await db.transactions.bulkAdd(nextTransactions)

        if (nextFixedExpenses.length > 0) {
          await db.fixedExpenses.bulkAdd(nextFixedExpenses)
        } else {
          await ensureDefaultFixedExpenses()
        }
      })

      setFlash({ tone: 'success', text: 'Dados importados com sucesso.' })
    } catch {
      setFlash({
        tone: 'error',
        text: 'Nao foi possivel importar o arquivo. Verifique se o JSON e valido.',
      })
    } finally {
      event.target.value = ''
    }
  }

  async function clearData() {
    const confirmed = window.confirm(
      'Isso vai apagar TODOS os dados locais: saldo, entradas, saidas, gastos fixos, configuracoes e orcamentos. Deseja continuar?',
    )

    if (!confirmed) {
      return
    }

    await db.transaction('rw', db.settings, db.transactions, db.fixedExpenses, db.budgets, async () => {
      await db.settings.clear()
      await db.transactions.clear()
      await db.fixedExpenses.clear()
      await db.budgets.clear()
    })

    setFlash({
      tone: 'info',
      text: 'Todos os dados foram apagados: saldo, entradas, saidas e gastos fixos.',
    })
  }

  function goToPage(nextPage: PageKey) {
    window.location.hash = nextPage
    setPage(nextPage)
  }

  const navigationItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'entries' as const, label: 'Lancamentos', icon: <ReceiptText size={18} /> },
    { id: 'backup' as const, label: 'Backup', icon: <CloudDownload size={18} /> },
    { id: 'settings' as const, label: 'Configuracoes', icon: <Settings size={18} /> },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          borderColor: 'var(--line)',
          background: 'color-mix(in srgb, var(--bg) 84%, transparent)',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="section-kicker">Fluxo pessoal</p>
            <h1 className="font-display text-base tracking-[-0.04em] text-(--text) sm:text-xl md:text-2xl">
              Gestao financeira offline
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: isOnline ? 'var(--good)' : 'var(--warn)' }}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? 'Conectado' : 'Sem conexao'}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-24 md:px-6 lg:px-8">
        <nav className="hidden glass-panel rounded-3xl p-2 sm:block">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToPage(item.id)}
                onPointerDown={activateRipple}
                className="pressable inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                style={{
                  background: page === item.id ? 'var(--accent)' : 'var(--panel-strong)',
                  color: page === item.id ? '#fff' : 'var(--text)',
                  border: '1px solid var(--line)',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <section className="glass-panel rounded-4xl p-4 md:p-6 page-enter">
          {page === 'dashboard' ? (
            <DashboardPage
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              monthLabel={formatMonth(selectedMonth)}
              metrics={{
                balance: formatMoney(balance),
                income: formatMoney(available),
                expenses: formatMoney(expenses),
                recurringExpenses: formatMoney(recurringExpensesTotal),
              }}
              trend={monthlyTrend}
              isDark={activeTheme === 'dark'}
              categorySummary={categorySummary}
              totalExpenses={Math.max(expenses, 1)}
              insights={insights}
            />
          ) : null}

          {page === 'entries' ? (
            <EntriesPage
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              form={entryForm}
              onFormChange={setEntryForm}
              availableCategories={availableCategories}
              onKindChange={(kind) => setEntryForm(getEntryDefaults(kind))}
              onSubmit={saveEntry}
              filterKind={filterKind}
              onFilterKindChange={setFilterKind}
              transactions={visibleTransactions}
              onRemove={removeEntry}
            />
          ) : null}

          {page === 'backup' ? (
            <BackupPage
              onExport={exportData}
              onImport={importData}
              onClear={clearData}
              totals={{
                entries: allTransactions.length,
                recurringEntries: allTransactions.filter((item) => item.isRecurring).length,
                fixedIncome: formatMoney(fixedIncome),
                month: formatMonth(selectedMonth),
              }}
            />
          ) : null}

          {page === 'settings' ? (
            <SettingsPage
              currentTheme={activeTheme}
              onToggleTheme={toggleTheme}
              onSaveMonthlyIncome={saveMonthlyIncome}
              monthlyIncome={String(fixedIncome)}
              isOnline={isOnline}
              themeIcon={activeTheme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            />
          ) : null}
        </section>

        {flash ? (
          <div
            className="glass-panel rounded-3xl px-4 py-3 text-sm font-semibold"
            style={{
              color:
                flash.tone === 'error'
                  ? 'var(--danger)'
                  : flash.tone === 'success'
                    ? 'var(--good)'
                    : 'var(--accent)',
            }}
          >
            {flash.text}
          </div>
        ) : null}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t sm:hidden"
        style={{
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          borderColor: 'var(--line)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="grid grid-cols-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goToPage(item.id)}
              className="flex flex-col items-center gap-1 py-3 text-xs font-semibold"
              style={{ color: page === item.id ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default App
