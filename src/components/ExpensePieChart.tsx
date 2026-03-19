import { useEffect, useMemo, useRef, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface CategorySlice {
  category: string
  amount: number
}

interface Props {
  data: CategorySlice[]
  isDark: boolean
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const palette = [
  'var(--accent)',
  'var(--good)',
  'var(--warn)',
  'var(--danger)',
  'color-mix(in srgb, var(--accent) 70%, var(--good))',
  'color-mix(in srgb, var(--warn) 68%, var(--danger))',
  'color-mix(in srgb, var(--accent) 58%, var(--warn))',
  'color-mix(in srgb, var(--good) 58%, var(--danger))',
  'color-mix(in srgb, var(--good) 72%, var(--warn))',
  'color-mix(in srgb, var(--danger) 48%, var(--accent))',
]

function buildDynamicColor(index: number, isDark: boolean) {
  const hue = (index * 137.508) % 360
  const saturation = 68 + (index % 3) * 6
  const lightness = isDark ? 64 - (index % 2) * 8 : 48 + (index % 2) * 7
  return `hsl(${hue.toFixed(0)} ${saturation}% ${lightness}%)`
}

interface TooltipEntry {
  name?: string
  value?: number
  payload?: CategorySlice
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
}

function PieTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]

  return (
    <div
      style={{
        background: 'var(--panel-strong)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
        {entry.name}
      </p>
      <p className="mt-1 text-sm font-semibold text-(--text)">{currency.format(Number(entry.value ?? 0))}</p>
    </div>
  )
}

export function ExpensePieChart({ data, isDark }: Props) {
  const labelColor = isDark ? '#9fb0c7' : '#5d6778'
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [animationSeed, setAnimationSeed] = useState(0)
  const colors = useMemo(() => {
    return data.map((_, index) => {
      if (index < palette.length) {
        return palette[index]
      }

      return buildDynamicColor(index - palette.length, isDark)
    })
  }, [data, isDark])

  useEffect(() => {
    const node = chartRef.current

    if (!node) {
      return
    }

    let active = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6 && !active) {
          setAnimationSeed((prev) => prev + 1)
          active = true
        }

        if (entry.intersectionRatio < 0.2) {
          active = false
        }
      },
      {
        threshold: [0, 0.2, 0.6, 0.8],
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={chartRef} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart key={animationSeed}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={78}
            innerRadius={46}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
            animationBegin={140}
            animationDuration={980}
            animationEasing="ease-out"
          >
            {data.map((item, index) => (
              <Cell key={`${item.category}-${item.amount}`} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.category} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2" style={{ color: labelColor }}>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: colors[index] }}
              />
              {item.category}
            </span>
            <span className="font-semibold text-(--text)">{currency.format(item.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
