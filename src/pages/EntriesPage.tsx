import { ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import type { TransactionItem, TransactionKind } from '../lib/db'

type FilterKind = 'all' | TransactionKind

interface EntryFormState {
  kind: TransactionKind
  category: string
  amount: string
  date: string
  note: string
  isRecurring: boolean
}

interface EntriesPageProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  form: EntryFormState
  onFormChange: (next: EntryFormState) => void
  availableCategories: string[]
  onKindChange: (kind: TransactionKind) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  filterKind: FilterKind
  onFilterKindChange: (kind: FilterKind) => void
  transactions: TransactionItem[]
  onRemove: (id: number | undefined) => void
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

export function EntriesPage({
  selectedMonth,
  onMonthChange,
  form,
  onFormChange,
  availableCategories,
  onKindChange,
  onSubmit,
  filterKind,
  onFilterKindChange,
  transactions,
  onRemove,
}: EntriesPageProps) {
  const [showCategoryList, setShowCategoryList] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form data-reveal onSubmit={onSubmit} className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Pagina de lancamento</p>
        <h2 className="section-title mt-2">Criar registro de gasto ou entrada</h2>

        <div className="mt-4 grid gap-4">
          <label>
            <span className="field-label">Mes de analise</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              className="field-control"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">Tipo</span>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border p-1.5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                <button
                  type="button"
                  onClick={() => {
                    onKindChange('expense')
                    setShowCategoryList(false)
                  }}
                  className="pressable inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{
                    background: form.kind === 'expense' ? 'var(--danger)' : 'transparent',
                    color: form.kind === 'expense' ? '#fff' : 'var(--text)',
                  }}
                >
                  <ArrowDownRight size={16} />
                  Gasto
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onKindChange('income')
                    setShowCategoryList(false)
                  }}
                  className="pressable inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{
                    background: form.kind === 'income' ? 'var(--good)' : 'transparent',
                    color: form.kind === 'income' ? '#fff' : 'var(--text)',
                  }}
                >
                  <ArrowUpRight size={16} />
                  Entrada
                </button>
              </div>
            </div>

            <div>
              <span className="field-label">Categoria</span>
              <div className="space-y-2">
                <input
                  value={form.category}
                  onChange={(event) => onFormChange({ ...form, category: event.target.value })}
                  className="field-control"
                  placeholder="Escolha ou escreva uma categoria"
                />

                <button
                  type="button"
                  onClick={() => setShowCategoryList((prev) => !prev)}
                  className="pressable w-full rounded-xl border px-3 py-2 text-sm font-semibold"
                  style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text)' }}
                >
                  {showCategoryList ? 'Ocultar categorias pre-definidas' : 'Ver categorias pre-definidas'}
                </button>

                {showCategoryList ? (
                  <div className="grid max-h-36 grid-cols-2 gap-2 overflow-auto rounded-xl border p-2" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => onFormChange({ ...form, category })}
                        className="pressable rounded-lg border px-2.5 py-2 text-xs font-semibold"
                        style={{
                          borderColor: 'var(--line)',
                          background: form.category === category ? 'var(--accent)' : 'var(--panel-strong)',
                          color: form.category === category ? '#fff' : 'var(--text)',
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Valor</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => onFormChange({ ...form, amount: event.target.value })}
                className="field-control"
                inputMode="decimal"
              />
            </label>

            <label>
              <span className="field-label">Data</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => onFormChange({ ...form, date: event.target.value })}
                className="field-control"
              />
            </label>
          </div>

          {form.kind === 'expense' ? (
            <label className="inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(event) => onFormChange({ ...form, isRecurring: event.target.checked })}
              />
              Gasto fixo mensal (recorrente)
            </label>
          ) : null}

          <label>
            <span className="field-label">Observacao</span>
            <textarea
              rows={3}
              value={form.note}
              onChange={(event) => onFormChange({ ...form, note: event.target.value })}
              className="field-control resize-none"
            />
          </label>
        </div>

        <button
          type="submit"
          className="pressable mt-5 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: form.kind === 'expense' ? 'var(--danger)' : 'var(--good)' }}
        >
          Salvar {form.kind === 'expense' ? 'gasto' : 'entrada'}
        </button>
      </form>

      <section data-reveal className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Historico</p>
            <h3 className="section-title mt-2">Lancamentos do mes</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'expense', 'income'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onFilterKindChange(option)}
                className="pressable rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  background: filterKind === option ? 'var(--accent)' : 'var(--panel)',
                  color: filterKind === option ? '#fff' : 'var(--text)',
                  border: '1px solid var(--line)',
                }}
              >
                {option === 'all' ? 'Todos' : option === 'expense' ? 'Gastos' : 'Entradas'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <article
                key={`${item.id ?? item.createdAt}-${item.createdAt}`}
                data-reveal
                className="rounded-3xl border p-4"
                style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="chip"
                        style={{ color: item.kind === 'expense' ? 'var(--danger)' : 'var(--good)' }}
                      >
                        {item.kind === 'expense' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        {item.kind === 'expense' ? 'Gasto' : 'Entrada'}
                      </span>
                      {item.kind === 'expense' && item.isRecurring ? (
                        <span className="chip">Fixo mensal</span>
                      ) : null}
                      <span className="text-sm font-semibold text-(--text)">{item.category}</span>
                    </div>
                    <p className="mt-1 text-sm text-(--text-muted)">{item.note || 'Sem observacao'}</p>
                  </div>

                  <div className="flex items-start gap-3 sm:text-right">
                    <div>
                      <p
                        className="text-lg font-semibold"
                        style={{ color: item.kind === 'expense' ? 'var(--danger)' : 'var(--good)' }}
                      >
                        {item.kind === 'expense' ? '-' : '+'}
                        {moneyFormatter.format(item.amount)}
                      </p>
                      <p className="text-sm text-(--text-muted)">
                        {dateFormatter.format(new Date(`${item.date}T12:00:00`))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      disabled={typeof item.id !== 'number'}
                      className="pressable inline-flex rounded-2xl border p-3"
                      style={{
                        borderColor: 'var(--line)',
                        color: typeof item.id === 'number' ? 'var(--danger)' : 'var(--text-muted)',
                        opacity: typeof item.id === 'number' ? 1 : 0.55,
                        cursor: typeof item.id === 'number' ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed px-5 py-8 text-center" style={{ borderColor: 'var(--line)', color: 'var(--text-muted)' }}>
              Nenhum lancamento encontrado para o filtro atual.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
