import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, RotateCcw, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface GstCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GstCategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const GstCategorySelector = ({ 
  value, 
  onValueChange, 
  placeholder = "Select GST category",
  className 
}: GstCategorySelectorProps) => {
  const [categories, setCategories] = useState<GstCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GstCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { toast } = useToast();



  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/gst/categories?includeInactive=true");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching GST categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.post("/gst/categories", formData);
      const newCategory = response.data;
      
      toast({
        title: "Success",
        description: "GST category created successfully",
      });
      
      setAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      await fetchCategories();
      
      // Auto-select the newly created category
      onValueChange(newCategory.id.toString());
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to create GST category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    try {
      await api.put(`/gst/categories/${editingCategory.id}`, formData);
      
      toast({
        title: "Success",
        description: "GST category updated successfully",
      });
      
      setEditDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      await fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update GST category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: GstCategory) => {
    try {
      await api.delete(`/gst/categories/${category.id}`);
      
      toast({
        title: "Success",
        description: `GST category '${category.name}' has been made inactive`,
      });
      
      await fetchCategories();
      
      // If the deleted category was selected, clear the selection
      if (value === category.id.toString()) {
        onValueChange("none");
      }
    } catch (error: any) {
      let errorMessage = "Failed to make GST category inactive";
      
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes("foreign key constraint") || backendError.includes("referenced")) {
          errorMessage = "Cannot delete this GST category as it is being used in existing GST rates. Please deactivate it instead.";
        } else {
          errorMessage = backendError;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRestoreCategory = async (category: GstCategory) => {
    try {
      await api.patch(`/gst/categories/${category.id}/restore`);
      
      toast({
        title: "Success",
        description: `GST category '${category.name}' has been restored`,
      });
      
      await fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to restore GST category",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: GstCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setEditDialogOpen(true);
  };

  const activeCategories = categories.filter(cat => cat.isActive);
  const inactiveCategories = categories.filter(cat => !cat.isActive);

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {activeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-500" />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setManageDialogOpen(true)}
          className="shrink-0"
          title="Manage GST Categories"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="shrink-0"
          title="Add GST Category"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Manage GST Categories Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Manage GST Categories
            </DialogTitle>
            <p className="text-sm text-gray-600">
              GST categories are used for tax compliance and billing classification. These are independent of inventory categories.
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Active Categories */}
            <div>
              <h3 className="font-medium mb-3 text-green-700 flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                GST Categories ({activeCategories.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCategories.length > 0 ? (
                  activeCategories.map((category) => (
                    <div key={category.id} className="flex items-start justify-between p-4 border rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-blue-500" />
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(category)}
                          title="Edit category"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-700"
                          title="Make inactive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8 col-span-2">No active GST categories</p>
                )}
              </div>
            </div>

            {/* Inactive Categories */}
            {inactiveCategories.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 text-gray-600 flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                  GST Categories ({inactiveCategories.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inactiveCategories.map((category) => (
                    <div key={category.id} className="flex items-start justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-600 flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-gray-400" />
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRestoreCategory(category)}
                        className="text-green-600 hover:text-green-700"
                        title="Restore category"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">GST Category Guidelines:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Medicine:</strong> Pharmaceutical products (typically 5% GST)</li>
                <li>• <strong>Consultation:</strong> Professional medical services (typically 18% GST)</li>
                <li>• <strong>Lab Test:</strong> Diagnostic services (typically 5% or 18% GST)</li>
                <li>• <strong>Equipment:</strong> Medical devices and equipment (typically 18% GST)</li>
                <li>• <strong>Cosmetic:</strong> Beauty and cosmetic products (typically 18% GST)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add GST Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Add New GST Category
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Create a new GST category for tax compliance and billing classification.
            </p>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <Label htmlFor="add-name">Category Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Medicine, Consultation, Lab Test"
                required
              />
            </div>
            <div>
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Pharmaceutical products and medicines (typically 5% GST)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setAddDialogOpen(false);
                  setFormData({ name: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create GST Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit GST Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-500" />
              Edit GST Category
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCategory} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter GST category name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter GST category description (optional)"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingCategory(null);
                  setFormData({ name: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update GST Category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GstCategorySelector;