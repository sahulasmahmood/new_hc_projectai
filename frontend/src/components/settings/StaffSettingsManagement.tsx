import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";

interface StaffSettings {
  roles: string[];
  departments: string[];
  shifts: string[];
}

const defaultShifts = [
  "Morning Shift",
  "Evening Shift",
  "Night Shift",
  "General Shift"
];

const StaffSettingsManagement = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<StaffSettings>({
    roles: [],
    departments: [],
    shifts: []
  });
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newShift, setNewShift] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings/staff-settings");
      setSettings({
        ...res.data,
        shifts: res.data.shifts || defaultShifts
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAdd = async (type: "role" | "department" | "shift") => {
    let value = "";
    if (type === "role") value = newRole.trim();
    if (type === "department") value = newDepartment.trim();
    if (type === "shift") value = newShift.trim();
    if (!value) return;
    try {
      setLoading(true);
      if (type === "shift") {
        // Save shifts as part of staff settings
        const updatedShifts = [...(settings.shifts || []), value];
        await api.put("/settings/staff-settings", {
          ...settings,
          shifts: updatedShifts
        });
        setSettings((prev) => ({ ...prev, shifts: updatedShifts }));
        setNewShift("");
        toast({ title: "Success", description: "Shift added" });
      } else {
        await api.post(`/settings/staff-settings/${type}s`, { [type]: value });
        toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} added` });
        if (type === "role") setNewRole("");
        if (type === "department") setNewDepartment("");
        fetchSettings();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add ${type}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: "role" | "department" | "shift", value: string) => {
    try {
      setLoading(true);
      if (type === "shift") {
        const updatedShifts = (settings.shifts || []).filter((s) => s !== value);
        await api.put("/settings/staff-settings", {
          ...settings,
          shifts: updatedShifts
        });
        setSettings((prev) => ({ ...prev, shifts: updatedShifts }));
        toast({ title: "Success", description: "Shift deleted" });
      } else {
        await api.delete(`/settings/staff-settings/${type}s`, { data: { [type]: value } });
        toast({ title: "Success", description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted` });
        fetchSettings();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${type}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Roles</h2>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => handleAdd("role")}>Add</Button>
          </div>
          <ul className="space-y-2">
            {settings.roles.map((role) => (
              <li key={role} className="flex items-center gap-2">
                <span>{role}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete("role", role)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Departments</h2>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new department"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => handleAdd("department")}>Add</Button>
          </div>
          <ul className="space-y-2">
            {settings.departments.map((department) => (
              <li key={department} className="flex items-center gap-2">
                <span>{department}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete("department", department)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Shifts</h2>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new shift"
              value={newShift}
              onChange={(e) => setNewShift(e.target.value)}
              disabled={loading}
            />
            <Button onClick={() => handleAdd("shift")}>Add</Button>
          </div>
          <ul className="space-y-2">
            {(settings.shifts || defaultShifts).map((shift) => (
              <li key={shift} className="flex items-center gap-2">
                <span>{shift}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete("shift", shift)}
                  disabled={loading}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffSettingsManagement;
