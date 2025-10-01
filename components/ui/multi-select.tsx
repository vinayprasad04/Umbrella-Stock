"use client";

import * as React from "react";
import Select, { MultiValue, ActionMeta, StylesConfig } from 'react-select';
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Custom styles to match your design system
const customStyles: StylesConfig<MultiSelectOption, true> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '36px',
    borderColor: state.isFocused ? '#8b5cf6' : '#d1d5db',
    borderWidth: '1px',
    borderRadius: '0.5rem',
    boxShadow: state.isFocused ? '0 0 0 1px #8b5cf6' : 'none',
    '&:hover': {
      borderColor: '#8b5cf6',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '2px 8px',
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '36px',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#f3f4f6',
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    fontSize: '0.875rem',
    color: '#374151',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#6b7280',
    ':hover': {
      backgroundColor: '#ef4444',
      color: 'white',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#8b5cf6'
      : state.isFocused
      ? '#f3f4f6'
      : 'white',
    color: state.isSelected ? 'white' : '#374151',
    ':active': {
      backgroundColor: '#8b5cf6',
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
};

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
}) => {
  const selectedOptions = React.useMemo(() => {
    return options.filter(option => value.includes(option.value));
  }, [options, value]);

  const handleChange = (
    newValue: MultiValue<MultiSelectOption>,
    actionMeta: ActionMeta<MultiSelectOption>
  ) => {
    const newValues = newValue.map(option => option.value);
    onChange(newValues);
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        styles={customStyles}
        isDisabled={disabled}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        isClearable={true}
        isSearchable={true}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
      />
    </div>
  );
};