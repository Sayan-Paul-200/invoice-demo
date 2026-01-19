import { useState, useMemo } from 'react';
import { 
  Table, 
  Checkbox, 
  ScrollArea, 
  Group, 
  Text, 
  Badge, 
  ActionIcon, 
  rem,
  UnstyledButton,
  Center
} from '@mantine/core';
import { 
  IconPencil, 
  IconTrash, 
  IconEye, 
  IconSelector, 
  IconChevronDown, 
  IconChevronUp 
} from '@tabler/icons-react';
import { Invoice } from '@lib/invoices';
import classes from './InvoiceTable.module.scss'; 

interface InvoiceTableProps {
  data: Invoice[];
  columns?: (keyof Invoice)[];
  actions?: boolean;
  dashboardTable?: boolean; 
  multiSelection?: boolean; 
  sort?: boolean;
  style?: React.CSSProperties;
  selection?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  // 👇 Added onEdit prop
  onEdit?: (invoice: Invoice) => void;
}

const DEFAULT_COLUMNS: (keyof Invoice)[] = [
  'invoiceNumber',
  'invoiceDate',
  'invoiceBasicAmount',
  'invoiceGstAmount',
  'totalAmount',
  'totalDeduction',
  'netPayable',
  'amountPaidByClient',
  'balancePendingAmount',
  'status',
];

const HEADER_LABELS: Partial<Record<keyof Invoice, string>> = {
  invoiceNumber: 'Invoice No',
  invoiceDate: 'Invoice Date',
  invoiceBasicAmount: 'Basic Amt',
  invoiceGstAmount: 'GST Amt',
  totalAmount: 'Total Amt',
  totalDeduction: 'Deduction',
  netPayable: 'Net Payable',
  amountPaidByClient: 'Paid',
  balancePendingAmount: 'Pending',
  status: 'Status',
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return 'teal';
    case 'Under Process': return 'blue';
    case 'Cancelled': return 'red';
    case 'Credit Note Issued': return 'yellow';
    default: return 'gray';
  }
};

const parseDate = (dateString: string) => new Date(dateString);

export function InvoiceTable({
  data,
  columns = DEFAULT_COLUMNS,
  actions = false,
  dashboardTable = false,
  multiSelection = false,
  sort = false,
  style,
  selection: controlledSelection,
  onSelectionChange,
  onEdit // Destructure new prop
}: InvoiceTableProps) {
  const [internalSelection, setInternalSelection] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<keyof Invoice | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  
  const currentSelection = controlledSelection !== undefined ? controlledSelection : internalSelection;

  const handleSelectionChange = (newSelection: number[]) => {
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    } else {
      setInternalSelection(newSelection);
    }
  };
  
  const filteredData = useMemo(() => {
    let processedData = [...data];

    if (dashboardTable) {
      processedData.sort((a, b) => parseDate(b.invoiceDate).getTime() - parseDate(a.invoiceDate).getTime());
      processedData = processedData.slice(0, 10);
    }

    return processedData;
  }, [data, dashboardTable]);

  const sortedData = useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (sortBy.toLowerCase().includes('date')) {
             return reverseSortDirection 
                ? parseDate(valueA).getTime() - parseDate(valueB).getTime() 
                : parseDate(valueB).getTime() - parseDate(valueA).getTime();
        }
        return reverseSortDirection 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return reverseSortDirection ? valueA - valueB : valueB - valueA;
      }

      return 0;
    });
  }, [filteredData, sortBy, reverseSortDirection]);

  const toggleRow = (id: number) => {
    const newSelection = currentSelection.includes(id) 
      ? currentSelection.filter((item) => item !== id) 
      : [...currentSelection, id];
    handleSelectionChange(newSelection);
  };

  const toggleAll = () => {
    const newSelection = currentSelection.length === sortedData.length 
      ? [] 
      : sortedData.map((item) => item.slNo);
    handleSelectionChange(newSelection);
  };

  const setSorting = (field: keyof Invoice) => {
    if (!sort) return;
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const rows = sortedData.map((item) => {
    const isSelected = currentSelection.includes(item.slNo);

    return (
      <Table.Tr key={item.slNo} bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}>
        {multiSelection && (
          <Table.Td>
            <Checkbox checked={isSelected} onChange={() => toggleRow(item.slNo)} />
          </Table.Td>
        )}

        {columns.map((col) => (
          <Table.Td key={col} bg={sortBy === col ? 'var(--mantine-color-blue-light)' : undefined}>
            {col === 'status' ? (
              <Badge color={getStatusColor(item.status)} variant="light">
                {item.status}
              </Badge>
            ) : typeof item[col] === 'number' && ((col as string).toLowerCase().includes('amount') || (col as string).includes('Deduction') || (col as string).includes('Payable')) ? (
              <Text size="xs">{formatCurrency(item[col] as number)}</Text>
            ) : (
              <Text size="xs">{item[col]}</Text>
            )}
          </Table.Td>
        ))}

        {actions && (
          <Table.Td>
            <Group justify='space-between' wrap="nowrap">
              <ActionIcon variant="filled" color="gray">
                <IconEye style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
              </ActionIcon>
              {/* 👇 Updated Pencil Icon with onEdit click handler */}
              <ActionIcon variant="filled" color="blue" onClick={() => onEdit?.(item)}>
                <IconPencil style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
              </ActionIcon>
              <ActionIcon variant="filled" color="red">
                <IconTrash style={{ width: rem(18), height: rem(18) }} stroke={1.5} />
              </ActionIcon>
            </Group>
          </Table.Td>
        )}
      </Table.Tr>
    );
  });

  return (
    <ScrollArea>
      <Table verticalSpacing="sm" striped highlightOnHover withColumnBorders withTableBorder style={style}>
        <Table.Thead>
          <Table.Tr>
            {multiSelection && (
              <Table.Th style={{ width: rem(40) }} >
                <Checkbox
                  onChange={toggleAll}
                  checked={currentSelection.length === sortedData.length && sortedData.length > 0}
                  indeterminate={currentSelection.length > 0 && currentSelection.length !== sortedData.length}
                />
              </Table.Th>
            )}

            {columns.map((col) => (
              <Table.Th key={col} bg={sortBy === col ? 'var(--mantine-color-blue-light)' : undefined}>
                {sort ? (
                   <UnstyledButton onClick={() => setSorting(col)} className={classes.control} w={"100%"}>
                   <Group justify="space-between">
                     <Text fw={700} size="sm">{HEADER_LABELS[col] || col}</Text>
                     <Center className={classes.icon}>
                       {sortBy === col ? (
                         reverseSortDirection ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
                       ) : (
                         <IconSelector style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
                       )}
                     </Center>
                   </Group>
                 </UnstyledButton>
                ) : (
                    <Text fw={700} size="sm">{HEADER_LABELS[col] || col}</Text>
                )}
              </Table.Th>
            ))}

            {actions && <Table.Th><Text fw={700} size="sm">Actions</Text></Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}