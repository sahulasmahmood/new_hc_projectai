import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, ToggleLeft, Package, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings/categories?includeInactive=true");
      setCategories(response.data);
    } catch (error: unknown) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (editingCategory) {
        await api.put(`/settings/categories/${editingCategory.id}`, formData);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await api.post("/settings/categories", formData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      
      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch (error: unknown) {
      console.error("Error saving category:", error);
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        const err = error as { response: { data: { error: string } } };
        toast({
          title: "Error",
          description: err.response.data.error || "Failed to save category",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save category",
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ""
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
  };

  const handleRestore = async (category: Category) => {
    try {
      await api.patch(`/settings/categories/${category.id}/restore`);
      toast({
        title: "Restored",
        description: `Category '${category.name}' has been restored`,
      });
      fetchCategories();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        const err = error as { response: { data: { error: string } } };
        toast({
          title: "Error",
          description: err.response.data.error || "Failed to restore category",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to restore category",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/settings/categories/${categoryToDelete.id}`);
      toast({
        title: "Category Inactivated",
        description: `Category '${categoryToDelete.name}' has been made inactive successfully`,
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        const err = error as { response: { data: { error: string } } };
        toast({
          title: "Error",
          description: err.response.data.error?.replace('delete category', 'make category inactive') || "Failed to make category inactive",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to make category inactive",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-medical-500" />
          Inventory Categories
        </CardTitle>
        <p className="text-gray-600 mt-1">Manage inventory categories for better organization</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-medical-500" />
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {category.isActive ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <ToggleLeft className="h-4 w-4" />
              {/*               Make Inactive */}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(category)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Create your first inventory category to get started.</p>
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make Category Inactive</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <ToggleLeft className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Are you sure you want to make this category inactive?
                </h3>
                <p className="text-sm text-gray-600">
                  "{categoryToDelete?.name}" will be made inactive. You can restore it later from the list of inactive categories.
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

export default CategoryManagement; 