/**
 * Schedules Components
 * Main container component for schedule management
 */

import React, { useState, useEffect } from 'react';
import { SchedulesList } from './SchedulesList';
import { EditSchedule } from './EditSchedule';
import { BlockingSchedule, LockModeState } from '@/shared/types/settings';
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
  const [schedules, setSchedules] = useState<BlockingSchedule[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BlockingSchedule | null>(null);
  const { toast } = useToast();

  // Load schedules on mount
  useEffect(() => {
    getSchedules()
      .then((loadedSchedules) => {
        setSchedules(loadedSchedules);
      })
      .catch((error) => {
        console.error('Failed to load schedules:', error);
        toast({
          title: 'Error',
          description: 'Failed to load schedules',
          variant: 'destructive',
        });
      });
  }, [toast]);

  const loadSchedules = async () => {
    try {
      const loadedSchedules = await getSchedules();
      setSchedules(loadedSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedules',
        variant: 'destructive',
      });
    }
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
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
        title: 'Schedule Locked',
        description: 'Cannot delete schedules while Lock Mode is active',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteSchedule(scheduleId);
      await loadSchedules();
      toast({
        title: 'Schedule Deleted',
        description: 'The schedule has been deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete schedule',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    if (lockState?.isLocked) {
      toast({
        title: 'Schedule Locked',
        description: 'Cannot modify schedules while Lock Mode is active',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSchedule(scheduleId, { enabled });
      await loadSchedules();
      toast({
        title: enabled ? 'Schedule Enabled' : 'Schedule Disabled',
        description: enabled ? 'The schedule is now active' : 'The schedule has been disabled',
      });
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update schedule',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSchedule = async (schedule: BlockingSchedule) => {
    try {
      if (editingSchedule) {
        // Update existing schedule
        await updateSchedule(schedule.id, schedule);
        toast({
          title: 'Schedule Updated',
          description: 'Your schedule has been updated successfully',
        });
      } else {
        // Add new schedule
        await addSchedule(schedule);
        toast({
          title: 'Schedule Created',
          description: 'Your schedule has been created successfully',
        });
      }

      await loadSchedules();
      setShowEditDialog(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save schedule',
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
      <SchedulesList
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onEditSchedule={handleEditSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onToggleSchedule={handleToggleSchedule}
        isLocked={lockState?.isLocked === true}
      />

      {/* Edit Schedule Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
            <DialogDescription>
              {editingSchedule
                ? 'Modify your existing blocking schedule'
                : 'Set up a new time-based blocking schedule'}
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

export { SchedulesList, EditSchedule };
