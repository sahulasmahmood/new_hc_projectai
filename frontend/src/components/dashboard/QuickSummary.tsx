import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface SummaryData {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingBills: number;
  emergencyCases: number;
  activeStaff: number;
}

interface QuickSummaryProps {
  data: SummaryData;
  isLoading?: boolean;
}

export const QuickSummary = ({ data, isLoading }: QuickSummaryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summaryItems = [
    {
      label: "Total Patients",
      value: data.totalPatients,
      color: "text-blue-600"
    },
    {
      label: "Today's Appointments",
      value: data.todayAppointments,
      color: "text-green-600"
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(data.monthlyRevenue),
      color: "text-purple-600"
    },
    {
      label: "Pending Bills",
      value: data.pendingBills,
      color: "text-orange-600"
    },
    {
      label: "Emergency Cases",
      value: data.emergencyCases,
      color: "text-red-600"
    },
    {
      label: "Active Staff",
      value: data.activeStaff,
      color: "text-indigo-600"
    }
  ];



  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div>
                <p className="text-xs text-gray-600">{item.label}</p>
                <p className={`text-lg font-semibold ${item.color}`}>
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};