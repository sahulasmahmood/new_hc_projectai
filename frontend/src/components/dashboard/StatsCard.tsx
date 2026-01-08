import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
  trend?: string;
  trendUp?: boolean;
  isLoading?: boolean;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  trend, 
  trendUp = true, 
  isLoading = false 
}: StatsCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-full ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              {trendUp ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-900">
            {isLoading ? '...' : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};