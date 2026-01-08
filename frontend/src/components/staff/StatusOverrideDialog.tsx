import React, { useState } from 'react';
import axios from 'axios';

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
      await axios.post(`/api/staff/${staffId}/override-status`, {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Override Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Staff: <span className="font-medium text-gray-900">{staffName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Current Status: <span className="font-medium text-gray-900">{currentStatus}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Changed By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={changedBy}
              onChange={(e) => setChangedBy(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for status change..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusOverrideDialog;
