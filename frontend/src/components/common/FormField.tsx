import React from 'react';

export interface FieldProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function Field({
  label,
  required,
  placeholder,
  type = 'text',
  value,
  onChange,
  className = '',
}: FieldProps) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
      />
    </label>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: string[];
  optionValues?: string[];
  items?: SelectOption[];
  className?: string;
}

export function SelectField({
  label,
  required,
  value,
  onChange,
  options,
  optionValues,
  items,
  className = '',
}: SelectFieldProps) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      <select className="select-input" value={value} onChange={onChange}>
        {items && items.length > 0 ? (
          items.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        ) : options && options.length > 0 ? (
          options.map((option, idx) => (
            <option
              key={`${label}-${option}-${idx}`}
              value={optionValues?.[idx] ?? option}
            >
              {option}
            </option>
          ))
        ) : (
          <option value={value}>{value}</option>
        )}
      </select>
    </label>
  );
}
