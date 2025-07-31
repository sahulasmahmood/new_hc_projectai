
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Eye, Calendar, User, Search, Filter } from "lucide-react";

const Reports = () => {
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const reports = [
    {
      id: 1,
      title: "Blood Test Results",
      patient: "John Smith",
      patientId: "P001",
      date: "2024-01-20",
      type: "Lab Report",
      status: "Completed",
      size: "2.4 MB"
    },
    {
      id: 2,
      title: "X-Ray Chest",
      patient: "Sarah Johnson", 
      patientId: "P002",
      date: "2024-01-19",
      type: "Imaging",
      status: "Reviewed",
      size: "5.1 MB"
    },
    {
      id: 3,
      title: "ECG Report",
      patient: "Michael Brown",
      patientId: "P003", 
      date: "2024-01-18",
      type: "Cardiac",
      status: "Pending Review",
      size: "1.2 MB"
    },
    {
      id: 4,
      title: "MRI Brain Scan",
      patient: "Emily Davis",
      patientId: "P004",
      date: "2024-01-17",
      type: "Imaging", 
      status: "Completed",
      size: "12.8 MB"
    },
    {
      id: 5,
      title: "Diabetes Panel",
      patient: "John Smith",
      patientId: "P001",
      date: "2024-01-16",
      type: "Lab Report",
      status: "Abnormal",
      size: "1.8 MB"
    },
    {
      id: 6,
      title: "Thyroid Function Test",
      patient: "Sarah Johnson",
      patientId: "P002", 
      date: "2024-01-15",
      type: "Lab Report",
      status: "Completed",
      size: "1.5 MB"
    }
  ];

  const patients = [...new Set(reports.map(report => report.patient))];

  const filteredReports = reports.filter(report => {
    const matchesPatient = selectedPatient === "all" || report.patient === selectedPatient;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPatient && matchesSearch;
  });

  const groupedReports = filteredReports.reduce((acc, report) => {
    if (!acc[report.patient]) {
      acc[report.patient] = [];
    }
    acc[report.patient].push(report);
    return acc;
  }, {} as Record<string, typeof reports>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Reviewed": return "bg-blue-100 text-blue-800";
      case "Pending Review": return "bg-yellow-100 text-yellow-800";
      case "Abnormal": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Lab Report": return "🧪";
      case "Imaging": return "📱";
      case "Cardiac": return "❤️";
      default: return "📄";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Patient Reports</h1>
        </div>
        <Button className="bg-medical-500 hover:bg-medical-600">
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
            <div className="text-sm text-gray-600">Total Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === "Completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === "Pending Review").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {reports.filter(r => r.status === "Abnormal").length}
            </div>
            <div className="text-sm text-gray-600">Abnormal</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reports, patients, or types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient} value={patient}>
                      {patient}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient-wise Reports */}
      <div className="space-y-6">
        {Object.entries(groupedReports).map(([patientName, patientReports]) => (
          <Card key={patientName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="h-5 w-5 text-medical-500" />
                {patientName}
                <Badge variant="outline" className="ml-auto">
                  {patientReports.length} Report{patientReports.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patientReports
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getTypeIcon(report.type)}</div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{report.date}</span>
                          </div>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.type}</Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedReports).length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
