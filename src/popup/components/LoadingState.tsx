import React from 'react';

/**
 * Loading state component shown while settings are being fetched from Chrome Storage
 */
const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    </div>
  );
};

export default LoadingState;
