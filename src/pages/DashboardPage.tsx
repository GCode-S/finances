import { ArrowDownRight, Banknote, Pencil, PiggyBank, Sparkles, Wallet, X } from 'lucide-react'
import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ExpensePieChart } from '../components/ExpensePieChart'
import { MonthlyChart, type MonthPoint } from '../components/MonthlyChart'
import type { MonthlyScore } from '../lib/db'

export interface DashboardInsight {
  title: string
  body: string
}

interface CategorySlice {
  category: string
  amount: number
}

interface DashboardPageProps {
  selectedMonth: string
  onMonthChange: (month: string) => void
  monthLabel: string
  metrics: {
    balance: string
    income: string
    expenses: string
    recurringExpenses: string
  }
  trend: MonthPoint[]
  isDark: boolean
  categorySummary: CategorySlice[]
  totalExpenses: number
  insights: DashboardInsight[]
  financialHealth: {
    balance: number
    income: number
    expenses: number
  }
  score: number
  scoreHistory: MonthlyScore[]
  monthlyIncome: number
  onSaveMonthlyIncome: (value: string) => void
}

export function DashboardPage({
  selectedMonth,
  onMonthChange,
  monthLabel,
  metrics,
  trend,
  isDark,
  categorySummary,
  totalExpenses,
  insights,
  financialHealth,
  score,
  scoreHistory,
  monthlyIncome,
  onSaveMonthlyIncome,
}: DashboardPageProps) {
  const [simulatedExpense, setSimulatedExpense] = useState('')
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [draftIncome, setDraftIncome] = useState(String(monthlyIncome || ''))
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!showIncomeModal) {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowIncomeModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showIncomeModal])

  const simulation = useMemo(() => {
    const parsed = Number(simulatedExpense)
    const simulatedAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
    const projectedBalance = financialHealth.balance - simulatedAmount
    const commitmentRate =
      (financialHealth.expenses + simulatedAmount) / Math.max(financialHealth.income, 1)

    const impact =
      commitmentRate > 1
        ? {
            title: 'Impacto alto na saude financeira',
            body: 'Com esse gasto, suas saidas superam as entradas do mes. Priorize cortar despesas antes de confirmar esse valor.',
          }
        : commitmentRate > 0.8
          ? {
              title: 'Impacto moderado na saude financeira',
              body: 'O gasto cabe no mes, mas reduz sua margem de seguranca. Reavalie itens variaveis antes de decidir.',
            }
          : {
              title: 'Impacto baixo na saude financeira',
              body: 'Seu planejamento mensal absorve bem esse gasto. Mantendo disciplina, a saude financeira continua estavel.',
            }

    const suggestedReserve = Math.max(projectedBalance * 0.2, 0)
    const motivation =
      projectedBalance > 0
        ? `Se guardar ${suggestedReserve.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deste saldo, voce acelera sua reserva e fortalece o proximo mes.`
        : 'Ajuste pequenos gastos recorrentes e recupere saldo positivo. Cada reducao mensal vira folego para sua reserva.'

    return {
      simulatedAmount,
      projectedBalance,
      impact,
      motivation,
    }
  }, [financialHealth.balance, financialHealth.expenses, financialHealth.income, simulatedExpense])

  const scoreMood = useMemo(() => {
    if (score >= 780) {
      return {
        emoji: '😄',
        label: 'Fase muito forte',
        tone: 'var(--good)',
        body: 'Seu dinheiro esta trabalhando a seu favor. Continue reservando e mantendo folga no mes.',
      }
    }

    if (score >= 520) {
      return {
        emoji: '🙂',
        label: 'Boa estabilidade',
        tone: 'var(--accent)',
        body: 'Voce esta construindo consistencia. Pequenos aportes extras podem levar seu score para outro nivel.',
      }
    }

    if (score >= 280) {
      return {
        emoji: '😐',
        label: 'Atencao no ritmo',
        tone: 'var(--warn)',
        body: 'Ainda existe margem para reagir. Reforce a categoria de reserva e reduza gastos variaveis.',
      }
    }

    return {
      emoji: '😟',
      label: 'Zona de pressao',
      tone: 'var(--danger)',
      body: 'Seu fluxo do mes esta apertado. Cortes rapidos e uma reserva minima ajudam a recuperar folego.',
    }
  }, [score])

  const scorePercent = Math.max(0, Math.min(100, (score / 1000) * 100))

  function trapModalTab(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !modalRef.current) {
      return
    }

    const focusableElements = Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('disabled'))

    if (focusableElements.length === 0) {
      return
    }

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    const active = document.activeElement

    if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    }
  }

  return (
    <div className="grid gap-6">
      <section data-reveal className="hero-panel rounded-3xl border p-5 md:p-7" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-kicker">Pagina principal</p>
            <h2 className="section-title mt-2">Dashboard da sua saude financeira</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="chip gap-3">
              <span>Mes analisado</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => onMonthChange(event.target.value)}
                className="bg-transparent text-sm font-semibold text-(--text) outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => { setDraftIncome(String(monthlyIncome || '')); setShowIncomeModal(true) }}
              className="chip pressable gap-2.5"
              style={monthlyIncome > 0 ? { borderColor: 'var(--good)', color: 'var(--good)' } : { borderColor: 'var(--warn)', color: 'var(--warn)' }}
            >
              <Banknote size={14} />
              <span className="text-sm font-semibold">
                {monthlyIncome > 0
                  ? monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'Definir renda'}
              </span>
              <Pencil size={11} className="opacity-60" />
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-(--text-muted)">{monthLabel}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Saldo"
            value={metrics.balance}
            hint="Disponivel no mes"
            icon={<Wallet size={18} />}
            accent="var(--good)"
          />
          {/* <MetricCard
            title="Entradas"
            value={metrics.income}
            hint="Renda fixa + variavel"
            icon={<ArrowUpRight size={18} />}
            accent="var(--good)"
          /> */}
          <MetricCard
            title="Saidas"
            value={metrics.expenses}
            hint="Recorrentes + pontuais"
            icon={<ArrowDownRight size={18} />}
            accent="var(--danger)"
          />
          <MetricCard
            title="Gastos fixos"
            value={metrics.recurringExpenses}
            hint="Aplicados todo mes"
            icon={<PiggyBank size={18} />}
            accent="var(--warn)"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.2rem] border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">Simulacao de gasto</p>
            <label className="mt-3 block">
              <span className="field-label">Valor que deseja gastar</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={simulatedExpense}
                onChange={(event) => setSimulatedExpense(event.target.value)}
                className="field-control"
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
            <p className="mt-3 text-sm font-semibold text-(--text)">{simulation.impact.title}</p>
            <p className="mt-2 text-sm text-(--text-muted)">{simulation.impact.body}</p>
            <p className="mt-3 text-sm text-(--text)">
              Saldo projetado:{' '}
              <span className="font-semibold" style={{ color: simulation.projectedBalance >= 0 ? 'var(--good)' : 'var(--danger)' }}>
                {simulation.projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </p>
          </article>

          <article className="rounded-[1.2rem] border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">Motivacao de economia</p>
            <h3 className="mt-3 text-lg font-semibold text-(--text)">Seu futuro financeiro melhora com constancia</h3>
            <p className="mt-2 text-sm text-(--text-muted)">{simulation.motivation}</p>
            <p className="mt-3 text-sm text-(--text-muted)">
              Pequenos aportes recorrentes criam estabilidade para emergencias e liberdade para metas maiores.
            </p>
          </article>
        </div>
      </section>

      <section data-reveal className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article data-reveal className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
          <h3 className="section-title">Graficos</h3>
          <p className="mt-2 text-sm text-(--text-muted)">Comparativo dos ultimos meses</p>
          <div className="mt-5">
            <MonthlyChart data={trend} isDark={isDark} />
          </div>
        </article>

        <article data-reveal className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
          <h3 className="section-title">Representacoes rapidas</h3>
          <p className="mt-2 text-sm text-(--text-muted)">Distribuicao das saidas por categoria</p>
          <div className="mt-4">
            {categorySummary.length > 0 ? <ExpensePieChart data={categorySummary} isDark={isDark} /> : null}
          </div>
          <div className="mt-4 space-y-3">
            {categorySummary.length > 0 ? (
              categorySummary.map((item) => {
                const width = Math.max((item.amount / totalExpenses) * 100, 8)

                return (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-semibold text-(--text)">{item.category}</span>
                      <span className="text-(--text-muted)">{item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-muted)_14%,transparent)]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),color-mix(in_srgb,var(--accent)_40%,white))] category-fill-animate"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-(--text-muted)">Sem dados de categorias no periodo.</p>
            )}
          </div>
        </article>
      </section>

      {showIncomeModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden p-4 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="income-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowIncomeModal(false) }}
        >
          <div
            ref={modalRef}
            onKeyDown={trapModalTab}
            className="modal-enter max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border p-5 sm:p-6"
            style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex rounded-xl p-2.5"
                  style={{ background: 'color-mix(in srgb, var(--good) 14%, transparent)', color: 'var(--good)' }}
                >
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 id="income-modal-title" className="text-lg font-semibold text-(--text)">Renda mensal fixa</h3>
                  <p className="text-xs text-(--text-muted)">Valor recebido todo mes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="pressable ml-3 shrink-0 rounded-xl p-1.5"
                style={{ background: 'var(--panel)', color: 'var(--text-muted)' }}
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm text-(--text-muted) leading-relaxed">
              Informe o valor que voce recebe mensalmente. Ele sera usado para calcular seu saldo,
              saude financeira e graficos comparativos.
            </p>

            <div className="mt-5">
              <label>
                <p className="field-label">Valor em reais (R$)</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draftIncome}
                  onChange={(e) => setDraftIncome(e.target.value)}
                  className="field-control"
                  inputMode="decimal"
                  placeholder="Ex: 3500,00"
                  autoFocus
                />
              </label>
              {monthlyIncome > 0 && (
                <p className="mt-2 text-xs text-(--text-muted)">
                  Valor atual:{' '}
                  <span className="font-semibold" style={{ color: 'var(--good)' }}>
                    {monthlyIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="pressable flex-1 rounded-2xl border py-3 text-sm font-semibold text-(--text)"
                style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { void onSaveMonthlyIncome(draftIncome); setShowIncomeModal(false) }}
                className="pressable flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                Salvar renda
              </button>
            </div>
          </div>
        </div>
      )}

      <section data-reveal className="grid gap-3 md:grid-cols-3">
        {insights.map((item) => (
          <article key={item.title} data-reveal className="rounded-3xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
            <h4 className="text-sm font-semibold text-(--accent)">Insight</h4>
            <p className="mt-2 font-semibold text-(--text)">{item.title}</p>
            <p className="mt-2 text-sm text-(--text-muted)">{item.body}</p>
          </article>
        ))}
      </section>

      <section data-reveal className="rounded-3xl border p-5 md:p-6" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Score mensal</p>
            <h3 className="section-title mt-2">Pontuacao de saude financeira</h3>
            <p className="mt-3 text-sm leading-relaxed text-(--text-muted)">
              Seu score vai de 0 a 1000. Ele sobe quando sobra dinheiro no mes e quando voce direciona parte dos gastos para reserva.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-3 self-start rounded-2xl border px-4 py-3"
            style={{ borderColor: 'color-mix(in srgb, var(--line) 68%, transparent)', background: 'var(--panel)' }}
          >
            <span className="text-3xl animate-[page-enter_320ms_ease]">{scoreMood.emoji}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">Status</p>
              <p className="text-sm font-semibold" style={{ color: scoreMood.tone }}>{scoreMood.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.4rem] border p-4 sm:p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">Score atual</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-[-0.04em] text-(--text)">{score}</span>
                  <span className="pb-1 text-sm font-semibold text-(--text-muted)">/ 1000</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold" style={{ background: 'color-mix(in srgb, var(--panel-strong) 78%, transparent)', color: scoreMood.tone }}>
                <Sparkles size={16} />
                {scoreMood.label}
              </div>
            </div>

            <div className="mt-5 h-4 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text-muted)_16%,transparent)]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${scorePercent}%`,
                  background: score >= 780
                    ? 'linear-gradient(90deg, color-mix(in srgb, var(--good) 88%, white), var(--good))'
                    : score >= 520
                      ? 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 76%, white), var(--accent))'
                      : score >= 280
                        ? 'linear-gradient(90deg, color-mix(in srgb, var(--warn) 78%, white), var(--warn))'
                        : 'linear-gradient(90deg, color-mix(in srgb, var(--danger) 72%, white), var(--danger))',
                }}
              />
            </div>

            <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
              <span>0</span>
              <span>250</span>
              <span>500</span>
              <span>750</span>
              <span>1000</span>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-(--text-muted)">{scoreMood.body}</p>
          </article>

          <article className="rounded-[1.4rem] border p-4 sm:p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--text-muted)">Historico recente</p>
            <div className="mt-4 space-y-3">
              {scoreHistory.length > 0 ? (
                scoreHistory.map((entry) => (
                  <div key={entry.month} className="flex items-center justify-between rounded-2xl border px-3 py-3" style={{ borderColor: 'color-mix(in srgb, var(--line) 72%, transparent)', background: 'color-mix(in srgb, var(--panel-strong) 76%, transparent)' }}>
                    <div>
                      <p className="text-sm font-semibold text-(--text)">{entry.month}</p>
                      <p className="mt-1 text-xs text-(--text-muted)">Pontuacao salva do periodo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold" style={{ color: entry.score >= 520 ? 'var(--good)' : entry.score >= 280 ? 'var(--warn)' : 'var(--danger)' }}>
                        {entry.score}
                      </p>
                      <p className="text-xs text-(--text-muted)">de 1000</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-(--text-muted)">O score sera salvo automaticamente a cada mes analisado.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  hint: string
  icon: ReactNode
  accent: string
}

function MetricCard({ title, value, hint, icon, accent }: MetricCardProps) {
  return (
    <article
      data-reveal
      className="rounded-2xl border p-3"
      style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}
    >
      <div
        className="mb-3 inline-flex rounded-lg p-1.5"
        style={{
          background: 'color-mix(in srgb, var(--panel) 72%, transparent)',
          color: accent,
        }}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">{title}</p>
      <p className="mt-1.5 text-xl font-semibold tracking-[-0.02em] text-(--text)">{value}</p>
      <p className="mt-1 text-xs text-(--text-muted)">{hint}</p>
    </article>
  )
}
