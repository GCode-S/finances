import { CloudUpload, Download, Trash2 } from 'lucide-react'
import type { ChangeEvent } from 'react'

interface BackupPageProps {
  onExport: () => void
  onImport: (event: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  totals: {
    entries: number
    recurringEntries: number
    fixedIncome: string
    month: string
  }
}

export function BackupPage({ onExport, onImport, onClear, totals }: BackupPageProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Pagina de backup</p>
        <h2 className="section-title mt-2">Exportar e restaurar dados</h2>
        <p className="mt-3 text-sm text-(--text-muted)">
          O arquivo inclui configuracoes, lancamentos e dados legados de gastos fixos.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={onExport}
            className="pressable inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Download size={16} />
            Exportar JSON
          </button>

          <label
            className="pressable inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text)' }}
          >
            <CloudUpload size={16} />
            Importar JSON
            <input
              type="file"
              accept="application/json"
              onChange={(event) => onImport(event)}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onClear}
            className="pressable inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}
          >
            <Trash2 size={16} />
            Apagar todos os dados
          </button>
        </div>
      </section>

      <section className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Resumo</p>
        <h3 className="section-title mt-2">Estado atual dos dados</h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatTile label="Renda fixa" value={totals.fixedIncome} />
          <StatTile label="Lancamentos" value={String(totals.entries)} />
          <StatTile label="Recorrentes" value={String(totals.recurringEntries)} />
          <StatTile label="Mes ativo" value={totals.month} />
        </div>
      </section>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
      <p className="text-sm font-semibold text-(--text-muted)">{label}</p>
      <p className="mt-2 text-lg font-semibold text-(--text)">{value}</p>
    </article>
  )
}
