import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import api from '@/lib/api';

interface StatusOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: number;
  staffName: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

const StatusOverrideDialog: React.FC<StatusOverrideDialogProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName,
  currentStatus,
  onStatusUpdated
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    'On Duty',
    'Off Duty',
    'On Break',
    'On Leave',
    'Emergency Leave',
    'Late',
    'Extended Shift'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newStatus || !changedBy) {
      setError('Status and changed by are required');
      return;
    }

    setLoading(true);

    try {
      await api.post(`/staff/${staffId}/override-status`, {
        status: newStatus,
        changedBy,
        reason: reason || null
      });

      onStatusUpdated();
      onClose();
      
      // Reset form
      setReason('');
      setChangedBy('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            Override Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              Staff: <span className="font-medium text-gray-900">{staffName}</span>
            </p>
            <p className="text-sm text-gray-600">
              Current Status: <span className="font-medium text-gray-900">{currentStatus}</span>
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                New Status <span className="text-red-500">*</span>
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="changedBy">
                Changed By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="changedBy"
                value={changedBy}
                onChange={(e) => setChangedBy(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for status change..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-medical-500 hover:bg-medical-600"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusOverrideDialog;
