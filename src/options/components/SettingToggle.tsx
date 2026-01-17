import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface SettingToggleProps {
  /** Unique identifier for the toggle */
  id: string;
  /** Display label for the setting */
  label: string;
  /** Brief description of what the setting does */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Optional tooltip text for additional context */
  tooltip?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

/**
 * Reusable setting toggle component with label, description, and optional tooltip
 * Provides accessible switch control with proper labeling and tooltips
 */
export const SettingToggle: React.FC<SettingToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  tooltip,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer group">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
          <Label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};
