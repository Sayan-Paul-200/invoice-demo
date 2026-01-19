import { useMemo } from 'react';
import { Paper, Title } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { Invoice } from '@lib/invoices';

interface InvoiceStateBarChartProps {
  invoices: Invoice[];
}

export function InvoiceStateBarChart({ invoices }: InvoiceStateBarChartProps) {
  // Prepare Bar Chart Data (State-wise Total Amount)
  const chartData = useMemo(() => {
    const stateMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (!stateMap[inv.state]) stateMap[inv.state] = 0;
      stateMap[inv.state] += inv.totalAmount || 0;
    });
    return Object.keys(stateMap).map(state => ({
      state: state,
      Amount: stateMap[state]
    }));
  }, [invoices]);

  return (
    <Paper withBorder p="md" radius="md" shadow="sm" h="100%">
      <Title order={5} mb="lg" ta="center">Invoice State-wise Total Amount</Title>
      <BarChart
        h={350}
        data={chartData}
        dataKey="state"
        series={[{ name: 'Amount', color: 'blue.6' }]}
        tickLine="y"
        gridAxis="xy"
        tooltipAnimationDuration={200}
        valueFormatter={(value) => new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value)}
      />
    </Paper>
  );
}