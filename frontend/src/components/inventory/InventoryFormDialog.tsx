import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id?: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  pricePerUnit: number;
  supplier: string;
  expiryDate?: string;
  batchNumber?: string;
  lastRestocked?: string;
}

interface InventoryFormDialogProps {
  item?: InventoryItem;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const InventoryFormDialog = ({ item, onSuccess, trigger }: InventoryFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InventoryItem>({
    name: "",
    category: "",
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: "",
    pricePerUnit: 0,
    supplier: "",
    expiryDate: "",
    batchNumber: "",
    lastRestocked: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();

  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch categories and suppliers
  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, suppliersRes] = await Promise.all([
        api.get("/settings/categories"),
        api.get("/settings/suppliers")
      ]);
      type Category = { name: string };
      type Supplier = { name: string };
      setCategories((categoriesRes.data as Category[]).map((cat) => cat.name));
      setSuppliers((suppliersRes.data as Supplier[]).map((sup) => sup.name));
    } catch (error) {
      console.error("Error fetching form data:", error);
      // Fallback to static data if API fails
      setCategories(["Medicine", "Equipment", "Supplies", "Consumables"]);
      setSuppliers([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "",
        lastRestocked: item.lastRestocked ? new Date(item.lastRestocked).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        name: "",
        category: "",
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unit: "",
        pricePerUnit: 0,
        supplier: "",
        expiryDate: "",
        batchNumber: "",
        lastRestocked: new Date().toISOString().split('T')[0]
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        pricePerUnit: Number(formData.pricePerUnit),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        lastRestocked: formData.lastRestocked ? new Date(formData.lastRestocked).toISOString() : null
      };

      if (item?.id) {
        await api.put(`/inventory/${item.id}`, submitData);
        toast({
          title: "Success",
          description: "Inventory item updated successfully",
        });
      } else {
        await api.post("/inventory", submitData);
        toast({
          title: "Success",
          description: "Inventory item added successfully",
        });
      }

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to save inventory item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InventoryItem, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-medical-500 hover:bg-medical-600">
            {item ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {item ? "Edit Item" : "Add Item"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Edit the details of this inventory item. Update fields as needed and save changes." : "Add a new inventory item to your stock. Fill in all required fields and save."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                placeholder="e.g., Tablets, Pieces, Vials"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={formData.supplier} onValueChange={(value) => handleInputChange("supplier", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {suppliers.length === 0 && (
                <p className="text-xs text-gray-500">
                  No suppliers found. Please add suppliers in Settings → Inventory.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleInputChange("currentStock", parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock *</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => handleInputChange("minStock", parseInt(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Max Stock *</Label>
              <Input
                id="maxStock"
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) => handleInputChange("maxStock", parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (₹) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => handleInputChange("pricePerUnit", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => handleInputChange("batchNumber", e.target.value)}
                placeholder="Enter batch number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastRestocked">Last Restocked</Label>
              <Input
                id="lastRestocked"
                type="date"
                value={formData.lastRestocked}
                onChange={(e) => handleInputChange("lastRestocked", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-medical-500 hover:bg-medical-600" disabled={loading}>
              {loading ? "Saving..." : (item ? "Update Item" : "Add Item")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryFormDialog; 