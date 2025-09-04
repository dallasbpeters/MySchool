"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive line chart showing completed assignments per child"

export function ChartLineInteractive() {
  const [chartData, setChartData] = React.useState<Record<string, unknown>[]>([])
  const [children, setChildren] = React.useState<string[]>([])
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({})
  const [activeChart, setActiveChart] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string>("")

  React.useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assignments/chart-data')
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setChartData(data.chartData || [])
      setChildren(data.children || [])
      setChartConfig(data.chartConfig || {})

      // Set first child as active chart by default
      if (data.children && data.children.length > 0) {
        setActiveChart(data.children[0])
      }
    } catch (error) {
      setError('Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const total = React.useMemo(() => {
    const totals: { [key: string]: number } = {}
    children.forEach(child => {
      totals[child] = chartData.reduce((acc, curr) => acc + (curr[child] || 0), 0)
    })
    return totals
  }, [chartData, children])

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">No children found. Add children to see their assignment progress.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex flex-col items-stretch border-b pb-4 mb-4 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1">
          <h3 className="text-lg font-semibold">Assignment Progress</h3>
          <p className="text-sm text-muted-foreground">
            Showing completed assignments for the last 7 days
          </p>
        </div>
        <div className="flex mt-4 sm:mt-0 overflow-x-auto">
          {children.map((child) => (
            <button
              key={child}
              data-active={activeChart === child}
              className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-6 min-w-[120px]"
              onClick={() => setActiveChart(child)}
            >
              <span className="text-muted-foreground text-xs">
                {child}
              </span>
              <span className="text-lg leading-none font-bold sm:text-2xl">
                {total[child] || 0}
              </span>
              <span className="text-xs text-muted-foreground">completed</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <ChartContainer
          config={chartConfig}
          className="h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 12,
              left: 12,
              right: 12,
              bottom: 4,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  nameKey="assignments"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={{
                fill: `var(--color-${activeChart})`,
                strokeWidth: 2,
                r: 4,
              }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  )
}
