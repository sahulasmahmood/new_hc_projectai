import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import {
  Heart,
  Calendar,
  User,
  Printer,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from "lucide-react";
import api from "@/lib/api";
import { useVitalsSettings } from "@/hooks/useVitalsSettings";

interface VitalsRecord {
  id: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
  notes?: string;
  createdAt: string;
  appointment?: {
    date: string;
    time: string;
    type: string;
    doctorName?: string;
  };
}

interface VitalsHistoryTabProps {
  patientId: string;
  patientName: string;
}

const VitalsHistoryTab = ({ patientId, patientName }: VitalsHistoryTabProps) => {
  const [vitalsHistory, setVitalsHistory] = useState<VitalsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  
  // Use dynamic vitals settings
  const { 
    getBloodPressureStatus, 
    getStatus, 
    getNormalRangeText,
    getBloodPressureRangeText,
    loading: settingsLoading 
  } = useVitalsSettings();

  const RECENT_LIMIT = 10;
  const displayedRecords = showAllRecords ? vitalsHistory : vitalsHistory.slice(0, RECENT_LIMIT);
  const hasMoreRecords = vitalsHistory.length > RECENT_LIMIT;

  useEffect(() => {
    fetchVitalsHistory();
  }, [patientId]);

  const fetchVitalsHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vitals/patient/${patientId}?limit=50`);
      setVitalsHistory(response.data);
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      toast({
        title: "Error",
        description: "Failed to load vitals history",
        variant: "destructive",
      });
      setVitalsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getVitalTrend = (currentValue: number, previousValue: number) => {
    if (currentValue > previousValue) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (currentValue < previousValue) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">Normal</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>;
      default:
        return null;
    }
  };

  const getBPStatusBadge = (sys?: number, dia?: number) => {
    if (!sys || !dia) return null;
    const status = getBloodPressureStatus(sys, dia);
    return getStatusBadge(status);
  };

  const getHeartRateStatusBadge = (hr?: number) => {
    if (!hr) return null;
    const status = getStatus(hr, 'heartRate');
    return getStatusBadge(status);
  };

  const getTemperatureStatusBadge = (temp?: number) => {
    if (!temp) return null;
    const status = getStatus(temp, 'temperature');
    return getStatusBadge(status);
  };

  const getOxygenSaturationStatusBadge = (spo2?: number) => {
    if (!spo2) return null;
    const status = getStatus(spo2, 'oxygenSaturation');
    return getStatusBadge(status);
  };

  const handlePrintVitals = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vitals History - ${patientName}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .patient-info { background-color: #f8fafc; padding: 15px; margin-bottom: 30px; border-left: 4px solid #3b82f6; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background-color: #f1f5f9; padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-size: 12px; }
            td { padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; }
            .vital-value { font-weight: bold; }
            .recorded-by { font-style: italic; color: #666; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Vitals Signs History</h1>
            <h2>Patient: ${patientName}</h2>
            <div>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${patientName}</p>
            <p><strong>Patient ID:</strong> ${patientId}</p>
            <p><strong>Total Records:</strong> ${vitalsHistory.length}</p>
          </div>

          <div class="section">
            <h3>Vitals History (${vitalsHistory.length} records)</h3>
            <table>
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>BP (mmHg)</th>
                  <th>HR (bpm)</th>
                  <th>Temp (°F)</th>
                  <th>RR (/min)</th>
                  <th>O2 Sat (%)</th>
                  <th>Weight (lbs)</th>
                  <th>Height (in)</th>
                  <th>Recorded By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${vitalsHistory.map(record => `
                  <tr>
                    <td>
                      ${new Date(record.createdAt).toLocaleDateString()}<br>
                      <small>${new Date(record.createdAt).toLocaleTimeString()}</small>
                    </td>
                    <td class="vital-value">
                      ${record.bloodPressureSys && record.bloodPressureDia 
                        ? `${record.bloodPressureSys}/${record.bloodPressureDia}` 
                        : 'N/A'}
                    </td>
                    <td class="vital-value">${record.heartRate || 'N/A'}</td>
                    <td class="vital-value">${record.temperature || 'N/A'}</td>
                    <td class="vital-value">${record.respiratoryRate || 'N/A'}</td>
                    <td class="vital-value">${record.oxygenSaturation || 'N/A'}</td>
                    <td class="vital-value">${record.weight || 'N/A'}</td>
                    <td class="vital-value">${record.height || 'N/A'}</td>
                    <td class="recorded-by">${record.recordedBy}</td>
                    <td>${record.notes || 'No notes'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Computer Generated Vitals History Report</p>
            <p>Generated from Medical Records Management System</p>
            <p>Report ID: VH-${patientId}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleShareVitals = async () => {
    const shareText = `VITALS HISTORY SUMMARY

Patient: ${patientName}
Patient ID: ${patientId}
Total Records: ${vitalsHistory.length}
Generated: ${new Date().toLocaleDateString()}

RECENT VITALS:
${vitalsHistory.slice(0, 5).map((record, index) => {
  const date = new Date(record.createdAt).toLocaleDateString();
  const time = new Date(record.createdAt).toLocaleTimeString();
  const bp = record.bloodPressureSys && record.bloodPressureDia 
    ? `${record.bloodPressureSys}/${record.bloodPressureDia}` 
    : 'N/A';
  
  return `${index + 1}. ${date} ${time}
   BP: ${bp} mmHg | HR: ${record.heartRate || 'N/A'} bpm
   Temp: ${record.temperature || 'N/A'}°F | O2: ${record.oxygenSaturation || 'N/A'}%
   Recorded by: ${record.recordedBy}`;
}).join('\n\n')}

This is a confidential medical record.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vitals History - ${patientName}`,
          text: shareText,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareText);
          toast({
            title: "Copied to Clipboard",
            description: "Vitals history copied to clipboard",
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Vitals history copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Activity className="h-6 w-6 animate-pulse mr-2" />
            <span>Loading vitals history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Vitals Signs History
              <span className="text-sm font-normal text-gray-500">
                ({displayedRecords.length} of {vitalsHistory.length} records)
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handlePrintVitals}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Print vitals history</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" onClick={handleShareVitals}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {vitalsHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vitals records found</p>
              <p className="text-sm">Vitals will appear here once recorded</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Blood Pressure</TableHead>
                    <TableHead>Heart Rate</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Respiratory Rate</TableHead>
                    <TableHead>O2 Saturation</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedRecords.map((record, index) => {
                    const previousRecord = displayedRecords[index + 1];
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {new Date(record.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(record.createdAt).toLocaleTimeString()}
                              </div>
                              {record.appointment && (
                                <div className="text-xs text-blue-600">
                                  {record.appointment.type}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.bloodPressureSys && record.bloodPressureDia ? (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-mono cursor-help">
                                        {record.bloodPressureSys}/{record.bloodPressureDia}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Normal: {getBloodPressureRangeText()}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {getBPStatusBadge(record.bloodPressureSys, record.bloodPressureDia)}
                                {previousRecord?.bloodPressureSys && 
                                  getVitalTrend(record.bloodPressureSys, previousRecord.bloodPressureSys)}
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.heartRate ? (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-mono cursor-help">{record.heartRate}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Normal: {getNormalRangeText('heartRate')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {getHeartRateStatusBadge(record.heartRate)}
                                {previousRecord?.heartRate && 
                                  getVitalTrend(record.heartRate, previousRecord.heartRate)}
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.temperature ? (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="font-mono cursor-help">{record.temperature}°F</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Normal: {getNormalRangeText('temperature')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {getTemperatureStatusBadge(record.temperature)}
                                {previousRecord?.temperature && 
                                  getVitalTrend(record.temperature, previousRecord.temperature)}
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.respiratoryRate ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-mono cursor-help">{record.respiratoryRate}/min</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Normal: {getNormalRangeText('respiratoryRate')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.oxygenSaturation ? (
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono cursor-help">{record.oxygenSaturation}%</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Normal: {getNormalRangeText('oxygenSaturation')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {getOxygenSaturationStatusBadge(record.oxygenSaturation)}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.weight ? (
                            <span className="font-mono">{record.weight} lbs</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.height ? (
                            <span className="font-mono">{record.height} in</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{record.recordedBy}</span>
                            </div>
                            {record.appointment?.doctorName && (
                              <div className="text-xs text-gray-500 ml-6">
                                Dr. {record.appointment.doctorName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {record.notes ? (
                              <span className="text-sm">{record.notes}</span>
                            ) : (
                              <span className="text-gray-400 text-sm">No notes</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Show All / Show Recent Toggle */}
              {hasMoreRecords && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllRecords(!showAllRecords)}
                    className="text-medical-600 hover:text-medical-700"
                  >
                    {showAllRecords ? (
                      <>Show Recent Only ({RECENT_LIMIT})</>
                    ) : (
                      <>Show All Records ({vitalsHistory.length})</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VitalsHistoryTab;