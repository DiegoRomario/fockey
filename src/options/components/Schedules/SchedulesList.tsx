/**
 * Schedules List Component
 * Displays all blocking schedules with empty state and management actions
 */

import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  Shield,
  MoreVertical,
  Trash2,
  Pause,
  Play,
  Link,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const handleDeleteClick = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      onDeleteSchedule(scheduleToDelete);
      setScheduleToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

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
                'relative p-8 transition-all hover:shadow-md cursor-pointer',
                !schedule.enabled && 'opacity-60'
              )}
              onClick={() => !isLocked && onEditSchedule(schedule.id)}
            >
              {/* Clock Icon - Top Left */}
              <div className="absolute top-4 left-4">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Dropdown Menu - Top Right */}
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      disabled={isLocked}
                      aria-label="Schedule options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSchedule(schedule.id, !schedule.enabled);
                      }}
                      disabled={isLocked}
                    >
                      {schedule.enabled ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(schedule.id);
                      }}
                      disabled={isLocked}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Centered Content */}
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon - Large and Centered */}
                <div className="flex items-center justify-center">
                  {schedule.icon ? (
                    <span className="text-5xl" aria-hidden="true">
                      {schedule.icon}
                    </span>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-lg font-semibold">{schedule.name}</h3>

                {/* Days and Time */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{formatDays(schedule.days)}</span>
                  <span className="mx-2">·</span>
                  <span>
                    {schedule.timePeriods.map((period) => formatTimePeriod(period)).join(', ')}
                  </span>
                </div>

                {/* Status Badge */}
                {schedule.enabled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-xs font-medium text-green-700 dark:text-green-400">
                    <Play className="w-3 h-3" />
                    Active
                  </span>
                )}

                {/* Blocking Rules - Count Badges with Popovers */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {/* Domains */}
                  {schedule.blockedDomains.length > 0 && (
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>
                            {schedule.blockedDomains.length} Domain
                            {schedule.blockedDomains.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-700 dark:text-red-400" />
                            Blocked Domains
                          </h4>
                          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                            {schedule.blockedDomains.map((domain, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-medium"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>
                            {schedule.urlKeywords.length} URL Keyword
                            {schedule.urlKeywords.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Link className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                            URL Keywords
                          </h4>
                          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                            {schedule.urlKeywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs font-medium"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {schedule.contentKeywords.length} Content Keyword
                            {schedule.contentKeywords.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                            Content Keywords
                          </h4>
                          <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                            {schedule.contentKeywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-xs font-medium"
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
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
