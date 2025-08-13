import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Info, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ConsultationStartDialogProps {
  appointmentId: number;
  isOpen: boolean;
  onClose: () => void;
  onConsultationStarted: (appointmentData: {
    id: number;
    patientName: string;
    consultationStartTime?: string;
    actualStartTime?: string;
    status: string;
  }) => void;
}

interface ValidationResponse {
  canStart: boolean;
  message: string;
  messageType: "error" | "warning" | "info" | "success";
  appointment: {
    id: number;
    patientName: string;
    officialSlot: string;
    scheduledDuration: number;
  };
}

const ConsultationStartDialog = ({
  appointmentId,
  isOpen,
  onClose,
  onConsultationStarted,
}: ConsultationStartDialogProps) => {
  const { toast } = useToast();
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  // Validate timing when dialog opens
  const validateTiming = async () => {
    if (!isOpen || validating) return;

    try {
      setValidating(true);
      const response = await api.get(
        `/appointments/${appointmentId}/validate-start`
      );
      setValidation(response.data);
    } catch (error) {
      console.error("Error validating consultation timing:", error);
      toast({
        title: "Validation Error",
        description: "Failed to validate consultation timing",
        variant: "destructive",
      });
      onClose();
    } finally {
      setValidating(false);
    }
  };

  // Start consultation
  const handleStartConsultation = async (forceStart = false) => {
    try {
      setLoading(true);
      const response = await api.post(
        `/appointments/${appointmentId}/start-consultation`,
        {
          forceStart,
        }
      );

      toast({
        title: "Consultation Started",
        description: response.data.timeInfo.message,
      });

      onConsultationStarted(response.data.appointment);
      onClose();
    } catch (error: unknown) {
      console.error("Error starting consultation:", error);
      toast({
        title: "Error",
        description:
          (error as { response?: { data?: { error?: string } } })?.response
            ?.data?.error || "Failed to start consultation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate when dialog opens
  if (isOpen && !validation && !validating) {
    validateTiming();
  }

  const getIcon = (messageType: string) => {
    switch (messageType) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBadgeColor = (messageType: string) => {
    switch (messageType) {
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-medical-500" />
            Start Consultation
          </AlertDialogTitle>
        </AlertDialogHeader>

        {validating && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500"></div>
            <span className="ml-3 text-gray-600">Validating timing...</span>
          </div>
        )}

        {validation && (
          <div className="space-y-4">
            {/* Patient and Appointment Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-900">
                {validation.appointment.patientName}
              </div>
              <div className="text-sm text-gray-600">
                Official Time Slot: {validation.appointment.officialSlot}
              </div>
              <div className="text-sm text-gray-600">
                Duration: {validation.appointment.scheduledDuration} minutes
              </div>
            </div>

            {/* Timing Message */}
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
              {getIcon(validation.messageType)}
              <div className="flex-1">
                <Badge
                  className={getBadgeColor(validation.messageType)}
                  variant="outline"
                >
                  {validation.messageType.toUpperCase()}
                </Badge>
                <AlertDialogDescription className="mt-2 text-sm">
                  {validation.message}
                </AlertDialogDescription>
              </div>
            </div>

            {/* Additional Info for Business Logic */}
            {validation.canStart && validation.messageType !== "success" && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="text-xs font-medium text-blue-800 mb-1">
                  Business Rule
                </div>
                <div className="text-xs text-blue-700">
                  For billing and consistency, all consultations are recorded
                  using the official scheduled time slot, regardless of actual
                  start time.
                </div>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>

          {validation?.canStart && (
            <AlertDialogAction
              onClick={() => handleStartConsultation(false)}
              disabled={loading}
              className="bg-medical-500 hover:bg-medical-600"
            >
              {loading ? "Starting..." : "Start Consultation"}
            </AlertDialogAction>
          )}

          {!validation?.canStart && validation?.messageType === "error" && (
            <AlertDialogAction
              onClick={() => handleStartConsultation(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Starting..." : "Force Start"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConsultationStartDialog;
