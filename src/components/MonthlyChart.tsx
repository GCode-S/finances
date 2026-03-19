import { useEffect, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface MonthPoint {
  month: string
  label: string
  income: number
  expenses: number
}

interface Props {
  data: MonthPoint[]
  isDark: boolean
}

const currencyCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

interface TooltipEntry {
  dataKey?: string | number
  value?: number
  fill?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

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
      <p
        style={{
          fontWeight: 700,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {String(label)}
      </p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          style={{ fontSize: 13, color: entry.fill, marginBottom: 3, fontWeight: 600 }}
        >
          {entry.dataKey === 'income' ? 'Entradas' : 'Saidas'}:{' '}
          {currencyCompact.format(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  )
}

function formatYAxis(value: number) {
  if (value === 0) return 'R$0'
  if (value >= 1000) {
    const k = value / 1000
    return `R$${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `R$${value}`
}

export function MonthlyChart({ data, isDark }: Props) {
  const incomeColor = isDark ? '#6ee7b7' : '#047857'
  const expenseColor = isDark ? '#fb7185' : '#be123c'
  const gridColor = isDark ? 'rgba(167,181,205,0.1)' : 'rgba(105,86,70,0.1)'
  const tickColor = isDark ? '#9fb0c7' : '#5d6778'
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [animationSeed, setAnimationSeed] = useState(0)

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
    <div ref={chartRef}>
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        key={animationSeed}
        data={data}
        barGap={3}
        barCategoryGap="30%"
        margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: tickColor }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: tickColor }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: gridColor }} />
        <Bar
          dataKey="income"
          name="income"
          fill={incomeColor}
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          animationBegin={120}
        />
        <Bar
          dataKey="expenses"
          name="expenses"
          fill={expenseColor}
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          isAnimationActive
          animationDuration={1050}
          animationEasing="ease-out"
          animationBegin={210}
        />
      </BarChart>
    </ResponsiveContainer>
    </div>
  )
}
