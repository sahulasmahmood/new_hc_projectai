import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  type: string;
  duration: string;
  status: string;
  notes?: string;
  patientVisibleId?: string;
}

interface TimeSlotSwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  appointments: Appointment[];
  onSwapComplete: () => void;
}

const TimeSlotSwapDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  appointments, 
  onSwapComplete 
}: TimeSlotSwapDialogProps) => {
  const [selectedAppointment1, setSelectedAppointment1] = useState<Appointment | null>(null);
  const [selectedAppointment2, setSelectedAppointment2] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filter appointments that can be swapped (not in progress, completed, or cancelled)
  const swappableAppointments = appointments.filter(app => {
    const blockedStatuses = ["In Progress", "Completed", "Cancelled"];
    return !blockedStatuses.includes(app.status);
  });

  const handleSwap = async () => {
    if (!selectedAppointment1 || !selectedAppointment2) {
      toast({
        title: "Selection Required",
        description: "Please select two appointments to swap.",
        variant: "destructive"
      });
      return;
    }

    if (selectedAppointment1.id === selectedAppointment2.id) {
      toast({
        title: "Invalid Selection",
        description: "Please select two different appointments to swap.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Use new atomic swap endpoint
      await api.post('/appointments/swap', {
        id1: selectedAppointment1.id,
        id2: selectedAppointment2.id
      });

      toast({
        title: "Time Slots Swapped",
        description: `Successfully swapped time slots between ${selectedAppointment1.patientName} and ${selectedAppointment2.patientName}.`,
      });

      onSwapComplete();
      onClose();
      setSelectedAppointment1(null);
      setSelectedAppointment2(null);
    } catch (error: unknown) {
      let errorMessage = "Failed to swap time slots";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
        errorMessage = (error.response.data as { error?: string }).error || errorMessage;
      }
      toast({
        title: "Swap Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canSwap = selectedAppointment1 && selectedAppointment2 && selectedAppointment1.id !== selectedAppointment2.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-medical-500" />
            Swap Time Slots - {format(new Date(selectedDate), 'PPP')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to Swap Time Slots</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Select the first appointment from the left column</p>
              <p>2. Select the second appointment from the right column</p>
              <p>3. Click "Swap Time Slots" to exchange their times</p>
              <p className="text-xs mt-2">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Only confirmed appointments can be swapped
              </p>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* First Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select First Appointment
                {selectedAppointment1 && (
                  <span className="ml-2 text-xs text-green-600">✓ Selected</span>
                )}
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {swappableAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className={`cursor-pointer transition-all ${
                      selectedAppointment1?.id === appointment.id
                        ? 'ring-2 ring-medical-500 bg-medical-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAppointment1(appointment)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{appointment.patientName}</span>
                          <Badge className="text-xs">{appointment.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.type} • {appointment.duration} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Second Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select Second Appointment
                {selectedAppointment2 && (
                  <span className="ml-2 text-xs text-green-600">✓ Selected</span>
                )}
              </Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {swappableAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className={`cursor-pointer transition-all ${
                      selectedAppointment2?.id === appointment.id
                        ? 'ring-2 ring-medical-500 bg-medical-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedAppointment2(appointment)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{appointment.patientName}</span>
                          <Badge className="text-xs">{appointment.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.type} • {appointment.duration} min
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Swap Preview */}
          {canSwap && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">Swap Preview</h4>
              <div className="grid grid-cols-3 gap-4 items-center text-sm">
                <div className="text-center">
                  <div className="font-medium">{selectedAppointment1.patientName}</div>
                  <div className="text-gray-600">{selectedAppointment1.time}</div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-medical-500" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{selectedAppointment2.time}</div>
                  <div className="text-gray-600">New time</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center text-sm mt-3">
                <div className="text-center">
                  <div className="font-medium">{selectedAppointment2.patientName}</div>
                  <div className="text-gray-600">{selectedAppointment2.time}</div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-medical-500" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{selectedAppointment1.time}</div>
                  <div className="text-gray-600">New time</div>
                </div>
              </div>
            </div>
          )}

          {/* No swappable appointments */}
          {swappableAppointments.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Swappable Appointments</h3>
              <p className="text-gray-500">
                All appointments for this date are either in progress, completed, or cancelled and cannot be swapped.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!canSwap || loading || swappableAppointments.length === 0}
            className="bg-medical-500 hover:bg-medical-600"
          >
            {loading ? "Swapping..." : "Swap Time Slots"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotSwapDialog;