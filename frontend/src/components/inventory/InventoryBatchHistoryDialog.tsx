import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import api from "@/lib/api";
import { History } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface InventoryBatch {
  id: number;
  batchNumber: string;
  quantity: number;
  expiryDate?: string;
  restockedAt: string;
  supplier?: string;
  reason?: string;
}

interface InventoryBatchHistoryDialogProps {
  itemId: number;
  trigger?: React.ReactNode;
}

const InventoryBatchHistoryDialog = ({ itemId, trigger }: InventoryBatchHistoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const batchesPerPage = 5;

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.get(`/inventory/${itemId}/batches`)
        .then(res => setBatches(res.data))
        .catch(() => setBatches([]))
        .finally(() => setLoading(false));
    }
  }, [open, itemId]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  // Filter batches by selected date
  const filteredBatches = batches.filter(batch => {
    if (!selectedDate) return true;
    const batchDate = batch.restockedAt.split('T')[0];
    return batchDate === selectedDate;
  });

  // Pagination logic
  const indexOfLastBatch = currentPage * batchesPerPage;
  const indexOfFirstBatch = indexOfLastBatch - batchesPerPage;
  const currentBatches = filteredBatches.slice(indexOfFirstBatch, indexOfLastBatch);
  const totalPages = Math.ceil(filteredBatches.length / batchesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" />
            Batch History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batch History</DialogTitle>
          <DialogDescription>
            View the restock history for this inventory item. Filter by date and navigate pages as needed.
          </DialogDescription>
        </DialogHeader>
        {/* Date Filter */}
        <div className="mb-4 flex items-center gap-2">
          <span className="font-medium">Restock Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border rounded px-2 py-1"
            max={new Date().toISOString().split('T')[0]}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate("")}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No batch history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Restocked At</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentBatches.map(batch => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.batchNumber}</TableCell>
                    <TableCell>{batch.quantity}</TableCell>
                    <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{new Date(batch.restockedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{batch.supplier || "-"}</TableCell>
                    <TableCell>{batch.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === i + 1}
                        onClick={e => { e.preventDefault(); handlePageChange(i + 1); }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InventoryBatchHistoryDialog; 