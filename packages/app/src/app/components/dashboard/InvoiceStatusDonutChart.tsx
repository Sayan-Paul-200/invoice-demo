import { useMemo } from 'react';
import { Paper, Title, Text, Group, Stack, ColorSwatch, useMantineTheme } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { Invoice } from '@lib/invoices';

interface InvoiceStatusDonutChartProps {
  invoices: Invoice[];
}

export function InvoiceStatusDonutChart({ invoices }: InvoiceStatusDonutChartProps) {
  const theme = useMantineTheme();

  // 1. Prepare Donut Chart Data (Status-wise)
  const { chartData, totalValue } = useMemo(() => {
    const statusMap: Record<string, number> = {};
    let total = 0;

    invoices.forEach((inv) => {
      if (!statusMap[inv.status]) statusMap[inv.status] = 0;
      const amount = inv.totalAmount || 0;
      statusMap[inv.status] += amount;
      total += amount;
    });
    
    // Mapping status to Mantine theme colors
    const colors: Record<string, string> = {
      'Paid': 'teal.6',
      'Under Process': 'blue.6',
      'Cancelled': 'red.6',
      'Credit Note Issued': 'yellow.6'
    };

    const data = Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status],
      color: colors[status] || 'gray.6'
    }));

    // Sort by value desc to look nicer in legend
    data.sort((a, b) => b.value - a.value);

    return { chartData: data, totalValue: total };
  }, [invoices]);

  // Helper to format large currency numbers compactly
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <Paper withBorder p="md" radius="md" shadow="sm" h="100%">
      <Title order={5} mb="lg" ta="center">Invoice Status-wise Distribution</Title>
      
      {/* Chart Container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '20px' }}>
        <DonutChart
          data={chartData}
          withLabelsLine={false} 
          withLabels={false}
          paddingAngle={3}
          size={200}
          thickness={30}
          tooltipDataSource="segment"
          valueFormatter={(val) => formatCurrency(val)} // Fixed: Formats tooltip values
        />
      </div>

      {/* Custom Legend Section */}
      <Stack gap="sm" mt="md">
        {chartData.map((item) => {
          const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
          
          return (
            <Group key={item.name} justify="space-between" align="center">
              {/* Left: Color Dot + Label */}
              <Group gap="xs">
                <ColorSwatch color={theme.colors[item.color.split('.')[0]][6]} size={10} />
                <Text size="sm" fw={500} c="dimmed">
                  {item.name}
                </Text>
              </Group>

              {/* Right: Value + Percentage */}
              <Group gap="xs">
                <Text size="sm" fw={600}>
                  {formatCurrency(item.value)}
                </Text>
                <Text size="sm" c="dimmed" style={{ minWidth: '45px', textAlign: 'right' }}>
                  {percentage}%
                </Text>
              </Group>
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}