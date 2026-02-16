import {
  FilterBar,
  FilterGroupItem,
  Input,
  MultiComboBox,
  MultiComboBoxItem,
  Select,
  Option,
  DatePicker,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';

interface MemoFilterBarProps {
  onFilter: (filters: Record<string, string>) => void;
  onClear: () => void;
}

export default function MemoFilterBar({ onFilter, onClear }: MemoFilterBarProps) {
  const handleGo = (e: any) => {
    const filters: Record<string, string> = {};
    const form = e.target?.closest?.('ui5-filter-bar') ?? document;
    const inputs = form.querySelectorAll('ui5-input, ui5-multi-combobox, ui5-select, ui5-date-picker');
    inputs.forEach((input: any) => {
      const name = input.getAttribute('data-filter-name');
      const value = input.value;
      if (name && value) {
        filters[name] = value;
      }
    });
    onFilter(filters);
  };

  return (
    <FilterBar
      onGo={handleGo}
      onClear={onClear}
      showGoOnFB
      showClearOnFB
      showRestoreOnFB={false}
    >
      <FilterGroupItem label="Job Number" filterKey="jobNumber">
        <Input data-filter-name="jobNumber" placeholder="e.g. JOB-78901" />
      </FilterGroupItem>
      <FilterGroupItem label="Work Order" filterKey="workOrderNumber">
        <Input data-filter-name="workOrderNumber" placeholder="e.g. 40001234" />
      </FilterGroupItem>
      <FilterGroupItem label="Notification" filterKey="notificationNumber">
        <Input data-filter-name="notificationNumber" placeholder="e.g. 20004567" />
      </FilterGroupItem>
      <FilterGroupItem label="Task" filterKey="taskNumber">
        <Input data-filter-name="taskNumber" placeholder="e.g. 0010" />
      </FilterGroupItem>
      <FilterGroupItem label="Stream Number" filterKey="streamNumber">
        <Input data-filter-name="streamNumber" placeholder="e.g. STR-0042" />
      </FilterGroupItem>
      <FilterGroupItem label="Date Range" filterKey="dateRange">
        <DatePicker data-filter-name="dateRange" placeholder="Select date" />
      </FilterGroupItem>
      <FilterGroupItem label="Status" filterKey="status">
        <MultiComboBox data-filter-name="status" placeholder="Select status">
          <MultiComboBoxItem text="New" />
          <MultiComboBoxItem text="Released" />
          <MultiComboBoxItem text="In Progress" />
          <MultiComboBoxItem text="Technically Complete" />
          <MultiComboBoxItem text="Closed" />
        </MultiComboBox>
      </FilterGroupItem>
      <FilterGroupItem label="Memo Type" filterKey="memoType">
        <Select data-filter-name="memoType">
          <Option value="">All Types</Option>
          <Option value="Access Issue">Access Issue</Option>
          <Option value="Additional Works">Additional Works</Option>
          <Option value="Unavailability">Unavailability</Option>
          <Option value="Other">Other</Option>
        </Select>
      </FilterGroupItem>
    </FilterBar>
  );
}
