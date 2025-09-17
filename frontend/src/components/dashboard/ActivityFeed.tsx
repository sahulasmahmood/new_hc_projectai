import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, DollarSign, Activity } from "lucide-react";

interface ActivityItem {
  type: string;
  message: string;
  time: string;
  patientId?: string;
  amount?: number;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export const ActivityFeed = ({ activities, isLoading }: ActivityFeedProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'prescription': return <FileText className="h-4 w-4" />;
      case 'billing': return <DollarSign className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'text-blue-600';
      case 'prescription': return 'text-green-600';
      case 'billing': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <ScrollArea className="h-[280px]">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-400">Loading activities...</div>
        </div>
      </ScrollArea>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <ScrollArea className="h-[280px]">
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No recent activities</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[280px]">
      <div className="space-y-2 pr-2">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className={`p-1 rounded-full bg-white ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 leading-tight">{activity.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">
                  {formatTime(activity.time)}
                </p>
                {activity.patientId && (
                  <Badge variant="outline" className="text-xs">
                    {activity.patientId}
                  </Badge>
                )}
                {activity.amount && (
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(activity.amount)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};