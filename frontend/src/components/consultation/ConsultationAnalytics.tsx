import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Target } from "lucide-react";

interface ConsultationAnalyticsProps {
  appointment: {
    consultationStartTime?: string;
    consultationEndTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
    time: string;
    duration: string;
  };
}

const ConsultationAnalytics = ({ appointment }: ConsultationAnalyticsProps) => {
  if (!appointment.consultationStartTime || !appointment.actualStartTime) {
    return null;
  }

  const scheduledStart = new Date(appointment.consultationStartTime);
  const actualStart = new Date(appointment.actualStartTime);
  const startVariance = Math.round((actualStart.getTime() - scheduledStart.getTime()) / 60000);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const getVarianceBadge = (variance: number) => {
    if (Math.abs(variance) <= 2) {
      return <Badge className="bg-green-100 text-green-800">On Time</Badge>;
    } else if (variance < 0) {
      return <Badge className="bg-blue-100 text-blue-800">Early ({Math.abs(variance)}m)</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Late ({variance}m)</Badge>;
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (Math.abs(variance) <= 2) {
      return <Target className="h-4 w-4 text-green-500" />;
    } else if (variance < 0) {
      return <TrendingDown className="h-4 w-4 text-blue-500" />;
    } else {
      return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-medical-500" />
          Consultation Time Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Official Slot</div>
            <div className="font-medium">
              {formatTime(scheduledStart)} - {formatTime(new Date(appointment.consultationEndTime!))}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Actual Start</div>
            <div className="font-medium">{formatTime(actualStart)}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {getVarianceIcon(startVariance)}
            <span className="text-sm text-gray-600">Start Time</span>
          </div>
          {getVarianceBadge(startVariance)}
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Note:</strong> For billing and consistency, the official scheduled time slot is always used regardless of actual start time.
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationAnalytics;