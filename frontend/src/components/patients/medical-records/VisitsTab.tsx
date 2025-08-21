
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { 
  User, 
  Calendar, 
  Eye,
  Printer,
  Share2
} from "lucide-react";

interface Visit {
  id: number;
  date: string;
  time?: string;
  type: string;
  status: string;
  notes: string;
  duration?: string;
  actualStartTime?: string;
  actualEndTime?: string;
}

interface VisitsTabProps {
  visits: Visit[];
  patientName: string;
  patientId: string;
}

const VisitsTab = ({ visits, patientName, patientId }: VisitsTabProps) => {
  const [showAllVisits, setShowAllVisits] = useState(false);
  
  const RECENT_LIMIT = 5;
  const displayedVisits = showAllVisits ? visits : visits.slice(0, RECENT_LIMIT);
  const hasMoreVisits = visits.length > RECENT_LIMIT;
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "The visits summary has been copied to your clipboard.",
        duration: 3000,
      });
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  };
  
  const handlePrintVisit = (visit: Visit) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open a new window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }
    
    const systemLogo = `
      <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill="#f8f9fa"/>
        <text x="10" y="30" font-family="Arial" font-size="18" fill="#4a5568">Medical Records System</text>
        <path d="M160 15 h20 v20 h-20 z" fill="#3b82f6"/>
        <path d="M165 25 h10 M170 20 v10" stroke="white" stroke-width="2"/>
      </svg>
    `;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Visit - ${new Date(visit.date).toLocaleDateString()}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .clinic-info { flex: 1; }
            .clinic-info h1 { color: #3b82f6; margin: 0; font-size: 24px; }
            .clinic-info p { margin: 5px 0; font-size: 14px; color: #666; }
            .document-title { text-align: center; margin: 20px 0; }
            .document-title h2 { color: #1e40af; margin: 0; }
            .patient-info { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 30px; }
            .patient-info h3 { margin: 0 0 10px 0; color: #1e40af; }
            .patient-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .patient-info-item { margin-bottom: 5px; }
            .patient-info-label { font-weight: bold; color: #4b5563; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
            .visit-details { background-color: white; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
            .visit-detail-item { margin-bottom: 10px; }
            .visit-detail-label { font-weight: bold; color: #4b5563; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(203, 213, 225, 0.2); z-index: -1; }
          </style>
        </head>
        <body>
          <div class="watermark">CONFIDENTIAL</div>
          <div class="container">
            <div class="header">
              <div class="clinic-info">
                <h1>Medical Visit Record</h1>
                <p>Computer Generated Visit Report</p>
                <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              </div>
              <div>${systemLogo}</div>
            </div>
            
            <div class="document-title">
              <h2>PATIENT VISIT DETAILS</h2>
              <p>Visit ID: V-${visit.id}</p>
            </div>
            
            <div class="patient-info">
              <h3>Patient Information</h3>
              <div class="patient-info-grid">
                <div class="patient-info-item">
                  <span class="patient-info-label">Name:</span> ${patientName}
                </div>
                <div class="patient-info-item">
                  <span class="patient-info-label">ID:</span> ${patientId}
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>Visit Details</h3>
              <div class="visit-details">
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Date:</span> ${new Date(visit.date).toLocaleDateString()}
                </div>
                ${visit.time ? `
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Time:</span> ${visit.time}
                </div>
                ` : ''}
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Type:</span> ${visit.type}
                </div>
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Status:</span> ${visit.status}
                </div>
                ${visit.duration ? `
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Duration:</span> ${visit.duration}
                </div>
                ` : ''}
                ${visit.actualStartTime ? `
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Actual Start Time:</span> ${new Date(visit.actualStartTime).toLocaleString()}
                </div>
                ` : ''}
                ${visit.actualEndTime ? `
                <div class="visit-detail-item">
                  <span class="visit-detail-label">Actual End Time:</span> ${new Date(visit.actualEndTime).toLocaleString()}
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3>Visit Notes</h3>
              <p>${visit.notes || 'No notes recorded for this visit.'}</p>
            </div>
            
            <div class="footer">
              <p>Computer Generated Medical Visit Record</p>
              <p>Generated from Medical Records Management System</p>
              <p>Visit Report ID: VR-${visit.id}</p>
              <div style="font-size: 10px; color: #888; margin-top: 10px;">Generated: ${new Date().toISOString()}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  const handlePrintVisits = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open a new window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }
    
    const systemLogo = `
      <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="50" fill="#f8f9fa"/>
        <text x="10" y="30" font-family="Arial" font-size="18" fill="#4a5568">Medical Records System</text>
        <path d="M160 15 h20 v20 h-20 z" fill="#3b82f6"/>
        <path d="M165 25 h10 M170 20 v10" stroke="white" stroke-width="2"/>
      </svg>
    `;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Visits History - ${patientName}</title>
          <style>
            @page { size: A4; margin: 1.5cm; }
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .clinic-info { flex: 1; }
            .clinic-info h1 { color: #3b82f6; margin: 0; font-size: 24px; }
            .clinic-info p { margin: 5px 0; font-size: 14px; color: #666; }
            .document-title { text-align: center; margin: 20px 0; }
            .document-title h2 { color: #1e40af; margin: 0; }
            .patient-info { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 30px; }
            .patient-info h3 { margin: 0 0 10px 0; color: #1e40af; }
            .patient-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .patient-info-item { margin-bottom: 5px; }
            .patient-info-label { font-weight: bold; color: #4b5563; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
            .visit-item { background-color: white; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
            .visit-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .visit-date { font-weight: bold; color: #1e40af; }
            .visit-type { display: inline-block; padding: 2px 8px; background-color: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; }
            .visit-status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            .status-completed { background-color: #dcfce7; color: #166534; }
            .status-confirmed { background-color: #dbeafe; color: #1e40af; }
            .status-other { background-color: #f3f4f6; color: #4b5563; }
            .visit-details { margin-top: 10px; }
            .visit-detail-item { margin-bottom: 5px; }
            .visit-detail-label { font-weight: bold; color: #4b5563; }
            .visit-notes { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e2e8f0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(203, 213, 225, 0.2); z-index: -1; }
          </style>
        </head>
        <body>
          <div class="watermark">CONFIDENTIAL</div>
          <div class="container">
            <div class="header">
              <div class="clinic-info">
                <h1>Medical Visits History</h1>
                <p>Computer Generated Visit History Report</p>
                <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              </div>
              <div>${systemLogo}</div>
            </div>
            
            <div class="document-title">
              <h2>PATIENT VISIT HISTORY</h2>
              <p>Total Visits: ${visits.length}</p>
            </div>
            
            <div class="patient-info">
              <h3>Patient Information</h3>
              <div class="patient-info-grid">
                <div class="patient-info-item">
                  <span class="patient-info-label">Name:</span> ${patientName}
                </div>
                <div class="patient-info-item">
                  <span class="patient-info-label">ID:</span> ${patientId}
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>Visit Records</h3>
              ${visits.map(visit => `
                <div class="visit-item">
                  <div class="visit-header">
                    <div class="visit-date">${new Date(visit.date).toLocaleDateString()}${visit.time ? ` at ${visit.time}` : ''}</div>
                    <div>
                      <span class="visit-type">${visit.type}</span>
                      <span class="visit-status ${visit.status === 'Completed' ? 'status-completed' : visit.status === 'Confirmed' ? 'status-confirmed' : 'status-other'}">${visit.status}</span>
                    </div>
                  </div>
                  <div class="visit-details">
                    ${visit.duration ? `
                    <div class="visit-detail-item">
                      <span class="visit-detail-label">Duration:</span> ${visit.duration}
                    </div>
                    ` : ''}
                    ${visit.actualStartTime ? `
                    <div class="visit-detail-item">
                      <span class="visit-detail-label">Actual Start Time:</span> ${new Date(visit.actualStartTime).toLocaleString()}
                    </div>
                    ` : ''}
                    ${visit.actualEndTime ? `
                    <div class="visit-detail-item">
                      <span class="visit-detail-label">Actual End Time:</span> ${new Date(visit.actualEndTime).toLocaleString()}
                    </div>
                    ` : ''}
                  </div>
                  ${visit.notes ? `
                  <div class="visit-notes">
                    <div class="visit-detail-label">Notes:</div>
                    <p>${visit.notes}</p>
                  </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>Computer Generated Medical Visits History Report</p>
              <p>Generated from Medical Records Management System</p>
              <p>History Report ID: VH-${patientId}</p>
              <div style="font-size: 10px; color: #888; margin-top: 10px;">Generated: ${new Date().toISOString()}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  const handleShareVisits = (method: string = 'share') => {
    // Create a summary of the visits for sharing
    const visitsSummary = `
Medical Visits History for ${patientName} (ID: ${patientId})

Total Visits: ${visits.length}

${visits.map((visit, index) => {
      return `${index + 1}. ${new Date(visit.date).toLocaleDateString()}${visit.time ? ` at ${visit.time}` : ''} - ${visit.type} (${visit.status})${visit.notes ? `\nNotes: ${visit.notes}` : ''}`;
    }).join('\n\n')}

Computer Generated Medical Visits History
Generated: ${new Date().toISOString()}
`;

    if (method === 'share') {
      // Use Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: `Medical Visits History - ${patientName}`,
          text: visitsSummary,
        })
        .then(() => {
          toast({
            title: "Shared successfully",
            description: "Visits history has been shared.",
            duration: 3000,
          });
        })
        .catch((error) => {
          // Don't show error if user cancelled the share
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            toast({
              title: "Share failed",
              description: "Failed to share visits history. Please try again.",
              variant: "destructive",
              duration: 3000,
            });
          }
        });
      } else {
        // Fallback to copy to clipboard
        copyToClipboard(visitsSummary);
      }
    } else if (method === 'email') {
      // Create email with visits details
      const subject = encodeURIComponent(`Medical Visits History - ${patientName}`);
      const body = encodeURIComponent(visitsSummary);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
      toast({
        title: "Email client opened",
        description: "Please complete the email with recipient details.",
        duration: 3000,
      });
    } else if (method === 'copy') {
      // Copy visits summary to clipboard
      copyToClipboard(visitsSummary);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Medical Visits History
            <span className="text-sm font-normal text-gray-500">
              ({showAllVisits ? visits.length : Math.min(visits.length, RECENT_LIMIT)} of {visits.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => handlePrintVisits()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print all visits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShareVisits('share')}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No medical visits recorded yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{new Date(visit.date).toLocaleDateString()}</div>
                      {visit.time && <div className="text-sm text-gray-500">{visit.time}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {visit.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      visit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      visit.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.status}
                    </span>
                  </TableCell>
                  <TableCell>{visit.duration || 'N/A'}</TableCell>
                  <TableCell className="max-w-xs truncate">{visit.notes || 'No notes'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Visit Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePrintVisit(visit)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Print Visit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Show All / Show Recent Toggle */}
        {hasMoreVisits && (
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAllVisits(!showAllVisits)}
              className="text-medical-600 hover:text-medical-700"
            >
              {showAllVisits ? (
                <>Show Recent Only ({RECENT_LIMIT})</>
              ) : (
                <>Show All Visits ({visits.length})</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitsTab;
