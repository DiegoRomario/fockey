/**
 * Schedules Components
 * Main container component for schedule management
 */

import React, { useState, useEffect, useRef } from 'react';
import { useT } from '@/shared/i18n/hooks';
import { SchedulesList } from './SchedulesList';
import { EditSchedule } from './EditSchedule';
import { ScheduleTemplates } from './ScheduleTemplates';
import { BlockingSchedule, LockModeState, SCHEDULE_TEMPLATES } from '@/shared/types/settings';
import {
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
} from '@/shared/storage/settings-manager';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SchedulesProps {
  lockState: LockModeState | null;
}

export const Schedules: React.FC<SchedulesProps> = ({ lockState }) => {
  const t = useT();
  const [schedules, setSchedules] = useState<BlockingSchedule[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BlockingSchedule | null>(null);
  const { toast } = useToast();
  const hasOpenedModalRef = useRef(false);

  // Load schedules on mount
  useEffect(() => {
    getSchedules()
      .then((loadedSchedules) => {
        setSchedules(loadedSchedules);
      })
      .catch((error) => {
        console.error('Failed to load schedules:', error);
        toast({
          title: t('common.error'),
          description: t('toasts.failedToLoadSchedules'),
          variant: 'destructive',
        });
      });
  }, [toast, t]);

  // Check for scheduleId or action in URL and auto-open modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const scheduleId = urlParams.get('scheduleId');
    const action = urlParams.get('action');

    if (!hasOpenedModalRef.current) {
      // Handle create action
      if (action === 'create') {
        hasOpenedModalRef.current = true;
        // Use setTimeout to avoid setState during render
        setTimeout(() => {
          setEditingSchedule(null);
          setShowEditDialog(true);
        }, 0);
      }
      // Handle edit specific schedule
      else if (scheduleId && schedules.length > 0) {
        const schedule = schedules.find((s) => s.id === scheduleId);
        if (schedule) {
          hasOpenedModalRef.current = true;
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            setEditingSchedule(schedule);
            setShowEditDialog(true);
          }, 0);
        }
      }
    }
  }, [schedules]);

  const loadSchedules = async () => {
    try {
      const loadedSchedules = await getSchedules();
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast({
        title: t('common.error'),
        description: t('toasts.failedToLoadSchedules'),
        variant: 'destructive',
      });
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setShowEditDialog(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    // Find the template
    const template = SCHEDULE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    // Create a partial schedule with template values
    // The EditSchedule component will handle the rest (IDs, timestamps, etc.)
    const templateSchedule: Partial<BlockingSchedule> = {
      name: template.name,
      icon: template.icon,
      days: [...template.days],
      timePeriods: template.timePeriods.map((period) => ({ ...period })),
      // Empty blocking rules - user will add these
      blockedDomains: [],
      urlKeywords: [],
      contentKeywords: [],
      enabled: true,
    };

    // Set the editing schedule to the template (cast to BlockingSchedule for the dialog)
    // EditSchedule will treat it as a new schedule since it won't have an id
    setEditingSchedule(templateSchedule as BlockingSchedule);
    setShowEditDialog(true);
  };

  const handleEditSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      setEditingSchedule(schedule);
      setShowEditDialog(true);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (lockState?.isLocked) {
      toast({
        title: t('toasts.scheduleLocked'),
        description: t('toasts.scheduleDeleteLocked'),
        variant: 'warning',
      });
      return;
    }

    try {
      await deleteSchedule(scheduleId);
      await loadSchedules();
      toast({
        title: t('toasts.scheduleDeleted'),
        description: t('toasts.scheduleDeleted'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('toasts.failedToLoadSchedules'),
        variant: 'destructive',
      });
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    if (lockState?.isLocked) {
      toast({
        title: t('toasts.scheduleLocked'),
        description: t('toasts.scheduleLocked'),
        variant: 'warning',
      });
      return;
    }

    try {
      await updateSchedule(scheduleId, { enabled });
      await loadSchedules();
      toast({
        title: enabled ? t('toasts.scheduleEnabled') : t('toasts.scheduleDisabled'),
        description: enabled ? t('toasts.scheduleEnabled') : t('toasts.scheduleDisabled'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('toasts.failedToLoadSchedules'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveSchedule = async (schedule: BlockingSchedule) => {
    try {
      // Check if we're editing an existing schedule (has an ID) vs creating a new one
      // When creating from a template, editingSchedule exists but has no id
      if (editingSchedule?.id) {
        // Update existing schedule
        await updateSchedule(schedule.id, schedule);
        toast({
          title: t('toasts.scheduleUpdated'),
          description: t('toasts.scheduleUpdated'),
          variant: 'success',
        });
      } else {
        // Add new schedule (either from scratch or from template)
        await addSchedule(schedule);
        toast({
          title: t('toasts.scheduleCreated'),
          description: t('toasts.scheduleCreated'),
          variant: 'success',
        });
      }

      await loadSchedules();
      setShowEditDialog(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('toasts.failedToLoadSchedules'),
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setEditingSchedule(null);
  };

  return (
    <>
      {/* Schedules List */}
      <SchedulesList
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onToggleSchedule={handleToggleSchedule}
        isLocked={lockState?.isLocked === true}
      />

      {/* Schedule Templates */}
      <ScheduleTemplates
        onSelectTemplate={handleSelectTemplate}
        isLocked={lockState?.isLocked === true}
      />

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule?.id
                ? t('options.general.schedules.edit.titleEdit')
                : t('options.general.schedules.edit.titleCreate')}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule?.id
                ? t('options.general.schedules.edit.descriptionEdit')
                : t('options.general.schedules.edit.descriptionCreate')}
            </DialogDescription>
          </DialogHeader>
          <EditSchedule
            schedule={editingSchedule}
            onSave={handleSaveSchedule}
            onCancel={handleCancelEdit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export { SchedulesList, EditSchedule, ScheduleTemplates };
