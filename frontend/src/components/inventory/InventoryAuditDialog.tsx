import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, TrendingUp, TrendingDown, AlertTriangle, Package, FileText, User, Calendar } from "lucide-react";
import api from "@/lib/api";

interface AuditLog {
  id: number;
  action: string;
  quantityBefore: number;
  quantityAfter: number;
  quantityChanged: number;
  reason?: string;
  reference?: string;
  referenceId?: number;
  performedBy?: string;
  notes?: string;
  createdAt: string;
  inventoryItem?: {
    name: string;
    code: string;
  };
}

interface InventoryAuditDialogProps {
  itemId: number;
  itemName: string;
  trigger?: React.ReactNode;
}

const InventoryAuditDialog = ({ itemId, itemName, trigger }: InventoryAuditDialogProps) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const limit = showAll ? 100 : 20;
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
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case 'custom':
          startDate = customDateRange.startDate;
          endDate = customDateRange.endDate;
          break;
      }
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const endpoint = itemId === 0 
        ? `/inventory/audit-logs?${params}` 
        : `/inventory/${itemId}/audit-logs?${params}`;
      
      const response = await api.get(endpoint);
      setAuditLogs(response.data.auditLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAuditLogs();
    }
  }, [open, itemId, showAll, dateFilter, customDateRange]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'STOCK_IN':
      case 'RESTOCK':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'STOCK_OUT':
      case 'BILLING':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'EXPIRED':
      case 'DAMAGED':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'STOCK_IN':
      case 'RESTOCK':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'STOCK_OUT':
      case 'BILLING':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EXPIRED':
      case 'DAMAGED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case 'STOCK_IN':
        return 'Stock Added';
      case 'STOCK_OUT':
        return 'Stock Removed';
      case 'BILLING':
        return 'Sold in Billing';
      case 'RESTOCK':
        return 'Restocked';
      case 'ADJUSTMENT':
        return 'Stock Adjustment';
      case 'EXPIRED':
        return 'Expired Items';
      case 'DAMAGED':
        return 'Damaged Items';
      default:
        return action;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" />
            Audit History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-between pr-10">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {itemId === 0 ? 'Inventory Activity Log' : `${itemName} - Activity Log`}
            </DialogTitle>
          </div>
          
          {/* Enhanced Filters */}
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
        </DialogHeader>
        
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-pulse text-gray-500">Loading audit history...</div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit History</h3>
              <p className="text-gray-600">
                {dateFilter === 'all' 
                  ? 'No inventory changes have been recorded for this item yet.'
                  : 'No inventory changes found for the selected time period.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Quick Summary */}
              <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-white border rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {auditLogs.filter(log => log.action === 'BILLING').length}
                  </div>
                  <div className="text-xs text-gray-600">Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {auditLogs.filter(log => log.action === 'RESTOCK').length}
                  </div>
                  <div className="text-xs text-gray-600">Restocks</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {auditLogs.filter(log => ['EXPIRED', 'DAMAGED'].includes(log.action)).length}
                  </div>
                  <div className="text-xs text-gray-600">Waste</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {auditLogs.length}
                  </div>
                  <div className="text-xs text-gray-600">Total Changes</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  Showing {auditLogs.length} {showAll ? 'entries' : 'recent entries'}
                  {dateFilter !== 'all' && (
                    <span className="ml-2 text-blue-600">
                      ({dateFilter === 'custom' ? 'Custom Range' : 
                        dateFilter === 'today' ? 'Today' :
                        dateFilter === 'week' ? 'Last 7 Days' : 'Last Month'})
                    </span>
                  )}
                </span>
              </div>
              
              <ScrollArea className="h-[40vh] pr-4">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Stock Change</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Details</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, index) => (
                        <tr key={`${log.id}-${index}`} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <div>
                                <Badge className={`${getActionColor(log.action)} text-xs`}>
                                  {formatAction(log.action)}
                                </Badge>
                                {itemId === 0 && log.inventoryItem && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {log.inventoryItem.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-medium">
                              {log.quantityBefore} → {log.quantityAfter}
                            </div>
                            <div className={`text-xs ${log.quantityChanged >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({log.quantityChanged >= 0 ? '+' : ''}{log.quantityChanged})
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm">
                              {log.reference && (
                                <div className="font-medium text-blue-600">
                                  {log.reference}
                                  {log.referenceId && ` #${log.referenceId}`}
                                </div>
                              )}
                              {log.reason && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {log.reason}
                                </div>
                              )}
                              {log.notes && log.notes.includes('Patient:') && (
                                <div className="text-xs text-blue-600 mt-1">
                                  {(() => {
                                    const patientMatch = log.notes.match(/Patient:\s*([^,]+)/);
                                    const patientName = patientMatch ? patientMatch[1].trim() : 'Unknown';
                                    return patientName !== 'Unknown' ? `👤 ${patientName}` : '';
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            {log.performedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                by {log.performedBy}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryAuditDialog;