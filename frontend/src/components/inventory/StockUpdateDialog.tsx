import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingDown, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  unit: string;
  maxStock: number;
}

interface StockUpdateDialogProps {
  item: InventoryItem;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const StockUpdateDialog = ({ item, onSuccess, trigger }: StockUpdateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updateType, setUpdateType] = useState<"add" | "subtract">("add");
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState("");

  const { toast } = useToast();

  // Calculate newStock for use throughout the component
  const newStock = updateType === "add"
    ? item.currentStock + quantity
    : item.currentStock - quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Reason is required for stock update",
        variant: "destructive",
      });
      return;
    }
    if (newStock < 0) {
      toast({
        title: "Error",
        description: "Cannot reduce stock below 0",
        variant: "destructive",
      });
      return;
    }
    if (newStock > item.maxStock) {
      toast({
        title: "Error",
        description: `Cannot exceed max stock (${item.maxStock} ${item.unit})`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await api.put(`/inventory/${item.id}`, {
        currentStock: newStock,
        lastRestocked: new Date().toISOString(),
        reason,
      });

      toast({
        title: "Success",
        description: `Stock ${updateType === "add" ? "added" : "reduced"} successfully`,
      });

      setOpen(false);
      setQuantity(0);
      setReason("");
      onSuccess();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <TrendingDown className="h-4 w-4 mr-1" />
              Update Stock
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock - {item.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stock</Label>
              <div className="text-lg font-medium">
                {item.currentStock} {item.unit}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Max: {item.maxStock} {item.unit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="updateType">Update Type</Label>
              <Select value={updateType} onValueChange={(value: "add" | "subtract") => setUpdateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Reduce Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="quantity">Quantity ({item.unit}) <span className="text-red-500">*</span></Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      placeholder={`Enter quantity in ${item.unit}`}
                      required
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Enter the quantity to add or subtract. Cannot exceed max or go below zero.</TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="reason">Reason <span className="text-red-500">*</span></Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter reason for stock update"
                      required
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Provide a reason for this manual stock adjustment (e.g., audit correction, damage, loss).</TooltipContent>
              </Tooltip>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                New stock will be: <span className="font-medium">{newStock} {item.unit}</span>
              </div>
              {quantity > 0 && newStock > item.maxStock && (
                <div className="text-xs text-red-500">Warning: This will exceed the max stock limit!</div>
              )}
              {quantity > 0 && newStock < 0 && (
                <div className="text-xs text-red-500">Warning: This will reduce stock below zero!</div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className={updateType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                disabled={loading || quantity <= 0 || !reason.trim()}
              >
                {loading ? "Updating..." : `${updateType === "add" ? "Add" : "Reduce"} Stock`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default StockUpdateDialog; 