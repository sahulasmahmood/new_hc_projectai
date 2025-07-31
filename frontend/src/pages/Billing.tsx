
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Plus, Search, Filter, IndianRupee, Download, Eye, Receipt, FileText, Calendar, User } from "lucide-react";

const Billing = () => {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

  const bills = [
    {
      id: "INV-2024-001",
      patientName: "Aarav Sharma",
      patientId: "P001",
      date: "2024-01-20",
      amount: 2500,
      status: "Paid",
      paymentMethod: "UPI",
      insuranceProvider: "Star Health",
      insuranceClaim: 2000,
      services: ["Consultation", "Blood Test", "X-Ray"],
      gstAmount: 450
    },
    {
      id: "INV-2024-002",
      patientName: "Priya Patel",
      patientId: "P002",
      date: "2024-01-19",
      amount: 5500,
      status: "Pending",
      paymentMethod: null,
      insuranceProvider: "HDFC Ergo",
      insuranceClaim: 4000,
      services: ["Surgery", "Room Charges", "Medicines"],
      gstAmount: 990
    },
    {
      id: "INV-2024-003",
      patientName: "Rahul Kumar",
      patientId: "P003",
      date: "2024-01-18",
      amount: 1200,
      status: "Overdue",
      paymentMethod: null,
      insuranceProvider: null,
      insuranceClaim: 0,
      services: ["Consultation", "Prescription"],
      gstAmount: 216
    },
    {
      id: "INV-2024-004",
      patientName: "Sneha Gupta",
      patientId: "P004",
      date: "2024-01-17",
      amount: 8500,
      status: "Paid",
      paymentMethod: "Credit Card",
      insuranceProvider: "LIC Health",
      insuranceClaim: 6000,
      services: ["ICU Charges", "Medicines", "Tests"],
      gstAmount: 1530
    }
  ];

  const filteredBills = bills.filter(bill => {
    const matchesStatus = selectedStatus === "all" || bill.status === selectedStatus;
    const matchesSearch = bill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Overdue": return "bg-red-100 text-red-800";
      case "Cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const totalRevenue = bills.filter(b => b.status === "Paid").reduce((sum, bill) => sum + bill.amount, 0);
  const pendingAmount = bills.filter(b => b.status === "Pending" || b.status === "Overdue").reduce((sum, bill) => sum + bill.amount, 0);
  const totalGST = bills.filter(b => b.status === "Paid").reduce((sum, bill) => sum + bill.gstAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Billing & Insurance</h1>
        </div>
        <Dialog open={isCreateBillOpen} onOpenChange={setIsCreateBillOpen}>
          <DialogTrigger asChild>
            <Button className="bg-medical-500 hover:bg-medical-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Patient Name" />
                <Input placeholder="Patient ID" />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation - ₹500</SelectItem>
                  <SelectItem value="bloodtest">Blood Test - ₹300</SelectItem>
                  <SelectItem value="xray">X-Ray - ₹800</SelectItem>
                  <SelectItem value="surgery">Surgery - ₹25000</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Insurance Provider" />
                <Input placeholder="Insurance Policy Number" />
              </div>
              <Input placeholder="Total Amount (₹)" type="number" />
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateBillOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button className="bg-medical-500 hover:bg-medical-600">
                  Create Bill
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{bills.length}</div>
            <div className="text-sm text-gray-600">Total Bills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">₹{totalGST.toLocaleString()}</div>
            <div className="text-sm text-gray-600">GST Collected</div>
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
                placeholder="Search by patient name, bill ID, or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.map((bill) => (
          <Card key={bill.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-medical-50 rounded-lg">
                    <Receipt className="h-5 w-5 text-medical-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{bill.id}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{bill.patientName} ({bill.patientId})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{bill.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₹{bill.amount.toLocaleString()}</div>
                  <Badge className={getStatusColor(bill.status)}>
                    {bill.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Services</div>
                  <div className="space-y-1">
                    {bill.services.map((service, index) => (
                      <Badge key={index} variant="outline" className="mr-1">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {bill.insuranceProvider && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Insurance</div>
                    <div className="font-medium">{bill.insuranceProvider}</div>
                    <div className="text-sm text-green-600">Claim: ₹{bill.insuranceClaim.toLocaleString()}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Payment Details</div>
                  {bill.paymentMethod ? (
                    <div className="font-medium text-green-600">{bill.paymentMethod}</div>
                  ) : (
                    <div className="font-medium text-yellow-600">Payment Pending</div>
                  )}
                  <div className="text-sm text-gray-600">GST: ₹{bill.gstAmount}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                {bill.status === "Pending" && (
                  <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    Mark Paid
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  GST Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;
