/**
 * Schedules List Component
 * Displays all blocking schedules with empty state and management actions
 */

import React from 'react';
import { Plus, Calendar, Clock, Shield, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { BlockingSchedule } from '@/shared/types/settings';
import { formatDays, formatTimePeriod } from '@/shared/utils/schedule-utils';
import { cn } from '@/lib/utils';

interface SchedulesListProps {
  schedules: BlockingSchedule[];
  onAddSchedule: () => void;
  onEditSchedule: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onToggleSchedule: (scheduleId: string, enabled: boolean) => void;
  isLocked?: boolean;
}

export const SchedulesList: React.FC<SchedulesListProps> = ({
  schedules,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  isLocked = false,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">Schedules</h2>
            <p className="text-sm text-muted-foreground">
              Time-based blocking rules. Each schedule can block specific domains and keywords
              during designated times.
            </p>
          </div>
          <Button onClick={onAddSchedule} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Schedule
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {schedules.length === 0 && (
        <div className="bg-card rounded-xl shadow-sm border border-border/40 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No schedules configured</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Click &quot;Add Schedule&quot; to create one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedules List */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <Card
              key={schedule.id}
              className={cn(
                'p-6 transition-all hover:shadow-md',
                !schedule.enabled && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Schedule Info */}
                <div className="flex-1 space-y-3">
                  {/* Name and Icon */}
                  <div className="flex items-center gap-3">
                    {schedule.icon && (
                      <span className="text-2xl" aria-hidden="true">
                        {schedule.icon}
                      </span>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{schedule.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {schedule.enabled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <Power className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <PowerOff className="w-3 h-3" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {/* Days */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{formatDays(schedule.days)}</span>
                    </div>

                    {/* Time Periods */}
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {schedule.timePeriods.map((period, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-0.5 bg-muted rounded text-xs font-mono"
                          >
                            {formatTimePeriod(period)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Blocking Rules Summary */}
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {schedule.blockedDomains.length > 0 && (
                          <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs">
                            {schedule.blockedDomains.length} domain
                            {schedule.blockedDomains.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {schedule.urlKeywords.length > 0 && (
                          <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs">
                            {schedule.urlKeywords.length} URL keyword
                            {schedule.urlKeywords.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {schedule.contentKeywords.length > 0 && (
                          <span className="inline-block px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-xs">
                            {schedule.contentKeywords.length} content keyword
                            {schedule.contentKeywords.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Enable/Disable Toggle */}
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={(checked) => onToggleSchedule(schedule.id, checked)}
                    disabled={isLocked}
                    aria-label={schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
                  />

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditSchedule(schedule.id)}
                    disabled={isLocked}
                    aria-label="Edit schedule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteSchedule(schedule.id)}
                    disabled={isLocked}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
