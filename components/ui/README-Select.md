# Custom Select Components

This project now uses shadcn/ui Select components throughout the application. We have created reusable wrapper components to maintain consistency and ease of use.

## Components

### `CustomSelect`
A flexible, reusable select component with full customization options.

```tsx
import { CustomSelect } from '@/components/ui/custom-select';

// Basic usage
<CustomSelect
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="Choose an option"
/>

// With label and validation
<CustomSelect
  label="Select Category"
  required
  error={validationError}
  options={options}
  value={value}
  onValueChange={setValue}
  placeholder="Choose a category"
/>
```

### `FilterSelect`
A preset select component optimized for filter UI with three variants:

```tsx
import { FilterSelect } from '@/components/ui/custom-select';

// Filter variant (default) - glassmorphism style for filter controls
<FilterSelect
  variant="filter"
  label="Filter by Category:"
  value={filterValue}
  onValueChange={setFilterValue}
  options={categoryOptions}
/>

// Form variant - clean style for forms
<FilterSelect
  variant="form"
  label="Select Option:"
  value={value}
  onValueChange={setValue}
  options={options}
/>

// Minimal variant - minimal styling
<FilterSelect
  variant="minimal"
  value={value}
  onValueChange={setValue}
  options={options}
/>
```

## Props

### CustomSelect Props
- `options: SelectOption[]` - Array of options with value, label, and optional disabled
- `value?: string` - Currently selected value
- `onValueChange?: (value: string) => void` - Callback when selection changes
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disable the select
- `className?: string` - Additional CSS classes for container
- `label?: string` - Label text
- `error?: string` - Error message to display
- `required?: boolean` - Show required indicator

### FilterSelect Props
Extends CustomSelect props with:
- `variant?: 'filter' | 'form' | 'minimal'` - Predefined style variants

## SelectOption Interface
```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

## Usage Examples in the Project

### Sectors Page
```tsx
<FilterSelect
  label="Filter by Performance:"
  value={filterPerformance}
  onValueChange={setFilterPerformance}
  variant="filter"
  options={[
    { value: 'all', label: 'All Sectors' },
    { value: 'positive', label: 'Positive Performance' },
    { value: 'negative', label: 'Negative Performance' },
  ]}
/>
```

### Mutual Funds Page
```tsx
<FilterSelect
  label="Sort by:"
  value={sortBy}
  onValueChange={setSortBy}
  variant="filter"
  options={[
    { value: 'returns1Y', label: '1 Year Returns' },
    { value: 'returns3Y', label: '3 Year Returns' },
    { value: 'nav', label: 'NAV (High to Low)' },
  ]}
/>
```

## Styling

The components use Tailwind CSS classes and are designed to work with the project's existing design system:
- Filter variant: Glassmorphism effect with backdrop blur
- Form variant: Clean borders with focus states
- Minimal variant: Subtle styling for minimal interfaces

All variants include:
- Proper focus states
- Hover effects
- Smooth transitions
- Error state styling
- Disabled state styling

## Benefits

1. **Consistency**: All select components use the same underlying shadcn/ui components
2. **Accessibility**: Built-in keyboard navigation and ARIA attributes
3. **Customization**: Flexible styling options while maintaining design consistency
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Easy to Use**: Simple API that covers common use cases