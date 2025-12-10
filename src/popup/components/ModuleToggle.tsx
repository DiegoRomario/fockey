import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ModuleToggleProps {
  /** Unique identifier for the toggle input */
  id: string;
  /** Label text displayed next to the toggle */
  label: string;
  /** Optional description text shown below the label */
  description?: string;
  /** Current checked state of the toggle */
  checked: boolean;
  /** Callback fired when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

/**
 * Reusable toggle component for individual settings
 * Uses shadcn Switch and Label components with keyboard accessibility
 */
const ModuleToggle: React.FC<ModuleToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 space-y-0.5">
        <Label
          htmlFor={id}
          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
            disabled ? 'opacity-50' : 'cursor-pointer'
          }`}
        >
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="transition-opacity"
      />
    </div>
  );
};

export default ModuleToggle;
