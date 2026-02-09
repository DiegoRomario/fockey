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
import { isValidDomainPattern } from '@/shared/utils/domain-utils';
import { cn } from '@/lib/utils';
import { useT } from '@/shared/i18n/hooks';

interface EditScheduleProps {
  schedule?: BlockingSchedule | null;
  onSave: (schedule: BlockingSchedule) => void;
  onCancel: () => void;
}

// Day names are now translated via i18n - see usage below

const ICON_OPTIONS = ['🎯', '🔒', '🚫', '⏰', '📚', '💼', '🏃', '🧘', ''];

export const EditSchedule: React.FC<EditScheduleProps> = ({ schedule, onSave, onCancel }) => {
  const t = useT();
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
  const [domainInputError, setDomainInputError] = useState<string | null>(null);
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

  // Check if we can add more time periods
  // Uses the LAST period's end time as reference (append-based model)
  const canAddMorePeriods = React.useMemo(() => {
    if (timePeriods.length === 0) {
      return true; // Can always add first period
    }

    // Get the LAST period's end time (this will be the new period's start time)
    const lastPeriod = timePeriods[timePeriods.length - 1];
    const [hours, minutes] = lastPeriod.endTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes;

    // Can add more if the last period ends before 23:59
    // This ensures the new period has at least 1 minute of possible duration
    return endMinutes < 23 * 60 + 59;
  }, [timePeriods]);

  // Time period helpers
  // Append-based model: new.start = latest.end, new.end = new.start + 1 hour
  const addTimePeriod = () => {
    if (!canAddMorePeriods) {
      return;
    }

    let newStartTime: string;
    let newEndTime: string;

    if (timePeriods.length === 0) {
      // First period - default start at 09:00, end at 10:00 (1 hour duration)
      newStartTime = '09:00';
      newEndTime = '10:00';
    } else {
      // New period starts exactly at the end of the LAST period (no +1 minute gap)
      const lastPeriod = timePeriods[timePeriods.length - 1];
      newStartTime = lastPeriod.endTime;

      // Calculate end time: start + 1 hour, capped at 23:59
      const [hours, minutes] = newStartTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);

      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    setTimePeriods([...timePeriods, { startTime: newStartTime, endTime: newEndTime }]);
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
    if (!domainInput.trim()) {
      setDomainInputError(
        t('options.general.schedules.edit.blockedDomains.error', { error: 'Please enter a domain' })
      );
      return;
    }

    // Normalize domain (remove protocol, trailing slash, www prefix, etc.)
    const normalized = normalizeDomain(domainInput.trim());

    // Validate domain pattern
    if (!isValidDomainPattern(normalized)) {
      setDomainInputError(
        t('options.general.schedules.edit.blockedDomains.error', {
          error: 'Please enter a valid domain (e.g., example.com or *.example.com for wildcards)',
        })
      );
      return;
    }

    // Check if already exists
    if (blockedDomains.includes(normalized)) {
      setDomainInputError(
        t('options.general.schedules.edit.blockedDomains.error', {
          error: 'This domain is already in the list',
        })
      );
      return;
    }

    setDomainInputError(null);
    setBlockedDomains([...blockedDomains, normalized]);
    setDomainInput('');
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
    const keyword = contentKeywordInput.trim();
    if (keyword && !contentKeywords.includes(keyword)) {
      setContentKeywords([...contentKeywords, keyword]);
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
      newErrors.push(t('options.general.schedules.edit.validation.nameRequired'));
    }

    if (selectedDays.length === 0) {
      newErrors.push(t('options.general.schedules.edit.validation.daysRequired'));
    }

    if (timePeriods.length === 0) {
      newErrors.push(t('options.general.schedules.edit.validation.timePeriodsRequired'));
    }

    // Check for overlapping time periods
    if (overlappingPeriods.size > 0) {
      newErrors.push(t('options.general.schedules.edit.validation.timePeriodsOverlap'));
    }

    if (blockedDomains.length === 0 && urlKeywords.length === 0 && contentKeywords.length === 0) {
      newErrors.push(t('options.general.schedules.edit.validation.rulesRequired'));
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
    <div className="space-y-6">
      {/* Form */}
      <div className="space-y-6">
        {/* Schedule Info */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-name">{t('options.general.schedules.edit.name.label')}</Label>
            <Input
              id="schedule-name"
              placeholder={t('options.general.schedules.edit.name.placeholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('options.general.schedules.edit.icon.label')}</Label>
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
            <Label>{t('options.general.schedules.edit.days.label')}</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllDays}>
                {t('options.general.schedules.edit.days.all')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={selectWeekdays}>
                {t('options.general.schedules.edit.days.weekdays')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={selectWeekend}>
                {t('options.general.schedules.edit.days.weekend')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearDays}>
                {t('options.general.schedules.edit.days.clear')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((dayKey, index) => (
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
                {t(`options.general.schedules.edit.days.${dayKey}`)}
              </button>
            ))}
          </div>
        </Card>

        {/* Active Time Periods */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('options.general.schedules.edit.timePeriods.label')}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('options.general.schedules.edit.timePeriods.hint')}
              </p>
              {!canAddMorePeriods && (
                <p className="text-xs text-destructive mt-1">
                  {t('options.general.schedules.edit.timePeriods.warning')}
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
              {t('options.general.schedules.edit.timePeriods.addPeriod')}
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
                      {t('options.general.schedules.edit.timePeriods.periodLabel', {
                        index: index + 1,
                      })}
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
                        {t('options.general.schedules.edit.timePeriods.overlap')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {overlappingPeriods.size > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <p className="text-sm text-destructive font-medium">
                {t('options.general.schedules.edit.timePeriods.overlapError')}
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                {t('options.general.schedules.edit.timePeriods.overlapErrorDescription')}
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
            <Label className="cursor-pointer">
              {t('options.general.schedules.edit.whatToBlock')}
            </Label>
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
                  <Label>{t('options.general.schedules.edit.blockedDomains.label')}</Label>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t('options.general.schedules.edit.blockedDomains.placeholder')}
                      value={domainInput}
                      onChange={(e) => {
                        setDomainInput(e.target.value);
                        setDomainInputError(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                      className={cn(domainInputError && 'border-destructive')}
                    />
                    <Button type="button" onClick={addDomain} size="icon" variant="outline">
                      <Plus className="w-4 w-4" />
                    </Button>
                  </div>
                  {domainInputError && (
                    <p className="text-xs text-destructive">{domainInputError}</p>
                  )}
                </div>
                {blockedDomains.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('options.general.schedules.edit.blockedDomains.empty')}
                  </p>
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
                  <Label>{t('options.general.schedules.edit.urlKeywords.label')}</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('options.general.schedules.edit.urlKeywords.hint')}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('options.general.schedules.edit.urlKeywords.placeholder')}
                    value={urlKeywordInput}
                    onChange={(e) => setUrlKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrlKeyword())}
                  />
                  <Button type="button" onClick={addUrlKeyword} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {urlKeywords.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('options.general.schedules.edit.urlKeywords.empty')}
                  </p>
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
                  <Label>{t('options.general.schedules.edit.contentKeywords.label')}</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('options.general.schedules.edit.contentKeywords.hint')}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('options.general.schedules.edit.contentKeywords.placeholder')}
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
                  <p className="text-xs text-muted-foreground">
                    {t('options.general.schedules.edit.contentKeywords.empty')}
                  </p>
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
            {t('options.general.schedules.edit.buttons.cancel')}
          </Button>
          <Button type="button" onClick={handleSave}>
            <Plus className="w-4 h-4 mr-1" />
            {t('options.general.schedules.edit.buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
