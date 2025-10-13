import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface StatusLog {
  id: number;
  previousStatus: string | null;
  newStatus: string;
  changeType: string;
  changedBy: string | null;
  reason: string | null;
  timestamp: string;
}

interface StaffStatusHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: number;
  staffName: string;
}

const StaffStatusHistory: React.FC<StaffStatusHistoryProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName
}) => {
  const [history, setHistory] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, staffId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/staff/${staffId}/status-history?limit=50`);
      setHistory(response.data.history);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch status history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeColor = (changeType: string) => {
    return changeType === 'automatic'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-purple-100 text-purple-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl" style={{ maxHeight: '90vh' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Status History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {history.length === 0 ? (
              <p className="py-8 text-center text-gray-500">No status changes recorded</p>
            ) : (
              <div className="space-y-3">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {log.previousStatus && (
                            <>
                              <span className="text-sm font-medium text-gray-700">
                                {log.previousStatus}
                              </span>
                              <svg
                                className="h-4 w-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {log.newStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getChangeTypeColor(
                          log.changeType
                        )}`}
                      >
                        {log.changeType === 'automatic' ? 'Auto' : 'Manual'}
                      </span>
                    </div>

                    {log.changeType === 'manual' && (
                      <div className="mt-2 border-t border-gray-200 pt-2">
                        {log.changedBy && (
                          <p className="text-xs text-gray-600">
                            Changed by: <span className="font-medium">{log.changedBy}</span>
                          </p>
                        )}
                        {log.reason && (
                          <p className="mt-1 text-xs text-gray-600">
                            Reason: <span className="italic">{log.reason}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffStatusHistory;
