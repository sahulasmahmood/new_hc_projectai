
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const Analytics = () => {
  const revenueTrendData = [
    { month: "Jan", revenue: 45000, expenses: 32000 },
    { month: "Feb", revenue: 52000, expenses: 35000 },
    { month: "Mar", revenue: 48000, expenses: 33000 },
    { month: "Apr", revenue: 61000, expenses: 38000 },
    { month: "May", revenue: 55000, expenses: 36000 },
    { month: "Jun", revenue: 67000, expenses: 42000 },
  ];

  const departmentPerformanceData = [
    { department: "Cardiology", patients: 245, revenue: 125000, satisfaction: 4.8 },
    { department: "Orthopedics", patients: 189, revenue: 98000, satisfaction: 4.6 },
    { department: "Neurology", patients: 156, revenue: 87000, satisfaction: 4.7 },
    { department: "Pediatrics", patients: 201, revenue: 76000, satisfaction: 4.9 },
    { department: "Emergency", patients: 298, revenue: 112000, satisfaction: 4.5 },
  ];

  const appointmentStatusData = [
    { name: "Completed", count: 156, color: "#10B981" },
    { name: "Scheduled", count: 89, color: "#3B82F6" },
    { name: "Cancelled", count: 23, color: "#EF4444" },
    { name: "No Show", count: 12, color: "#F59E0B" },
  ];

  const wardOccupancyData = [
    { ward: "ICU", total: 20, occupied: 18 },
    { ward: "General Ward A", total: 40, occupied: 32 },
    { ward: "General Ward B", total: 40, occupied: 28 },
    { ward: "Pediatric Ward", total: 25, occupied: 15 },
    { ward: "Maternity Ward", total: 30, occupied: 22 },
  ];

  const chartConfig = {
    revenue: { label: "Revenue", color: "#3B82F6" },
    expenses: { label: "Expenses", color: "#EF4444" },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600">Insights into hospital performance and operations</p>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              Total Revenue: ${revenueTrendData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Total Expenses: ${revenueTrendData.reduce((sum, item) => sum + item.expenses, 0).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={departmentPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ChartContainer>
          <div className="mt-4">
            {departmentPerformanceData.map((item) => (
              <div key={item.department} className="flex justify-between items-center text-sm text-gray-600 py-1">
                <span>{item.department}</span>
                <span>Revenue: ${item.revenue.toLocaleString()}, Satisfaction: {item.satisfaction}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={appointmentStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {appointmentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {appointmentStatusData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.count} ({((Number(item.count) / appointmentStatusData.reduce((sum, i) => sum + Number(i.count), 0)) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ward Occupancy */}
      <Card>
        <CardHeader>
          <CardTitle>Ward Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wardOccupancyData.map((ward) => (
              <div key={ward.ward}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{ward.ward}</span>
                  <span className="text-sm text-gray-600">
                    {ward.occupied}/{ward.total} ({Math.round((Number(ward.occupied) / Number(ward.total)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(Number(ward.occupied) / Number(ward.total)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
