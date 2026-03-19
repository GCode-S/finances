import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { MonthlyChart, type MonthPoint } from '../components/MonthlyChart'

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
}: DashboardPageProps) {
  return (
    <div className="grid gap-6">
      <section className="hero-panel rounded-3xl border p-5 md:p-7" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-kicker">Pagina principal</p>
            <h2 className="section-title mt-2">Dashboard da sua saude financeira</h2>
          </div>

          <label className="chip gap-3">
            <span>Mes analisado</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              className="bg-transparent text-sm font-semibold text-(--text) outline-none"
            />
          </label>
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
          <MetricCard
            title="Entradas"
            value={metrics.income}
            hint="Renda fixa + variavel"
            icon={<ArrowUpRight size={18} />}
            accent="var(--good)"
          />
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
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
          <h3 className="section-title">Graficos</h3>
          <p className="mt-2 text-sm text-(--text-muted)">Comparativo dos ultimos meses</p>
          <div className="mt-5">
            <MonthlyChart data={trend} isDark={isDark} />
          </div>
        </article>

        <article className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
          <h3 className="section-title">Representacoes rapidas</h3>
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
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),color-mix(in_srgb,var(--accent)_40%,white))]"
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

      <section className="grid gap-3 md:grid-cols-3">
        {insights.map((item) => (
          <article key={item.title} className="rounded-3xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
            <h4 className="text-sm font-semibold text-(--accent)">Insight</h4>
            <p className="mt-2 font-semibold text-(--text)">{item.title}</p>
            <p className="mt-2 text-sm text-(--text-muted)">{item.body}</p>
          </article>
        ))}
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
      className="rounded-[1.2rem] border p-4"
      style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}
    >
      <div
        className="mb-4 inline-flex rounded-xl p-2"
        style={{
          background: 'color-mix(in srgb, var(--panel) 72%, transparent)',
          color: accent,
        }}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-(--text)">{value}</p>
      <p className="mt-1 text-sm text-(--text-muted)">{hint}</p>
    </article>
  )
}
