import { useMemo } from 'react';
import { Paper, Stack, Group, Text, Divider, Title } from '@mantine/core';
import { Invoice } from '@lib/invoices';

interface DeductionsBoxProps {
  invoices: Invoice[];
}

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export function DeductionsBox({ invoices }: DeductionsBoxProps) {
  // Calculate Deduction Summary
  const deductionStats = useMemo(() => {
    return invoices.reduce((acc, inv) => ({
      tds: acc.tds + (inv.tds || 0),
      bocw: acc.bocw + (inv.bocw || 0),
      retention: acc.retention + (inv.retention || 0),
      gstWithheld: acc.gstWithheld + (inv.gstWithheld || 0),
      gstTds: acc.gstTds + (inv.gstTds || 0),
      lowDepthDeduction: acc.lowDepthDeduction + (inv.lowDepthDeduction || 0),
      ld: acc.ld + (inv.ld || 0),
      slaPenalty: acc.slaPenalty + (inv.slaPenalty || 0),
      penalty: acc.penalty + (inv.penalty || 0),
      otherDeduction: acc.otherDeduction + (inv.otherDeduction || 0),
      totalDeduction: acc.totalDeduction + (inv.totalDeduction || 0),
    }), {
      tds: 0, bocw: 0, retention: 0, gstWithheld: 0, gstTds: 0, 
      lowDepthDeduction: 0, ld: 0, slaPenalty: 0, penalty: 0, 
      otherDeduction: 0, totalDeduction: 0
    });
  }, [invoices]);

  return (
    <Paper withBorder p="md" radius="md" shadow="sm" h="100%">
      <Stack justify="space-between" h="100%">
        <div>
          <Group justify="space-between" mb="md">
            {/* <Text fw={600} c="dimmed">DEDUCTIONS</Text> */}
            <Title order={5} mb="lg" ta="center">DEDUCTIONS</Title>
          </Group>
          
          <Stack gap="xs">
            <DeductionRow label="TDS" value={deductionStats.tds} />
            <DeductionRow label="BOCW" value={deductionStats.bocw} />
            <DeductionRow label="Retention" value={deductionStats.retention} />
            <DeductionRow label="GST Withheld" value={deductionStats.gstWithheld} />
            <DeductionRow label="GST TDS" value={deductionStats.gstTds} />
            <DeductionRow label="Low Depth Deduction" value={deductionStats.lowDepthDeduction} />
            <DeductionRow label="LD" value={deductionStats.ld} />
            <DeductionRow label="SLA Penalty" value={deductionStats.slaPenalty} />
            <DeductionRow label="Penalty" value={deductionStats.penalty} />
            <DeductionRow label="Other Deduction" value={deductionStats.otherDeduction} />
          </Stack>
        </div>

        <div>
          <Divider my="sm" />
          <Group justify="space-between">
            <Text fw={700}>Total Deduction</Text>
            <Text fw={700}>{formatCurrency(deductionStats.totalDeduction)}</Text>
          </Group>
        </div>
      </Stack>
    </Paper>
  );
}

function DeductionRow({ label, value }: { label: string, value: number }) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="xs" fw={500}>{formatCurrency(value)}</Text>
    </Group>
  );
}