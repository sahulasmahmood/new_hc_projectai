import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface DeleteConfirmDialogProps {
  itemId: number;
  itemName: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const DeleteConfirmDialog = ({ itemId, itemName, onSuccess, trigger }: DeleteConfirmDialogProps) => {
  const { toast } = useToast();

  const handleDelete = async () => {
    await api.delete(`/inventory/${itemId}`);
    
    toast({
      title: "Success",
      description: "Inventory item deleted successfully",
    });

    onSuccess();
  };

  return (
    <DeleteConfirmModal
      title="Delete Inventory Item"
      itemName="Item"
      description={`"${itemName}" will be permanently removed from the inventory. This action cannot be undone.`}
      onConfirm={handleDelete}
      trigger={trigger || (
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      )}
    />
  );
};

export default DeleteConfirmDialog; 