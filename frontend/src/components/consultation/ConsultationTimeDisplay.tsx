import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import api from "@/lib/api";

interface ConsultationTimeDisplayProps {
  appointmentId: string;
}

interface AppointmentData {
  actualStartTime?: string;
  consultationEndTime?: string;
  consultationStartTime?: string;
  status: string;
}

const ConsultationTimeDisplay = ({ appointmentId }: ConsultationTimeDisplayProps) => {
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      try {
        const response = await api.get(`/appointments/${appointmentId}`);
        setAppointmentData(response.data);
      } catch (error) {
        console.error('Error fetching appointment data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointmentData();
      
      // Refresh every 30 seconds to keep times updated
      const interval = setInterval(fetchAppointmentData, 30000);
      return () => clearInterval(interval);
    }
  }, [appointmentId]);

  if (loading || !appointmentData) {
    return null;
  }

  // Only show for active consultations
  if (appointmentData.status !== 'Consultation Started') {
    return null;
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
      <div className="flex items-center gap-1 mb-1">
        <Clock className="h-3 w-3" />
        <span className="font-medium">Consultation Times</span>
      </div>
      <div className="space-y-0.5">
        {appointmentData.actualStartTime && (
          <div>
            <span className="text-gray-600">Started:</span> {formatTime(appointmentData.actualStartTime)}
          </div>
        )}

      </div>
    </div>
  );
};

export default ConsultationTimeDisplay;