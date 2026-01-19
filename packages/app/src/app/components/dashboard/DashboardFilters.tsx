import { useState, useEffect } from 'react';
import { Group, Select, Paper, Button } from '@mantine/core'; // Added Button
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';
import { IconCalendar, IconFilterOff } from '@tabler/icons-react'; // Added IconFilterOff
import '@mantine/dates/styles.css';

export interface FilterState {
  project: string | null;
  state: string | null;
  status: string | null;
  billCategory: string | null;
  dateRange: [Date | null, Date | null];
}

interface DashboardFiltersProps {
  projects: string[];
  states: string[];
  statuses: string[];
  billCategories: string[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

export function DashboardFilters({ 
  projects, 
  states, 
  statuses, 
  billCategories,
  filters, 
  onFilterChange 
}: DashboardFiltersProps) {
  
  // --- Financial Year Presets Logic ---
  const [fyPresets, setFyPresets] = useState<{ label: string; value: [Date, Date] }[]>([]);

  useEffect(() => {
    const generateFYPresets = () => {
      const today = new Date();
      const currentMonth = today.getMonth(); // 0-11
      const currentYear = today.getFullYear();
      
      const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      
      const presets = [];
      for (let i = 0; i < 5; i++) {
        const y = startYear - i;
        const nextY = y + 1;
        const shortNextY = nextY.toString().slice(-2);
        
        const startDate = new Date(y, 3, 1); 
        const endDate = new Date(nextY, 2, 31); 
        
        presets.push({
          label: `FY ${y}-${shortNextY}`,
          value: [startDate, endDate] as [Date, Date]
        });
      }
      return presets;
    };
    setFyPresets(generateFYPresets());
  }, []);

  const handleDateRangeChange = (value: DatesRangeValue) => {
    const start = value[0] ? new Date(value[0]) : null;
    const end = value[1] ? new Date(value[1]) : null;
    onFilterChange({ ...filters, dateRange: [start, end] });
  };

  // --- Added: Clear Filters Handler ---
  const handleClearFilters = () => {
    onFilterChange({
      project: null,
      state: null,
      status: null,
      billCategory: null,
      dateRange: [null, null],
    });
  };

  return (
    <Paper withBorder shadow="sm" radius="md" p="md">
      <Group justify="flex-start" gap="md">
        
        {/* 1. Select Project */}
        <Select
          placeholder="All Projects"
          data={projects}
          value={filters.project}
          onChange={(val) => onFilterChange({ ...filters, project: val })}
          searchable
          clearable
          style={{ flex: 1, minWidth: '160px' }}
          nothingFoundMessage="Nothing found..."
        />

        {/* 2. Select State */}
        <Select
          placeholder="All States"
          data={states}
          value={filters.state}
          onChange={(val) => onFilterChange({ ...filters, state: val })}
          searchable
          clearable
          style={{ flex: 1, minWidth: '160px' }}
          nothingFoundMessage="Nothing found..."
        />

        {/* 3. Select Bill Category */}
        <Select
          placeholder="All Categories"
          data={billCategories}
          value={filters.billCategory}
          onChange={(val) => onFilterChange({ ...filters, billCategory: val })}
          searchable
          clearable
          style={{ flex: 1, minWidth: '160px' }}
          nothingFoundMessage="Nothing found..."
        />

        {/* 4. Select Status */}
        <Select
          placeholder="All Status"
          data={statuses}
          value={filters.status}
          onChange={(val) => onFilterChange({ ...filters, status: val })}
          clearable
          style={{ flex: 1, minWidth: '140px' }}
        />

        {/* 5. Date Range with FY Presets */}
        <DatePickerInput
          type="range"
          placeholder="Select Date Range or FY"
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          leftSection={<IconCalendar size={16} />}
          clearable
          presets={fyPresets}
          style={{ flex: 1.5, minWidth: '220px' }}
        />

        {/* 6. Added: Clear Filters Button */}
        <Button 
          variant="light" 
          color="red" 
          leftSection={<IconFilterOff size={16} />}
          onClick={handleClearFilters}
        >
          Clear
        </Button>

      </Group>
    </Paper>
  );
}