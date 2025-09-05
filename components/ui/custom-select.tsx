'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export function CustomSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
  contentClassName,
  triggerClassName,
  label,
  error,
  required = false,
}: CustomSelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full bg-white/70 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:bg-white/90 shadow-sm',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent
          className={cn(
            'bg-white border border-gray-200 rounded-lg shadow-lg max-h-60',
            contentClassName
          )}
        >
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50 transition-colors duration-150"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

// Preset variants for common use cases
interface FilterSelectProps extends Omit<CustomSelectProps, 'triggerClassName' | 'contentClassName'> {
  variant?: 'filter' | 'form' | 'minimal';
}

export function FilterSelect({ variant = 'filter', ...props }: FilterSelectProps) {
  const variantStyles = {
    filter: {
      triggerClassName: 'h-10 bg-white/70 backdrop-blur-md border border-gray-300/60 hover:bg-white/90 focus:bg-white text-sm shadow-sm hover:border-gray-400/80',
      contentClassName: 'bg-white/95 backdrop-blur-md border border-gray-200',
    },
    form: {
      triggerClassName: 'h-11 bg-white border border-gray-300 hover:border-gray-400 focus:border-indigo-500 shadow-sm',
      contentClassName: 'bg-white border border-gray-200',
    },
    minimal: {
      triggerClassName: 'h-9 bg-transparent border border-gray-200 hover:bg-gray-50 hover:border-gray-300',
      contentClassName: 'bg-white border border-gray-100',
    },
  };

  return (
    <CustomSelect
      {...props}
      triggerClassName={variantStyles[variant].triggerClassName}
      contentClassName={variantStyles[variant].contentClassName}
    />
  );
}