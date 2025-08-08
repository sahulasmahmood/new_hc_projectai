import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Users, PenSquare, Plus, Building, Clock, X } from "lucide-react";
import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

const StaffSettingsManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
  });
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/settings/staff-settings/departments');
      if (response.data.success) {
        setDepartments(response.data.departments);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchShifts = useCallback(async () => {
    try {
      const response = await api.get('/settings/staff-settings/shifts');
      if (response.data.success) {
        setShifts(response.data.shifts);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch shifts",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchDepartments();
    fetchShifts();
  }, [fetchDepartments, fetchShifts]);

  // Department handlers
  const handleSaveDepartment = async () => {
    if (!newDepartment.trim()) return;
    
    try {
      const method = editingDepartment ? "PUT" : "POST";
      const body = editingDepartment
        ? { id: editingDepartment.id, name: newDepartment }
        : { name: newDepartment };

      const response = await api[method.toLowerCase() as 'put' | 'post']('/settings/staff-settings/departments', body);
      if (response.data.success) {
        fetchDepartments();
        setNewDepartment("");
        setEditingDepartment(null);
        toast({
          title: "Success",
          description: `Department ${editingDepartment ? 'updated' : 'created'} successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingDepartment ? 'update' : 'create'} department`,
        variant: "destructive"
      });
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartment(department.name);
  };

  const handleCancelDepartmentEdit = () => {
    setEditingDepartment(null);
    setNewDepartment("");
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      const response = await api.delete('/settings/staff-settings/departments', {
        data: { id }
      });
      if (response.data.success) {
        fetchDepartments();
        toast({
          title: "Success",
          description: "Department deleted successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive"
      });
    }
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

  // Helper function to convert 12h time to 24h format
  const formatTimeTo24Hour = (time12: string) => {
    if (!time12) return '';
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleSaveShift = async () => {
    if (!newShift.name.trim() || !newShift.startTime || !newShift.endTime) return;
    
    try {
      const method = editingShift ? "PUT" : "POST";
      const body = editingShift
        ? { ...newShift, id: editingShift.id }
        : newShift;

      const response = await api[method.toLowerCase() as 'put' | 'post']('/settings/staff-settings/shifts', body);
      if (response.data.success) {
        fetchShifts();
        setNewShift({ name: "", startTime: "", endTime: "" });
        setEditingShift(null);
        toast({
          title: "Success",
          description: `Shift ${editingShift ? 'updated' : 'created'} successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingShift ? 'update' : 'create'} shift`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteShift = async (id: number) => {
    try {
      const response = await api.delete('/settings/staff-settings/shifts', {
        data: { id }
      });
      if (response.data.success) {
        fetchShifts();
        toast({
          title: "Success",
          description: "Shift deleted successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive"
      });
    }
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    // Keep the time in 24-hour format for the input fields
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  };

  const handleCancelShiftEdit = () => {
    setEditingShift(null);
    setNewShift({ name: "", startTime: "", endTime: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Staff Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        {/* Departments Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Departments</h2>
            <div className="ml-auto bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {departments.length} Total
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border">
            <div className="flex gap-3">
              <Input
                placeholder="Enter department name (e.g., Cardiology, Emergency)"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button
                className="text-white px-6"
                style={{ backgroundColor: '#3a72ec' }}
                onClick={handleSaveDepartment}
                disabled={!newDepartment.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                {editingDepartment ? "Update" : "Add"}
              </Button>
              {editingDepartment && (
                <Button
                  variant="outline"
                  onClick={handleCancelDepartmentEdit}
                  className="px-4"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border">
            {departments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No departments yet</h3>
                <p className="text-sm">Add your first department to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                      Department Name
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((department, index) => (
                    <tr
                      key={department.id}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                        editingDepartment?.id === department.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-800">{department.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                            onClick={() => handleEditDepartment(department)}
                          >
                            <PenSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteDepartment(department.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Working Shifts Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-6">
            Working Shifts
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Name
              </label>
              <Input
                placeholder="Shift Name"
                value={newShift.name}
                onChange={(e) =>
                  setNewShift({ ...newShift, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift Start Time
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    setNewShift({ ...newShift, startTime: time24 });
                  }}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {newShift.startTime ? formatTimeTo12Hour(newShift.startTime) : 'Select time'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift End Time
              </label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => {
                    const time24 = e.target.value;
                    setNewShift({ ...newShift, endTime: time24 });
                  }}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {newShift.endTime ? formatTimeTo12Hour(newShift.endTime) : 'Select time'}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              className="w-44 text-white"
              style={{ backgroundColor: '#3a72ec' }}
              onClick={handleSaveShift}
              disabled={!newShift.name.trim() || !newShift.startTime || !newShift.endTime}
            >
              {editingShift ? "Update" : "Save"}
            </Button>
            {editingShift && (
              <Button
                variant="outline"
                onClick={handleCancelShiftEdit}
                className="w-32"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg overflow-hidden mt-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                    Shift Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">
                    Shift Timings
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    className="border-b border-gray-200 last:border-0"
                  >
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {shift.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">
                      {formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 mr-2"
                        onClick={() => handleEditShift(shift)}
                      >
                        <PenSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffSettingsManagement;