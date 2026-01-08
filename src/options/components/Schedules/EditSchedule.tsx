/**
 * Edit Schedule Component
 * Form for creating or editing a blocking schedule
 */

import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Clock, Globe, Link, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BlockingSchedule, TimePeriod } from '@/shared/types/settings';
import {
  generateScheduleId,
  normalizeDomain,
  getOverlappingIndices,
} from '@/shared/utils/schedule-utils';
import { cn } from '@/lib/utils';

interface EditScheduleProps {
  schedule?: BlockingSchedule | null;
  onSave: (schedule: BlockingSchedule) => void;
  onCancel: () => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ICON_OPTIONS = ['🎯', '🔒', '🚫', '⏰', '📚', '💼', '🏃', '🧘', ''];

export const EditSchedule: React.FC<EditScheduleProps> = ({ schedule, onSave, onCancel }) => {
  // Form state
  const [name, setName] = useState(schedule?.name || '');
  const [icon, setIcon] = useState(schedule?.icon || '');
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule?.days || []);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>(
    schedule?.timePeriods || [{ startTime: '09:00', endTime: '17:00' }]
  );
  const [blockedDomains, setBlockedDomains] = useState<string[]>(schedule?.blockedDomains || []);
  const [urlKeywords, setUrlKeywords] = useState<string[]>(schedule?.urlKeywords || []);
  const [contentKeywords, setContentKeywords] = useState<string[]>(schedule?.contentKeywords || []);
  const [whatToBlockExpanded, setWhatToBlockExpanded] = useState(true);

  // Input fields for adding new items
  const [domainInput, setDomainInput] = useState('');
  const [urlKeywordInput, setUrlKeywordInput] = useState('');
  const [contentKeywordInput, setContentKeywordInput] = useState('');

  // Validation
  const [errors, setErrors] = useState<string[]>([]);
  const [overlappingPeriods, setOverlappingPeriods] = useState<Set<number>>(new Set());

  // Check for overlapping periods whenever time periods change
  React.useEffect(() => {
    const overlaps = getOverlappingIndices(timePeriods);
    setOverlappingPeriods(overlaps);
  }, [timePeriods]);

  // Day selector helpers
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectWeekend = () => {
    setSelectedDays([0, 6]);
  };

  const clearDays = () => {
    setSelectedDays([]);
  };

  // Check if we can add more time periods (need at least 1 hour before midnight)
  const canAddMorePeriods = React.useMemo(() => {
    if (timePeriods.length === 0) {
      return true; // Can always add first period
    }

    // Find the latest end time
    const endTimes = timePeriods.map((p) => {
      const [hours, minutes] = p.endTime.split(':').map(Number);
      return hours * 60 + minutes;
    });

    const maxEndMinutes = Math.max(...endTimes);

    // Need at least 60 minutes (1 hour) remaining in the day for a new period
    // 23:59 = 1439 minutes, so if maxEndMinutes > 1379 (22:59), we can't add another hour
    const minutesRemaining = 1440 - maxEndMinutes; // 1440 = 24 * 60 (total minutes in day)

    // Need at least 60 minutes for a meaningful period
    return minutesRemaining >= 60;
  }, [timePeriods]);

  // Time period helpers
  const addTimePeriod = () => {
    // Don't allow adding if no time left in day
    if (!canAddMorePeriods) {
      return;
    }

    // Find the latest end time from all existing periods
    let latestEndTime = '09:00'; // Default start time

    if (timePeriods.length > 0) {
      // Convert all end times to minutes and find the maximum
      const endTimes = timePeriods.map((p) => {
        const [hours, minutes] = p.endTime.split(':').map(Number);
        return hours * 60 + minutes;
      });

      const maxEndMinutes = Math.max(...endTimes);

      // Add 1 minute to the latest end time
      const newStartMinutes = maxEndMinutes + 1;

      // CRITICAL: Don't allow wrapping to next day - periods must stay within same day
      if (newStartMinutes >= 24 * 60) {
        // Would cross midnight - don't add period
        return;
      }

      // Convert back to HH:MM format
      const hours = Math.floor(newStartMinutes / 60);
      const minutes = newStartMinutes % 60;
      latestEndTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Set end time to 1 hour after start time (or 17:00 if default)
    let endTime = '17:00';
    if (timePeriods.length > 0) {
      const [hours, minutes] = latestEndTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + 60; // +1 hour

      // Cap at 23:59 to stay within same day
      if (endMinutes >= 24 * 60) {
        endTime = '23:59';
      } else {
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      }
    }

    setTimePeriods([...timePeriods, { startTime: latestEndTime, endTime }]);
  };

  const removeTimePeriod = (index: number) => {
    if (timePeriods.length > 1) {
      setTimePeriods(timePeriods.filter((_, i) => i !== index));
    }
  };

  const updateTimePeriod = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...timePeriods];
    updated[index] = { ...updated[index], [field]: value };
    setTimePeriods(updated);
  };

  // Blocking rules helpers
  const addDomain = () => {
    if (domainInput.trim()) {
      // Normalize domain (remove protocol, trailing slash, www prefix, etc.)
      const normalized = normalizeDomain(domainInput.trim());

      // Check if already exists
      if (!blockedDomains.includes(normalized)) {
        setBlockedDomains([...blockedDomains, normalized]);
        setDomainInput('');
      } else {
        // Domain already exists - just clear input
        setDomainInput('');
      }
    }
  };

  const removeDomain = (domain: string) => {
    setBlockedDomains(blockedDomains.filter((d) => d !== domain));
  };

  const addUrlKeyword = () => {
    if (urlKeywordInput.trim() && !urlKeywords.includes(urlKeywordInput.trim())) {
      setUrlKeywords([...urlKeywords, urlKeywordInput.trim()]);
      setUrlKeywordInput('');
    }
  };

  const removeUrlKeyword = (keyword: string) => {
    setUrlKeywords(urlKeywords.filter((k) => k !== keyword));
  };

  const addContentKeyword = () => {
    if (contentKeywordInput.trim() && !contentKeywords.includes(contentKeywordInput.trim())) {
      setContentKeywords([...contentKeywords, contentKeywordInput.trim()]);
      setContentKeywordInput('');
    }
  };

  const removeContentKeyword = (keyword: string) => {
    setContentKeywords(contentKeywords.filter((k) => k !== keyword));
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Schedule name is required');
    }

    if (selectedDays.length === 0) {
      newErrors.push('At least one day must be selected');
    }

    if (timePeriods.length === 0) {
      newErrors.push('At least one time period is required');
    }

    // Check for overlapping time periods
    if (overlappingPeriods.size > 0) {
      newErrors.push(
        "Time periods cannot overlap. Please adjust the times so periods don't conflict with each other."
      );
    }

    if (blockedDomains.length === 0 && urlKeywords.length === 0 && contentKeywords.length === 0) {
      newErrors.push(
        'At least one blocking rule is required (domain, URL keyword, or content keyword)'
      );
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Save handler
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const scheduleData: BlockingSchedule = {
      id: schedule?.id || generateScheduleId(),
      name: name.trim(),
      icon: icon || undefined,
      enabled: schedule?.enabled ?? true,
      days: selectedDays,
      timePeriods,
      blockedDomains,
      urlKeywords,
      contentKeywords,
      createdAt: schedule?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave(scheduleData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm border border-border/40 p-6">
        <h2 className="text-2xl font-semibold mb-2">
          {schedule ? 'Edit Schedule' : 'Add Schedule'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure when and what to block during this schedule
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Schedule Info */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">Schedule Name</Label>
            <Input
              id="schedule-name"
              placeholder="e.g., Focus Work"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((iconOption, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={cn(
                    'w-10 h-10 rounded-md border flex items-center justify-center text-xl transition-all',
                    icon === iconOption
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {iconOption || '-'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Days Selector */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Days</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllDays}>
                All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={selectWeekdays}>
                Weekdays
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={selectWeekend}>
                Weekend
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearDays}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAY_NAMES.map((dayName, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={cn(
                  'h-12 rounded-md border font-medium text-sm transition-all',
                  selectedDays.includes(index)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {dayName}
              </button>
            ))}
          </div>
        </Card>

        {/* Active Time Periods */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Active Time Periods</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Schedule will be active during these times. Add multiple periods for breaks (e.g.,
                pause for lunch).
              </p>
              {!canAddMorePeriods && (
                <p className="text-xs text-destructive mt-1">
                  ⚠ No more time available in the day. Periods must stay within 00:00 - 23:59.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTimePeriod}
              disabled={!canAddMorePeriods}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Period
            </Button>
          </div>

          <div className="space-y-3">
            {timePeriods.map((period, index) => {
              const hasOverlap = overlappingPeriods.has(index);
              return (
                <div key={index} className="space-y-2">
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-md border transition-all',
                      hasOverlap ? 'border-destructive bg-destructive/5' : 'border-transparent'
                    )}
                  >
                    <Clock
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        hasOverlap ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm',
                        hasOverlap ? 'text-destructive font-medium' : 'text-muted-foreground'
                      )}
                    >
                      Period {index + 1}
                    </span>
                    <Input
                      type="time"
                      value={period.startTime}
                      onChange={(e) => updateTimePeriod(index, 'startTime', e.target.value)}
                      className={cn('flex-1', hasOverlap && 'border-destructive')}
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="time"
                      value={period.endTime}
                      onChange={(e) => updateTimePeriod(index, 'endTime', e.target.value)}
                      className={cn('flex-1', hasOverlap && 'border-destructive')}
                    />
                    {timePeriods.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimePeriod(index)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {hasOverlap && (
                    <div className="flex items-start gap-2 px-3">
                      <span className="text-xs text-destructive">
                        ⚠ This period overlaps with another time window
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {overlappingPeriods.size > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">⚠ Time periods cannot overlap</p>
              <p className="text-xs text-destructive/80 mt-1">
                Please adjust the times so that periods don&apos;t conflict with each other.
              </p>
            </div>
          )}
        </Card>

        {/* What to Block */}
        <Card className="p-6">
          <button
            type="button"
            onClick={() => setWhatToBlockExpanded(!whatToBlockExpanded)}
            className="w-full flex items-center justify-between mb-4"
          >
            <Label className="cursor-pointer">What to Block</Label>
            {whatToBlockExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {whatToBlockExpanded && (
            <div className="space-y-6">
              {/* Blocked Domains */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Label>Blocked Domains</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                  />
                  <Button type="button" onClick={addDomain} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {blockedDomains.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No domains added</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blockedDomains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => removeDomain(domain)}
                          className="hover:bg-red-200 dark:hover:bg-red-800/30 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* URL Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <Label>URL Keywords</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Block pages with these keywords in the URL
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., trending, viral"
                    value={urlKeywordInput}
                    onChange={(e) => setUrlKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrlKeyword())}
                  />
                  <Button type="button" onClick={addUrlKeyword} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {urlKeywords.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No URL keywords added</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {urlKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeUrlKeyword(keyword)}
                          className="hover:bg-orange-200 dark:hover:bg-orange-800/30 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Content Keywords */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <Label>Content Keywords</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Block pages with these keywords in content
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., breaking news, celebrity"
                    value={contentKeywordInput}
                    onChange={(e) => setContentKeywordInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addContentKeyword())
                    }
                  />
                  <Button type="button" onClick={addContentKeyword} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {contentKeywords.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No content keywords added</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {contentKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-xs"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeContentKeyword(keyword)}
                          className="hover:bg-amber-200 dark:hover:bg-amber-800/30 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <ul className="space-y-1 text-sm text-destructive">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <Plus className="w-4 h-4 mr-1" />
            Save Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};
