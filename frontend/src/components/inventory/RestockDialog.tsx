import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  unit: string;
  supplier: string;
  maxStock: number;
}

interface RestockDialogProps {
  item: InventoryItem;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const RestockDialog = ({ item, onSuccess, trigger }: RestockDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState(item.supplier || "");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState(""); // <-- Add reason state
  const { toast } = useToast();
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);

  useEffect(() => {
    // Fetch suppliers from backend when dialog opens
    api.get("/settings/suppliers?isActive=true").then(res => {
      setSupplierOptions(res.data.map((s: { name: string }) => s.name));
    });
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  const isBatchNumberUnique = (batch: string) => {
    // Simulate uniqueness check (should be checked in backend in real app)
    // For now, always return true
    return true;
  };

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
    if (!batchNumber) {
      toast({
        title: "Error",
        description: "Batch number is required",
        variant: "destructive",
      });
      return;
    }
    if (!isBatchNumberUnique(batchNumber)) {
      toast({
        title: "Error",
        description: "Batch number must be unique",
        variant: "destructive",
      });
      return;
    }
    if (expiryDate && expiryDate < date) {
      toast({
        title: "Error",
        description: "Expiry date must be in the future",
        variant: "destructive",
      });
      return;
    }
    if (quantity + item.currentStock > item.maxStock) {
      toast({
        title: "Error",
        description: `Cannot exceed max stock (${item.maxStock} ${item.unit})`,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/inventory/${item.id}/restock`, {
        quantity,
        batchNumber,
        expiryDate: expiryDate || undefined,
        supplier: supplier || undefined,
        date: date || undefined,
        reason: reason || undefined, // <-- Include reason in payload
      });
      toast({
        title: "Restocked",
        description: `Added ${quantity} ${item.unit} to '${item.name}'`,
      });
      setOpen(false);
      setQuantity(0);
      setBatchNumber("");
      setExpiryDate("");
      setSupplier(item.supplier || "");
      setDate(new Date().toISOString().slice(0, 10));
      setReason(""); // <-- Reset reason
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restock item",
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
              <RotateCcw className="h-4 w-4 mr-1" />
              Restock
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restock - {item.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Compact Current Stock Display */}
            <div className="space-y-2">
              <div className="text-lg font-medium">
                Current Stock: {item.currentStock} {item.unit}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Add ({item.unit})</Label>
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
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="batchNumber">Batch Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="batchNumber"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="Enter batch number"
                      required
                      className={!batchNumber ? "border-red-500" : ""}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Batch number is required and must be unique.</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="yyyy-mm-dd"
                      min={date}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Expiry date must be in the future.</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <select
                      id="supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Select supplier</option>
                      {supplierOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {supplier && !supplierOptions.includes(supplier) && (
                        <option value={supplier}>{supplier}</option>
                      )}
                    </select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Choose from approved suppliers or enter a new one.</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="date">Restock Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="yyyy-mm-dd"
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>Defaults to today. Cannot be in the future.</TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for restocking (optional)"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Current stock: {item.currentStock} {item.unit} | Max: {item.maxStock} {item.unit}
            </div>
            {quantity > 0 && (quantity + item.currentStock > item.maxStock) && (
              <div className="text-xs text-red-500">Warning: This will exceed the max stock limit!</div>
            )}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || quantity <= 0}>
                {loading ? "Restocking..." : "Restock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default RestockDialog; 