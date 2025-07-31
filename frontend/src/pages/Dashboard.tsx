
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Calendar, FileText, TrendingUp, Heart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const stats = [
    { title: "Total Patients", value: "1,234", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Appointments Today", value: "28", icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
    { title: "Health Reports", value: "156", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Active Treatments", value: "89", icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const appointmentData = [
    { day: "Mon", appointments: 24 },
    { day: "Tue", appointments: 32 },
    { day: "Wed", appointments: 28 },
    { day: "Thu", appointments: 35 },
    { day: "Fri", appointments: 31 },
    { day: "Sat", appointments: 18 },
    { day: "Sun", appointments: 12 },
  ];

  const healthTrends = [
    { month: "Jan", patients: 1100 },
    { month: "Feb", patients: 1150 },
    { month: "Mar", patients: 1200 },
    { month: "Apr", patients: 1180 },
    { month: "May", patients: 1234 },
  ];

  const diseaseData = [
    { name: "Respiratory", value: 35, color: "#FF6B6B" },
    { name: "Cardiovascular", value: 25, color: "#4ECDC4" },
    { name: "Digestive", value: 20, color: "#45B7D1" },
    { name: "Neurological", value: 15, color: "#96CEB4" },
    { name: "Other", value: 5, color: "#FECA57" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Healthcare Dashboard</h1>
        <div className="flex items-center space-x-2 text-medical-600">
          <Heart className="h-6 w-6" />
          <span className="text-sm font-medium">AI-Powered Healthcare</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-medical-500" />
              Weekly Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#4FD1C5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-medical-500" />
              Patient Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="patients" stroke="#4FD1C5" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disease Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-500" />
            Disease Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {diseaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
