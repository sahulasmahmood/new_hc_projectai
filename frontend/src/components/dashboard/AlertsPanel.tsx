import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";

interface StockItem {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

interface Appointment {
  id: number;
  time: string;
  date: string;
  patient?: {
    name: string;
    phone: string;
  };
  patientName?: string;
  patientPhone?: string;
}

interface AlertsPanelProps {
  type: 'stock' | 'appointments';
  title: string;
  items: StockItem[] | Appointment[];
  isLoading?: boolean;
}

export const AlertsPanel = ({ type, title, items, isLoading }: AlertsPanelProps) => {
  if (isLoading) {
    return (
      <ScrollArea className="h-[250px]">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </ScrollArea>
    );
  }

  if (!items || items.length === 0) {
    return (
      <ScrollArea className="h-[250px]">
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No {type === 'stock' ? 'low stock alerts' : 'upcoming appointments'}</p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[250px]">
      <div className="space-y-3">
        {items.map((item, index) => {
          if (type === 'stock') {
            const stockItem = item as StockItem;
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{stockItem.name}</p>
                  <p className="text-sm text-gray-600">Code: {stockItem.code}</p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">
                    {stockItem.currentStock} / {stockItem.minStock}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{stockItem.unit}</p>
                </div>
              </div>
            );
          } else {
            const appointment = item as Appointment;
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {appointment.patient?.name || appointment.patientName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {appointment.patient?.phone || appointment.patientPhone}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {appointment.time}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(appointment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          }
        })}
      </div>
    </ScrollArea>
  );
};