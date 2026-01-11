/**
 * Schedules Section Component (Popup Version)
 * Displays existing schedules in a compact list
 * Provides entry point to Settings for schedule management
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  MoreVertical,
  Pause,
  Trash2,
  Play,
  Target,
  Calendar,
  Globe,
  Link,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { BlockingSchedule } from '@/shared/types/settings';
import { getSchedules, updateSchedule, deleteSchedule } from '@/shared/storage/settings-manager';
import { cn } from '@/lib/utils';

interface SchedulesSectionProps {
  onOpenSchedulesSettings: (scheduleId?: string | 'create') => void;
  disabled?: boolean;
}

/**
 * Compact schedules overview for popup
 * Shows active schedules with quick actions
 */
export const SchedulesSection: React.FC<SchedulesSectionProps> = ({
  onOpenSchedulesSettings,
  disabled = false,
}) => {
  const [schedules, setSchedules] = useState<BlockingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const loadedSchedules = await getSchedules();
        if (!isMounted) return;
        setSchedules(loadedSchedules);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTogglePause = async (schedule: BlockingSchedule) => {
    try {
      await updateSchedule(schedule.id, { enabled: !schedule.enabled });
      // Reload schedules
      const loadedSchedules = await getSchedules();
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleDelete = async (schedule: BlockingSchedule) => {
    try {
      await deleteSchedule(schedule.id);
      // Reload schedules
      const loadedSchedules = await getSchedules();
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const formatScheduleDays = (days: number[]): string => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayNames[d]).join(', ');
  };

  const formatScheduleTime = (schedule: BlockingSchedule): string => {
    if (schedule.timePeriods.length === 0) return 'No time set';
    if (schedule.timePeriods.length === 1) {
      const period = schedule.timePeriods[0];
      if (period.startTime === '00:00' && period.endTime === '23:59') {
        return 'All day long';
      }
      return `${period.startTime} - ${period.endTime}`;
    }
    return `${schedule.timePeriods.length} periods`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Schedules</h3>
        </div>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Empty state - no schedules
  if (schedules.length === 0) {
    return (
      <div className="space-y-3">
        {/* Hero Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-sm">Schedules</h3>
          <p className="text-xs text-muted-foreground">Time-based blocking</p>
        </div>

        {/* Empty State */}
        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">⚠ No schedules configured</p>
        </div>
        <Button
          onClick={() => onOpenSchedulesSettings('create')}
          variant="default"
          size="sm"
          className="w-full"
          disabled={disabled}
        >
          <Calendar className="mr-2 h-3.5 w-3.5" />
          Create Schedule
        </Button>
      </div>
    );
  }

  // Schedules exist
  return (
    <div className="space-y-2">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Schedules</h3>
        <button
          onClick={() => onOpenSchedulesSettings('create')}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Schedules List */}
      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={cn(
              'relative rounded-lg border bg-card p-4 transition-colors cursor-pointer hover:bg-accent/50',
              !schedule.enabled && 'opacity-50'
            )}
            onClick={() => !disabled && onOpenSchedulesSettings(schedule.id)}
          >
            {/* Clock icon - Top Left */}
            <div className="absolute top-3 left-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Menu - Top Right */}
            <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full p-1 hover:bg-accent transition-colors"
                    disabled={disabled}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePause(schedule);
                    }}
                    className="flex items-center gap-2"
                  >
                    {schedule.enabled ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(schedule);
                    }}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Centered Content */}
            <div className="flex flex-col items-center text-center space-y-2 pt-4 pb-2">
              {/* Large Icon */}
              <div className="flex items-center justify-center mb-1">
                {schedule.icon ? (
                  <span className="text-4xl" aria-hidden="true">
                    {schedule.icon}
                  </span>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              {/* Schedule Name */}
              <h4 className="font-semibold text-sm">{schedule.name}</h4>

              {/* Days and Time */}
              <p className="text-xs text-muted-foreground">
                {formatScheduleDays(schedule.days)} · {formatScheduleTime(schedule)}
              </p>

              {/* Bottom Metadata - Blocking Rules */}
              <div className="flex items-center justify-center flex-wrap gap-2 pt-1">
                {/* Domains */}
                {schedule.blockedDomains.length > 0 && (
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3" />
                        <span>{schedule.blockedDomains.length}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-64 max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                      side="top"
                      align="center"
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                          Blocked Domains
                        </h4>
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                          {schedule.blockedDomains.map((domain, index) => (
                            <span
                              key={index}
                              className="inline-block px-1.5 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}

                {/* URL Keywords */}
                {schedule.urlKeywords.length > 0 && (
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link className="w-3 h-3" />
                        <span>{schedule.urlKeywords.length}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-64 max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                      side="top"
                      align="center"
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs flex items-center gap-2">
                          <Link className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
                          URL Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                          {schedule.urlKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}

                {/* Content Keywords */}
                {schedule.contentKeywords.length > 0 && (
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="w-3 h-3" />
                        <span>{schedule.contentKeywords.length}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-64 max-w-[90vw]"
                      onClick={(e) => e.stopPropagation()}
                      side="top"
                      align="center"
                    >
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          Content Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                          {schedule.contentKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-xs"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchedulesSection;
