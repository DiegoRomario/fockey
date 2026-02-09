/**
 * Schedule Templates Component
 * Displays predefined schedule templates that users can use to quickly create new schedules
 */

import React from 'react';
import { SCHEDULE_TEMPLATES } from '@/shared/types/settings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useT } from '@/shared/i18n/hooks';

interface ScheduleTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
  isLocked: boolean;
}

/**
 * Formats days array into human-readable text
 * Examples: "Mon - Fri", "Every day", "Weekends"
 */
function formatDays(days: number[], t: ReturnType<typeof useT>): string {
  const dayNames = [
    t('popup.schedules.days.sun'),
    t('popup.schedules.days.mon'),
    t('popup.schedules.days.tue'),
    t('popup.schedules.days.wed'),
    t('popup.schedules.days.thu'),
    t('popup.schedules.days.fri'),
    t('popup.schedules.days.sat'),
  ];

  // Check for every day
  if (days.length === 7) {
    return t('popup.schedules.days.everyDay');
  }

  // Check for weekdays (Mon-Fri)
  const isWeekdays =
    days.length === 5 &&
    days.includes(1) &&
    days.includes(2) &&
    days.includes(3) &&
    days.includes(4) &&
    days.includes(5);
  if (isWeekdays) {
    return t('popup.schedules.days.weekdays');
  }

  // Check for weekends (Sat-Sun)
  const isWeekends = days.length === 2 && days.includes(0) && days.includes(6);
  if (isWeekends) {
    return t('popup.schedules.days.weekends');
  }

  // Check for consecutive days
  const sortedDays = [...days].sort((a, b) => a - b);
  const isConsecutive = sortedDays.every((day, i) => {
    if (i === 0) return true;
    return day === sortedDays[i - 1] + 1;
  });

  if (isConsecutive) {
    return `${dayNames[sortedDays[0]]} - ${dayNames[sortedDays[sortedDays.length - 1]]}`;
  }

  // Default: list all days
  return sortedDays.map((day) => dayNames[day]).join(', ');
}

/**
 * Formats time periods into human-readable text
 * Examples: "9:00 AM → 5:00 PM", "All day"
 */
function formatTimePeriods(
  timePeriods: { startTime: string; endTime: string }[],
  t: ReturnType<typeof useT>
): string {
  if (timePeriods.length === 0) return '';

  // Check for all-day (00:00 - 23:59)
  if (
    timePeriods.length === 1 &&
    timePeriods[0].startTime === '00:00' &&
    timePeriods[0].endTime === '23:59'
  ) {
    return t('popup.schedules.time.allDay');
  }

  // Format single period with arrow
  if (timePeriods.length === 1) {
    const start = formatTime(timePeriods[0].startTime);
    const end = formatTime(timePeriods[0].endTime);
    return `${start} → ${end}`;
  }

  // Multiple periods: show count
  return t('popup.schedules.time.periods', { count: timePeriods.length });
}

/**
 * Formats HH:MM time to human-readable format (e.g., "9:00 AM", "5:30 PM")
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export const ScheduleTemplates: React.FC<ScheduleTemplatesProps> = ({
  onSelectTemplate,
  isLocked,
}) => {
  const t = useT();

  return (
    <div className="mt-8 mb-8">
      {/* Section Header */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('options.general.schedules.templates.title')}
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('options.general.schedules.templates.description')}
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCHEDULE_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="group relative flex flex-col items-center p-6 transition-all hover:shadow-lg hover:border-primary/50"
          >
            {/* Large Icon */}
            <div className="mb-4 text-6xl">{template.icon}</div>

            {/* Template Name */}
            <h3 className="mb-2 text-lg font-semibold text-center">{template.name}</h3>

            {/* Days */}
            <p className="mb-1 text-sm text-muted-foreground text-center">
              {formatDays(template.days, t)}
            </p>

            {/* Time Periods */}
            <p className="mb-4 text-sm text-muted-foreground text-center">
              {formatTimePeriods(template.timePeriods, t)}
            </p>

            {/* Add Button */}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onSelectTemplate(template.id)}
              disabled={isLocked}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('options.general.schedules.templates.useTemplate')}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
