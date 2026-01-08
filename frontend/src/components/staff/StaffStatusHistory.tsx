import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, ArrowRight, Clock } from 'lucide-react';
import api from '@/lib/api';

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
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showAll, setShowAll] = useState(false);
  const [graceInfo, setGraceInfo] = useState<{
    hasGracePeriod: boolean;
    remainingMinutes: number;
    lastManualChange?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, staffId, dateFilter, customDateRange, showAll]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const limit = showAll ? 200 : 50;
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      
      // Add date filtering based on selected filter
      const now = new Date();
      let startDate = '';
      let endDate = '';
      
      switch (dateFilter) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          endDate = startDate;
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        }
        case 'custom':
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
          break;
      }
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/staff/${staffId}/status-history?${params}`);
      setHistory(response.data.history);
      
      // Fetch grace period info
      fetchGraceInfo();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch status history');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraceInfo = async () => {
    try {
      const response = await api.get(`/staff/${staffId}/grace-info`);
      setGraceInfo(response.data);
    } catch (err) {
      // Grace info is optional, don't show error
      setGraceInfo(null);
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

  const getChangeTypeBadge = (changeType: string) => {
    return changeType === 'automatic' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        Auto
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
        Manual
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-4 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-medical-500" />
              {staffName} - Status History
            </DialogTitle>
          </div>
          
          {/* Enhanced Filters - Exact copy from Inventory */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant={showAll ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs px-3"
              >
                {showAll ? 'All Entries' : 'Recent Only'}
              </Button>
            </div>
          </div>

          {/* Grace Period Info */}
          {graceInfo?.hasGracePeriod && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">Grace Period Active:</span> 
                {graceInfo.remainingMinutes > 0 ? (
                  <span> Automatic updates paused for {graceInfo.remainingMinutes} more minutes due to recent manual change</span>
                ) : (
                  <span> Grace period expired, automatic updates resumed</span>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-pulse text-gray-500">Loading status history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Status History</h3>
              <p className="text-gray-600">
                {dateFilter === 'all' 
                  ? 'No status changes have been recorded for this staff member yet.'
                  : 'No status changes found for the selected time period.'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4 pb-4">
                {history.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {log.previousStatus && (
                            <>
                              <span className="text-sm font-medium text-gray-700">
                                {log.previousStatus}
                              </span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
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
                      {getChangeTypeBadge(log.changeType)}
                    </div>

                    {((log.changeType === 'manual' && (log.changedBy || log.reason)) || 
                      (log.changeType === 'automatic' && log.reason)) && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
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
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StaffStatusHistory;
