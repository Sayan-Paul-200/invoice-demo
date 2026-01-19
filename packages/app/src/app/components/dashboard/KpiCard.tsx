import { Paper, Text, Group, ThemeIcon, rem } from '@mantine/core';
import { TablerIcon } from '@tabler/icons-react';

interface KpiCardProps {
  title: string;
  value: number;
  icon: TablerIcon;
  color: string;
}

export function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
  // Helper to format currency (Indian Rupee)
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0, 
    }).format(val);
  };

  return (
    <Paper withBorder p="md" radius="md" shadow="sm">
      <Group justify="space-between" align="center">
        {/* Left Side: Title and Value */}
        <div>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={4}>
            {title}
          </Text>
          <Text fw={700} size="lg" mt={12}>
            {formatCurrency(value)}
          </Text>
        </div>

        {/* Right Side: Icon with soft background box */}
        <ThemeIcon 
          color={color} 
          variant="light" 
          size={40} 
          radius="md"
        >
          <Icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}