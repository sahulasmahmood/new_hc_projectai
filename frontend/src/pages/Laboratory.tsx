
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FlaskConical, Plus, Search, Filter, Clock, CheckCircle, AlertCircle, FileText, User } from "lucide-react";

const Laboratory = () => {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const testCategories = [
    "Blood Tests", "Urine Tests", "Stool Tests", "Biochemistry", 
    "Microbiology", "Pathology", "Radiology", "Cardiology"
  ];

  const tests = [
    {
      id: 1,
      testId: "LAB001",
      patientName: "Ramesh Kumar",
      patientId: "P001",
      testType: "Complete Blood Count",
      category: "Blood Tests",
      orderedBy: "Dr. Rajesh Kumar",
      orderedDate: "2024-01-25",
      sampleCollected: "2024-01-25 09:30",
      status: "Completed",
      priority: "Normal",
      cost: "₹500"
    },
    {
      id: 2,
      testId: "LAB002",
      patientName: "Sunita Devi",
      patientId: "P002",
      testType: "Liver Function Test",
      category: "Biochemistry",
      orderedBy: "Dr. Anjali Patel",
      orderedDate: "2024-01-25",
      sampleCollected: null,
      status: "Pending Collection",
      priority: "Urgent",
      cost: "₹800"
    },
    {
      id: 3,
      testId: "LAB003",
      patientName: "Amit Sharma",
      patientId: "P003",
      testType: "X-Ray Chest",
      category: "Radiology",
      orderedBy: "Dr. Rajesh Kumar",
      orderedDate: "2024-01-24",
      sampleCollected: "2024-01-24 14:15",
      status: "In Progress",
      priority: "Normal",
      cost: "₹600"
    }
  ];

  const testTemplates = [
    { name: "Complete Blood Count", category: "Blood Tests", cost: "₹500", duration: "2-4 hours" },
    { name: "Liver Function Test", category: "Biochemistry", cost: "₹800", duration: "4-6 hours" },
    { name: "Kidney Function Test", category: "Biochemistry", cost: "₹700", duration: "4-6 hours" },
    { name: "Thyroid Profile", category: "Biochemistry", cost: "₹900", duration: "6-8 hours" },
    { name: "Urine Routine", category: "Urine Tests", cost: "₹200", duration: "1-2 hours" },
    { name: "ECG", category: "Cardiology", cost: "₹300", duration: "30 minutes" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Pending Collection": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Normal": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Management</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-medical-500 hover:bg-medical-600">
              <Plus className="h-4 w-4 mr-2" />
              New Test Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Test Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <Input placeholder="Enter Patient ID" />
                </div>
                <div>
                  <label className="text-sm font-medium">Patient Name</label>
                  <Input placeholder="Patient Name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Test Category</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {testCategories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Test Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Test" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTemplates.map((test) => (
                      <SelectItem key={test.name} value={test.name.toLowerCase()}>
                        {test.name} - {test.cost}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ordered By</label>
                  <Input placeholder="Doctor Name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Clinical Notes</label>
                <Textarea placeholder="Enter any relevant clinical information..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-medical-500 hover:bg-medical-600">Create Order</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {tests.filter(t => t.status === "Pending Collection").length}
            </div>
            <div className="text-sm text-gray-600">Pending Collection</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tests.filter(t => t.status === "In Progress").length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {tests.filter(t => t.status === "Completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Test Orders</TabsTrigger>
          <TabsTrigger value="templates">Test Templates</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, test ID, or test type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending Collection</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-lg">{test.testId}</div>
                        <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                        <Badge className={getPriorityColor(test.priority)}>{test.priority}</Badge>
                      </div>
                      <div className="text-xl font-medium">{test.testType}</div>
                      <div className="text-sm text-gray-600">Category: {test.category}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold text-lg text-green-600">{test.cost}</div>
                      <div className="text-sm text-gray-600">Cost</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{test.patientName}</span>
                      </div>
                      <div className="text-sm text-gray-600">ID: {test.patientId}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Ordered by:</span> {test.orderedBy}
                      </div>
                      <div className="text-sm text-gray-600">Date: {test.orderedDate}</div>
                    </div>
                    <div className="space-y-2">
                      {test.sampleCollected ? (
                        <div className="text-sm">
                          <span className="font-medium">Sample Collected:</span>
                          <div className="text-gray-600">{test.sampleCollected}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-yellow-600 font-medium">
                          Sample collection pending
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {test.status === "Pending Collection" && (
                      <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                        Collect Sample
                      </Button>
                    )}
                    {test.status === "In Progress" && (
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        Update Results
                      </Button>
                    )}
                    {test.status === "Completed" && (
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        Download Report
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testTemplates.map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="font-semibold">{template.name}</div>
                    <Badge variant="outline">{template.category}</Badge>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cost:</span>
                        <span className="font-medium text-green-600">{template.cost}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span className="font-medium">{template.duration}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Laboratory Reports</h3>
                <p className="text-gray-600">Report generation and analytics coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Laboratory;
