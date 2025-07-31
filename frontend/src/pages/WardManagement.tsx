import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Bed, Plus, Search, Filter, User, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WardManagement = () => {
  const { toast } = useToast();
  const [selectedWard, setSelectedWard] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddWardOpen, setIsAddWardOpen] = useState(false);
  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [newWard, setNewWard] = useState({
    name: "",
    floor: "",
    totalBeds: "",
    type: "",
    nurseInCharge: ""
  });
  const [newBed, setNewBed] = useState({
    bedNumber: "",
    wardId: ""
  });

  const wards = [
    {
      id: 1,
      name: "General Ward A",
      floor: "Ground Floor",
      totalBeds: 20,
      occupiedBeds: 15,
      availableBeds: 5,
      type: "General",
      nurseInCharge: "Sr. Priya Sharma"
    },
    {
      id: 2,
      name: "ICU Ward",
      floor: "First Floor",
      totalBeds: 10,
      occupiedBeds: 8,
      availableBeds: 2,
      type: "ICU",
      nurseInCharge: "Sr. Meera Singh"
    },
    {
      id: 3,
      name: "Pediatric Ward",
      floor: "Second Floor",
      totalBeds: 15,
      occupiedBeds: 10,
      availableBeds: 5,
      type: "Pediatric",
      nurseInCharge: "Sr. Anita Kumari"
    }
  ];

  const beds = [
    {
      id: 1,
      bedNumber: "A-001",
      wardId: 1,
      status: "Occupied",
      patientName: "Ramesh Kumar",
      patientId: "P001",
      admissionDate: "2024-01-15",
      condition: "Stable",
      doctor: "Dr. Rajesh Kumar"
    },
    {
      id: 2,
      bedNumber: "A-002",
      wardId: 1,
      status: "Available",
      patientName: null,
      patientId: null,
      admissionDate: null,
      condition: null,
      doctor: null
    },
    {
      id: 3,
      bedNumber: "I-001",
      wardId: 2,
      status: "Occupied",
      patientName: "Sunita Devi",
      patientId: "P002",
      admissionDate: "2024-01-20",
      condition: "Critical",
      doctor: "Dr. Anjali Patel"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-green-100 text-green-800";
      case "Occupied": return "bg-red-100 text-red-800";
      case "Maintenance": return "bg-yellow-100 text-yellow-800";
      case "Reserved": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Stable": return "bg-green-100 text-green-800";
      case "Critical": return "bg-red-100 text-red-800";
      case "Moderate": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddWard = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWard.name || !newWard.floor || !newWard.totalBeds || !newWard.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    console.log("Adding new ward:", newWard);
    
    toast({
      title: "Ward Added",
      description: `${newWard.name} has been successfully added.`,
    });
    
    setNewWard({ name: "", floor: "", totalBeds: "", type: "", nurseInCharge: "" });
    setIsAddWardOpen(false);
  };

  const handleAddBed = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBed.bedNumber || !newBed.wardId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    console.log("Adding new bed:", newBed);
    
    toast({
      title: "Bed Added",
      description: `Bed ${newBed.bedNumber} has been successfully added.`,
    });
    
    setNewBed({ bedNumber: "", wardId: "" });
    setIsAddBedOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Ward Management</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddBedOpen} onOpenChange={setIsAddBedOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bed className="h-4 w-4 mr-2" />
                Add Bed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bed</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBed} className="space-y-4">
                <Input 
                  placeholder="Bed Number (e.g., A-001) *" 
                  value={newBed.bedNumber}
                  onChange={(e) => setNewBed({...newBed, bedNumber: e.target.value})}
                  required
                />
                <Select value={newBed.wardId} onValueChange={(value) => setNewBed({...newBed, wardId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Ward *" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id.toString()}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddBedOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-medical-500 hover:bg-medical-600">
                    Add Bed
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddWardOpen} onOpenChange={setIsAddWardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-medical-500 hover:bg-medical-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Ward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Ward</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWard} className="space-y-4">
                <Input 
                  placeholder="Ward Name *" 
                  value={newWard.name}
                  onChange={(e) => setNewWard({...newWard, name: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Floor *" 
                  value={newWard.floor}
                  onChange={(e) => setNewWard({...newWard, floor: e.target.value})}
                  required
                />
                <Input 
                  placeholder="Total Beds *" 
                  type="number" 
                  value={newWard.totalBeds}
                  onChange={(e) => setNewWard({...newWard, totalBeds: e.target.value})}
                  required
                />
                <Select value={newWard.type} onValueChange={(value) => setNewWard({...newWard, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ward Type *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="Pediatric">Pediatric</SelectItem>
                    <SelectItem value="Maternity">Maternity</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  placeholder="Nurse In-Charge" 
                  value={newWard.nurseInCharge}
                  onChange={(e) => setNewWard({...newWard, nurseInCharge: e.target.value})}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddWardOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-medical-500 hover:bg-medical-600">
                    Add Ward
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{wards.length}</div>
            <div className="text-sm text-gray-600">Total Wards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {wards.reduce((acc, ward) => acc + ward.totalBeds, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Beds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {wards.reduce((acc, ward) => acc + ward.availableBeds, 0)}
            </div>
            <div className="text-sm text-gray-600">Available Beds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {wards.reduce((acc, ward) => acc + ward.occupiedBeds, 0)}
            </div>
            <div className="text-sm text-gray-600">Occupied Beds</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wards">Ward Overview</TabsTrigger>
          <TabsTrigger value="beds">Bed Management</TabsTrigger>
          <TabsTrigger value="admissions">Patient Admissions</TabsTrigger>
        </TabsList>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map((ward) => (
              <Card key={ward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{ward.name}</span>
                    <Badge variant="outline">{ward.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">{ward.floor}</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Beds:</span>
                      <span className="font-medium">{ward.totalBeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Occupied:</span>
                      <span className="font-medium text-red-600">{ward.occupiedBeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Available:</span>
                      <span className="font-medium text-green-600">{ward.availableBeds}</span>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(ward.occupiedBeds / ward.totalBeds) * 100}%` }}
                    ></div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 mb-1">Nurse In-Charge</div>
                    <div className="font-medium">{ward.nurseInCharge}</div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search beds by number or patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map((ward) => (
                      <SelectItem key={ward.id} value={ward.id.toString()}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {beds.map((bed) => (
              <Card key={bed.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      <span className="font-medium">{bed.bedNumber}</span>
                    </div>
                    <Badge className={getStatusColor(bed.status)}>
                      {bed.status}
                    </Badge>
                  </div>

                  {bed.status === "Occupied" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{bed.patientName}</span>
                      </div>
                      <div className="text-xs text-gray-600">ID: {bed.patientId}</div>
                      <div className="text-xs text-gray-600">
                        Admitted: {bed.admissionDate}
                      </div>
                      <Badge className={getConditionColor(bed.condition || "")}>
                        {bed.condition}
                      </Badge>
                      <div className="text-xs text-gray-600">Dr: {bed.doctor}</div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Available for admission</div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                  >
                    {bed.status === "Occupied" ? "View Patient" : "Assign Patient"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admissions">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Admissions</h3>
                <p className="text-gray-600">Admission and discharge management coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WardManagement;
