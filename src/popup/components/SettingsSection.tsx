import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsSectionProps {
  /** Section title displayed in the card header */
  title: string;
  /** Optional description shown below the title */
  description?: string;
  /** Child components (typically ModuleToggle components) */
  children: React.ReactNode;
}

/**
 * Reusable section component for grouping related settings
 * Uses shadcn Card component for visual grouping
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
};

export default SettingsSection;
