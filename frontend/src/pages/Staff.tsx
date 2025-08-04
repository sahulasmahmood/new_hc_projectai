import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Search, Filter, Stethoscope, User, UserCheck, Clock, Phone, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: number;
  name: string;
  role: string;
  department: string;
  qualification: string;
  experience?: string;
  phone: string;
  email: string;
  status: string;
  shift?: string;
  consultationFee?: string;
}

const Staff = () => {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "",
    department: "",
    qualification: "",
    experience: "",
    phone: "",
    email: "",
    status: "On Duty",
    shift: "Morning",
    consultationFee: ""
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const fetchStaffMembers = useCallback(async () => {
  setLoading(true);
  try {
    const response = await api.get('/staff', {
      params: {
        department: selectedDepartment === 'all' ? undefined : selectedDepartment,
        search: searchQuery || undefined
      }
    });
    setStaffMembers(response.data);
  } catch (error) {
    console.error('Error fetching staff:', error);
    toast({
      title: "Error",
      description: "Failed to fetch staff members",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
}, [selectedDepartment, searchQuery, toast]);

useEffect(() => {
  const debounceTimer = setTimeout(() => {
    fetchStaffMembers();
  }, 300); // Debounce search for better performance

  return () => clearTimeout(debounceTimer);
}, [selectedDepartment, searchQuery, fetchStaffMembers]);

  const departments = ["Cardiology", "ICU", "Pediatrics", "Laboratory", "Emergency", "Orthopedics"];

  const filteredStaff = staffMembers.filter(member => {
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;
    const matchesSearch = !searchQuery || 
                         member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Duty": return "bg-green-100 text-green-800";
      case "Off Duty": return "bg-red-100 text-red-800";
      case "Break": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes("Dr.") || role.includes("Doctor")) return <Stethoscope className="h-4 w-4" />;
    if (role.includes("Nurse")) return <User className="h-4 w-4" />;
    return <UserCheck className="h-4 w-4" />;
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStaff.name || !newStaff.role || !newStaff.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post('/staff', newStaff);
      
      if (response.data) {
        toast({
          title: "Success",
          description: `${newStaff.name} has been successfully added to the staff.`,
        });
        
        // Reset form and refresh staff list
        setNewStaff({
          name: "",
          role: "",
          department: "",
          qualification: "",
          experience: "",
          phone: "",
          email: "",
          status: "On Duty",
          shift: "Morning",
          consultationFee: ""
        });
        
        setIsAddModalOpen(false);
        fetchStaffMembers(); // Refresh the staff list
      }
    } catch (error) {
      console.error('Error adding staff member:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-medical-500 hover:bg-medical-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <Input 
                placeholder="Full Name *" 
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                required
              />
              <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role *" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">Doctor</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                  <SelectItem value="Admin Staff">Admin Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newStaff.department} onValueChange={(value) => setNewStaff({...newStaff, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department *" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                placeholder="Qualification" 
                value={newStaff.qualification}
                onChange={(e) => setNewStaff({...newStaff, qualification: e.target.value})}
              />
              <Input 
                placeholder="Phone Number" 
                value={newStaff.phone}
                onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
              />
              <Input 
                placeholder="Email Address" 
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              />
              <div className="flex gap-2">
                <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" className="bg-medical-500 hover:bg-medical-600">
                  Add Staff
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{staffMembers.length}</div>
            <div className="text-sm text-gray-600">Total Staff</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter(s => s.status === "On Duty").length}
            </div>
            <div className="text-sm text-gray-600">On Duty</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staffMembers.filter(s => s.role.includes("Dr.")).length}
            </div>
            <div className="text-sm text-gray-600">Doctors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {staffMembers.filter(s => s.role.includes("Nurse")).length}
            </div>
            <div className="text-sm text-gray-600">Nurses</div>
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
                placeholder="Search staff by name, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-medical-50 rounded-lg">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(member.status)}>
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{member.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{member.shift} Shift</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{member.email}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-1">Qualification</div>
                <div className="font-medium">{member.qualification}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Experience</div>
                <div className="font-medium">{member.experience}</div>
              </div>
              
              {member.consultationFee && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Consultation Fee</div>
                  <div className="font-medium text-green-600">{member.consultationFee}</div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Staff;
