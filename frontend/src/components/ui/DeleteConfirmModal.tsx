import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteConfirmModalProps {
  title: string;
  itemName: string;
  description: string;
  onConfirm: () => Promise<void>;
  trigger?: React.ReactNode;
  icon?: "trash" | "warning";
  confirmText?: string;
  confirmVariant?: "destructive" | "default";
}

const DeleteConfirmModal = ({ 
  title, 
  itemName, 
  description, 
  onConfirm, 
  trigger,
  icon = "trash",
  confirmText = "Delete",
  confirmVariant = "destructive"
}: DeleteConfirmModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      console.error("Error in delete operation:", error);
      toast({
        title: "Error",
        description: "Operation failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const IconComponent = icon === "warning" ? AlertTriangle : Trash2;
  const iconBgColor = icon === "warning" ? "bg-yellow-100" : "bg-red-100";
  const iconColor = icon === "warning" ? "text-yellow-600" : "text-red-600";

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
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className={`mx-auto w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-4`}>
              <IconComponent className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to {confirmText.toLowerCase()} this {itemName.toLowerCase()}?
            </h3>
            <p className="text-sm text-gray-600">
              {description}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? `${confirmText}ing...` : `${confirmText} ${itemName}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;