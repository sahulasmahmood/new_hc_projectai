import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  icon: LucideIcon;
  isLoading?: boolean;
  children: ReactNode;
  height?: string;
}

export const ChartCard = ({ 
  title, 
  icon: Icon, 
  isLoading = false, 
  children, 
  height = "h-[300px]" 
}: ChartCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-medical-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={height}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
};