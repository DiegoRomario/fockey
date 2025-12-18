/* eslint-disable react/prop-types */
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ModuleToggleProps {
  /** Unique identifier for the toggle input */
  id: string;
  /** Label text displayed next to the toggle */
  label: string;
  /** Optional tooltip text for additional context (shown on Info icon hover) */
  tooltip?: string;
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
 * Matches Settings page pattern with Info icon tooltips
 * Memoized to prevent unnecessary re-renders during tab switches
 */
const ModuleToggle = React.memo<ModuleToggleProps>(
  ({ id, label, tooltip, checked, onChange, disabled = false }) => {
    return (
      <div className="flex items-center gap-3 py-2.5">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          className="data-[state=checked]:bg-primary shrink-0"
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Label
            htmlFor={id}
            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
              disabled ? 'opacity-50' : 'cursor-pointer'
            }`}
          >
            {label}
          </Label>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="max-w-xs z-50"
                  collisionPadding={16}
                  avoidCollisions={true}
                >
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }
);

ModuleToggle.displayName = 'ModuleToggle';

export default ModuleToggle;
