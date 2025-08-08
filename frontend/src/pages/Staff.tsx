import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
// Removed Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger import as dialogs are handled in StaffEditDialog
import {
  Users,
  Plus,
  Search,
  Filter,
  Stethoscope,
  User,
  UserCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Shield,
} from "lucide-react";

import { StaffMember } from "@/types/staff";
import StaffDetailsDialog from "@/components/staff/StaffDetailsDialog";
import StaffEditDialog from "@/components/staff/StaffEditDialog";
import RolesResponsibility from "@/components/staff/RolesResponsibility";
import { useToast } from "@/hooks/use-toast";

const Staff = () => {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 2x3 grid for better layout



  const fetchStaffMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/staff");
      setStaffMembers(response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  // Fetch departments from new API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/staff/departments");
        setDepartments(response.data.departments || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        // Fallback to default departments if API fails
        setDepartments([
          { id: 1, name: "Cardiology" },
          { id: 2, name: "ICU" },
          { id: 3, name: "Pediatrics" },
          { id: 4, name: "Laboratory" },
          { id: 5, name: "Emergency" },
          { id: 6, name: "Orthopedics" },
        ]);
      }
    };

    fetchDepartments();
  }, []);

  const filteredStaff = staffMembers.filter((member) => {
    const departmentName = member.department?.name || "";
    const matchesDepartment =
      selectedDepartment === "all" || departmentName === selectedDepartment;
    const matchesSearch =
      !searchQuery ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.employeeId && member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDepartment && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDepartment, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Duty":
        return "bg-green-100 text-green-800";
      case "Off Duty":
        return "bg-red-100 text-red-800";
      case "Break":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    if (role.includes("Dr.") || role.includes("Doctor"))
      return <Stethoscope className="h-4 w-4" />;
    if (role.includes("Nurse")) return <User className="h-4 w-4" />;
    return <UserCheck className="h-4 w-4" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to convert 24h time to 12h format with AM/PM
  const formatTimeTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff Directory
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Responsibilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {staffMembers.length}
            </div>
            <div className="text-sm text-gray-600">Total Staff</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {staffMembers.filter((s) => s.status === "On Duty").length}
            </div>
            <div className="text-sm text-gray-600">On Duty</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staffMembers.filter((s) => 
                s.role.toLowerCase().includes("doctor") || 
                s.role.toLowerCase().includes("dr.")
              ).length}
            </div>
            <div className="text-sm text-gray-600">Doctors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {staffMembers.filter((s) => 
                s.role.toLowerCase().includes("nurse")
              ).length}
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
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-200 rounded-lg w-10 h-10"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentStaff.map((member) => (
            <Card
              key={member.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedStaff(member);
                setIsDetailsOpen(true);
              }}
            >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
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
                {member.employeeId && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{member.employeeId}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{member.department?.name || "No Department"}</span>
                </div>
                {member.shiftTime ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{member.shiftTime.name} ({formatTimeTo12Hour(member.shiftTime.startTime)} - {formatTimeTo12Hour(member.shiftTime.endTime)})</span>
                  </div>
                ) : member.shift && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{member.shift} Shift</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{member.email}</span>
                  </div>
                )}
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
                  <div className="text-sm text-gray-600 mb-1">
                    Consultation Fee
                  </div>
                  <div className="font-medium text-green-600">
                    {member.consultationFee}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStaff(member);
                    setIsDetailsOpen(true);
                  }}
                >
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStaffToEdit(member);
                    setIsEditOpen(true);
                  }}
                >
                  Edit
                </Button>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredStaff.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No staff found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff members
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Staff Details Dialog */}
      <StaffDetailsDialog
        staff={selectedStaff}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onEdit={(staff) => {
          setStaffToEdit(staff);
          setIsDetailsOpen(false);
          setIsEditOpen(true);
        }}
      />

      {/* Staff Edit Dialog */}
      <StaffEditDialog
        staff={staffToEdit}
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setStaffToEdit(null);
          }
        }}
        onSave={() => {
          setStaffToEdit(null);
          setIsEditOpen(false);
          fetchStaffMembers();
        }}
      />

      {/* Add Staff Dialog */}
      <StaffEditDialog
        staff={null}
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
        }}
        onSave={() => {
          setIsAddModalOpen(false);
          fetchStaffMembers();
        }}
      />
        </TabsContent>

        <TabsContent value="roles">
          <RolesResponsibility />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Staff;
