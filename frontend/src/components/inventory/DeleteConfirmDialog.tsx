import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DeleteConfirmDialogProps {
  itemId: number;
  itemName: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const DeleteConfirmDialog = ({ itemId, itemName, onSuccess, trigger }: DeleteConfirmDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      await api.delete(`/inventory/${itemId}`);
      
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this item?
            </h3>
            <p className="text-sm text-gray-600">
              "{itemName}" will be permanently removed from the inventory. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog; 