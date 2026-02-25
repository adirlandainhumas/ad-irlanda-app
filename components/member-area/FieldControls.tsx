import type { ReactNode } from 'react';

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  icon?: ReactNode;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <div className="relative">
      {icon}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full border border-slate-300 rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 bg-white`}
        required={required}
      />
    </div>
  </div>
);

export const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) => (
  <div className="space-y-1">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-slate-300 rounded-xl py-3 px-4 bg-white"
      required
    >
      <option value="">Selecione</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
