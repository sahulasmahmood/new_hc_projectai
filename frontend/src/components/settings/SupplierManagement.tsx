import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ToggleLeft, Truck, Mail, Phone, MapPin, Globe, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    notes: ""
  });
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings/suppliers?includeInactive=true");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingSupplier) {
        await api.put(`/settings/suppliers/${editingSupplier.id}`, formData);
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
      } else {
        await api.post("/settings/suppliers", formData);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingSupplier(null);
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        notes: ""
      });
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      let errorMessage = "Failed to save supplier";
      if (error && typeof error === "object" && "response" in error && (error as { response?: { data?: { error?: string } } }).response?.data?.error) {
        errorMessage = (error as { response: { data: { error: string } } }).response.data.error;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      website: supplier.website || "",
      notes: supplier.notes || ""
    });
    setDialogOpen(true);
  };

  const handleRestore = async (supplier: Supplier) => {
    try {
      await api.patch(`/settings/suppliers/${supplier.id}/restore`);
      toast({
        title: "Restored",
        description: `Supplier '${supplier.name}' has been restored`,
      });
      fetchSuppliers();
    } catch (error) {
      let errorMessage = "Failed to restore supplier";
      if (error && typeof error === "object" && "response" in error && (error as { response?: { data?: { error?: string } } }).response?.data?.error) {
        errorMessage = (error as { response: { data: { error: string } } }).response.data.error;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await api.delete(`/settings/suppliers/${supplierToDelete.id}`);
      toast({
        title: "Supplier Inactivated",
        description: `Supplier '${supplierToDelete.name}' has been made inactive successfully`,
      });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (error) {
      let errorMessage = "Failed to make supplier inactive";
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        errorMessage = (error as { response: { data: { error: string } } }).response.data.error.replace('delete supplier', 'make supplier inactive');
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-medical-500" />
          Suppliers
        </CardTitle>
        <p className="text-gray-600 mt-1">Manage your inventory suppliers and their contact information</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter supplier name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Enter contact person name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="Enter website URL"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter supplier address"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter additional notes"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading suppliers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {/* <Truck className="h-5 w-5 text-medical-500" /> */}
                      {supplier.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {supplier.isActive ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <ToggleLeft className="h-4 w-4" />
                    {/*         Make Inactive */}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(supplier)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={supplier.isActive ? "default" : "secondary"}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Contact:</span>
                      <span>{supplier.contactPerson}</span>
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  
                  {supplier.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{supplier.website}</span>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-xs">{supplier.address}</span>
                    </div>
                  )}
                  
                  {supplier.notes && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                      {supplier.notes}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {new Date(supplier.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && suppliers.length === 0 && (
          <div className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600">Create your first supplier to get started.</p>
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make Supplier Inactive</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <ToggleLeft className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to make this supplier inactive?
                </h3>
                <p className="text-sm text-gray-600">
                  "{supplierToDelete?.name}" will be made inactive. You can restore it later from the list of inactive suppliers.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDelete}>
                  <ToggleLeft className="h-4 w-4 mr-1" /> Make Inactive
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SupplierManagement; 