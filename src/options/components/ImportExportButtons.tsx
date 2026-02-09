import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportAllSettings, importAllSettings } from '@/shared/storage/settings-manager';
import { useT } from '@/shared/i18n/hooks';

interface ImportExportButtonsProps {
  /** Callback when settings are successfully imported (triggers reload) */
  onImport: () => void;
  /** Callback for showing error messages */
  onError: (message: string) => void;
  /** Callback for showing success messages */
  onSuccess: (message: string) => void;
  /** Disable import button (export always allowed) */
  disabled?: boolean;
}

/**
 * Import and Export buttons for settings management
 * Handles JSON file download and upload with validation
 *
 * Export Structure:
 * {
 *   version: "1.0.0",
 *   settings: {
 *     youtube: {
 *       enabled: boolean,
 *       globalNavigation: {...},
 *       searchPage: {...},
 *       watchPage: {...},
 *       blockedChannels: [...]
 *       // homePage and creatorProfilePage excluded (empty)
 *     },
 *     general: {
 *       schedules: [...],
 *       quickBlock: { blockedDomains: [], urlKeywords: [], contentKeywords: [] }
 *     }
 *   },
 *   theme: "light" | "dark",
 *   exportedAt: number
 * }
 *
 * Exports include:
 * - YouTube module (enabled, global, search, watch settings)
 * - Blocked YouTube channels
 * - General module (schedules and Quick Block config)
 * - Theme preference
 *
 * Does NOT export (empty, deprecated, or device-specific):
 * - homePage/creatorProfilePage (deprecated, always empty)
 * - Lock Mode state (device-specific commitment)
 * - YouTube Pause state (device-specific)
 * - Quick Block session state (active session is temporary)
 */
export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  onImport,
  onError,
  onSuccess,
  disabled = false,
}) => {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Export all settings and preferences as JSON file
   */
  const handleExport = async () => {
    try {
      // Get complete export data (settings + theme)
      const exportData = await exportAllSettings();

      // Serialize to formatted JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `fockey-settings-${timestamp}.json`;

      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSuccess(t('toasts.settingsExported'));
    } catch (error) {
      console.error('Failed to export settings:', error);
      onError(t('toasts.failedToExportSettings'));
    }
  };

  /**
   * Import settings from JSON file
   */
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file selection and validation
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.json')) {
      onError(t('toasts.selectValidFile'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;

        // Parse JSON
        let parsedData: unknown;
        try {
          parsedData = JSON.parse(content);
        } catch {
          onError(t('toasts.invalidFile'));
          return;
        }

        // Import using the comprehensive import function
        try {
          await importAllSettings(parsedData);
          onSuccess(t('toasts.settingsImported'));

          // Trigger reload to reflect imported settings
          onImport();
        } catch (importError) {
          const error = importError as Error;
          onError(error.message || t('toasts.failedToImportSettings'));
        }
      } catch (error) {
        console.error('Failed to import settings:', error);
        onError(t('toasts.failedToImportSettings'));
      }
    };

    reader.onerror = () => {
      onError(t('toasts.failedToReadFile'));
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        {t('options.manageSettings.importExport.exportButton')}
      </Button>
      <Button onClick={handleImport} variant="outline" size="sm" disabled={disabled}>
        <Upload className="h-4 w-4 mr-2" />
        {t('options.manageSettings.importExport.importButton')}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
