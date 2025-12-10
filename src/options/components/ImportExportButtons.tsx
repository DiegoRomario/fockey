import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { ExtensionSettings } from '@/shared/types/settings';
import { validateSettings } from '@/shared/storage/validation';

interface ImportExportButtonsProps {
  /** Current settings to export */
  settings: ExtensionSettings;
  /** Callback when settings are successfully imported */
  onImport: (settings: ExtensionSettings) => void;
  /** Callback for showing error messages */
  onError: (message: string) => void;
  /** Callback for showing success messages */
  onSuccess: (message: string) => void;
}

/**
 * Import and Export buttons for settings management
 * Handles JSON file download and upload with validation
 */
export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  settings,
  onImport,
  onError,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Export current settings as JSON file
   */
  const handleExport = () => {
    try {
      // Serialize settings to formatted JSON
      const jsonString = JSON.stringify(settings, null, 2);
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

      onSuccess('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      onError('Failed to export settings. Please try again.');
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
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.json')) {
      onError('Please select a valid JSON file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Parse JSON
        let parsedSettings: unknown;
        try {
          parsedSettings = JSON.parse(content);
        } catch {
          onError('Invalid JSON file. Please check the file format.');
          return;
        }

        // Validate settings structure
        if (!validateSettings(parsedSettings)) {
          onError('Invalid settings file. The file does not match the expected settings schema.');
          return;
        }

        // Import successful
        onImport(parsedSettings as ExtensionSettings);
        onSuccess('Settings imported successfully');
      } catch (error) {
        console.error('Failed to import settings:', error);
        onError('Failed to import settings. Please try again.');
      }
    };

    reader.onerror = () => {
      onError('Failed to read file. Please try again.');
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export Settings
      </Button>
      <Button onClick={handleImport} variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import Settings
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
