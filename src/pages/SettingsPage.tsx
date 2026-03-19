import { Github, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Theme } from '../lib/db'

interface SettingsPageProps {
  currentTheme: Theme
  onToggleTheme: () => void
  onSaveMonthlyIncome: (value: string) => void
  monthlyIncome: string
  isOnline: boolean
  themeIcon: ReactNode
}

export function SettingsPage({
  currentTheme,
  onToggleTheme,
  onSaveMonthlyIncome,
  monthlyIncome,
  isOnline,
  themeIcon,
}: SettingsPageProps) {
  const [draftIncome, setDraftIncome] = useState(monthlyIncome)

  useEffect(() => {
    setDraftIncome(monthlyIncome)
  }, [monthlyIncome])

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Configuracoes</p>
        <h2 className="section-title mt-2">Preferencias do aplicativo</h2>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <p className="text-sm font-semibold text-(--text)">Tema</p>
            <p className="mt-1 text-sm text-(--text-muted)">
              Tema atual: {currentTheme === 'dark' ? 'Escuro' : 'Claro'}
            </p>
            <button
              type="button"
              onClick={onToggleTheme}
              className="pressable mt-3 inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
              style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)', color: 'var(--text)' }}
            >
              {themeIcon}
              Alternar tema
            </button>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
            <p className="text-sm font-semibold text-(--text)">Renda mensal fixa</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftIncome}
                onChange={(event) => setDraftIncome(event.target.value)}
                className="field-control"
                inputMode="decimal"
              />
              <button
                type="button"
                onClick={() => void onSaveMonthlyIncome(draftIncome)}
                className="pressable rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border p-5" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Offline</p>
        <h3 className="section-title mt-2">Status do dispositivo</h3>
        <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}>
          <div className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: isOnline ? 'var(--good)' : 'var(--warn)' }}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? 'Conectado' : 'Sem conexao'}
          </div>
          <p className="mt-2 text-sm text-(--text-muted)">
            O app funciona offline com cache local (PWA) e banco Dexie no navegador.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border p-5 lg:col-span-2" style={{ borderColor: 'var(--line)', background: 'var(--panel-strong)' }}>
        <p className="section-kicker">Sobre</p>
        <h3 className="section-title mt-2">Desenvolvedor</h3>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-(--text)">GCode-S</p>
            <p className="mt-1 text-sm text-(--text-muted)">Desenvolvedor do Fluxo Pessoal</p>
          </div>
          <a
            href="https://github.com/GCode-S/finances"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text)' }}
          >
            <Github size={16} />
            github.com/GCode-S/finances
          </a>
        </div>
      </section>
    </div>
  )
}
