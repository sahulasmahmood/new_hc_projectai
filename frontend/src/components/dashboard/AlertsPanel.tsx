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
  category?: string;
  supplier?: string;
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
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-center">
            {type === 'stock' 
              ? '✅ All inventory items are well stocked!' 
              : 'No upcoming appointments'}
          </p>
          {type === 'stock' && (
            <p className="text-xs text-center mt-2 text-gray-400">
              All items are above their minimum stock levels
            </p>
          )}
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
            const stockPercentage = stockItem.minStock > 0 ? (stockItem.currentStock / stockItem.minStock) * 100 : 0;
            const isCritical = stockItem.currentStock === 0;
            const isVeryLow = stockItem.currentStock <= stockItem.minStock * 0.5;
            
            return (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                isCritical 
                  ? 'bg-red-100 border-red-300' 
                  : isVeryLow 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{stockItem.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{stockItem.code}</span>
                    {stockItem.category && (
                      <>
                        <span>•</span>
                        <span>{stockItem.category}</span>
                      </>
                    )}
                  </div>
                  {stockItem.supplier && (
                    <p className="text-xs text-gray-500 mt-1">Supplier: {stockItem.supplier}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={isCritical ? "destructive" : isVeryLow ? "destructive" : "secondary"}>
                    {stockItem.currentStock} {stockItem.unit}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Min: {stockItem.minStock} {stockItem.unit}
                  </p>
                  {isCritical && (
                    <p className="text-xs text-red-600 font-medium mt-1">OUT OF STOCK</p>
                  )}
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