import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Filter, AlertTriangle, Truck, Calendar, TrendingDown, TrendingUp, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import api from "@/lib/api";
import InventoryFormDialog from "@/components/inventory/InventoryFormDialog";
import StockUpdateDialog from "@/components/inventory/StockUpdateDialog";
import DeleteConfirmDialog from "@/components/inventory/DeleteConfirmDialog";
import RestockDialog from "@/components/inventory/RestockDialog";
import InventoryBatchHistoryDialog from "@/components/inventory/InventoryBatchHistoryDialog";

interface InventoryItem {
  id: number;
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
  createdAt: string;
  updatedAt: string;
  code: string;
}

const Inventory = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  type FilterType = 'all' | 'lowStock' | 'expiringSoon' | 'lastRestocked' | 'createdAt';
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/settings/categories");
      type Category = { name: string };
      setCategories((response.data as Category[]).map((cat) => cat.name));
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to static data if API fails
      setCategories(["Medicine", "Equipment", "Supplies", "Consumables"]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch inventory data
  const fetchInventory = async (search?: string, category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      if (category && category !== "all") {
        params.append('category', category);
      }
      const response = await api.get(`/inventory?${params}`);
      setInventory(response.data);
    } catch (err) {
      setError("Failed to fetch inventory items");
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  // Combined fetch logic for initial load and search
  useEffect(() => {
    if (isInitialMount.current) {
      // Initial load - fetch without search
      fetchInventory();
      isInitialMount.current = false;
    } else {
      // Search with debounce
      const debounceTimer = setTimeout(() => {
        fetchInventory(searchQuery || undefined, selectedCategory);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, selectedCategory]);

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "Low Stock", color: "bg-red-100 text-red-800" };
    if (current >= max * 0.9) return { status: "Overstocked", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Normal", color: "bg-green-100 text-green-800" };
  };

  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow;
  });

  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.pricePerUnit), 0);

  // Filter inventory by lastRestocked date if selectedDate is set
  const filteredInventory = inventory.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'lowStock') return item.currentStock <= item.minStock;
    if (filterType === 'expiringSoon') {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }
    if (filterType === 'lastRestocked' || filterType === 'createdAt') {
      if (!selectedDate) return true;
      const dateField = filterType === 'lastRestocked' ? item.lastRestocked : item.createdAt;
      if (!dateField) return false;
      return dateField.split('T')[0] === selectedDate;
    }
    return true;
  });
  // Pagination logic
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInventory = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const handlePageChange = (page: number) => setCurrentPage(page);
  // Reset to first page when filter changes
  useEffect(() => { setCurrentPage(1); }, [selectedDate, selectedCategory, searchQuery, filterType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        </div>
        <InventoryFormDialog onSuccess={fetchInventory} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            <div className="text-sm text-gray-600">Low Stock Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{expiringItems.length}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.name} <span className="text-xs text-gray-400">({item.code})</span></span>
                      <Badge variant="outline" className="text-red-600">
                        {item.currentStock} {item.unit}
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{lowStockItems.length - 3} more items
                      <button
                        className="ml-2 text-blue-600 underline hover:text-blue-800"
                        onClick={() => setShowLowStockModal(true)}
                      >
                        Show All
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.name} <span className="text-xs text-gray-400">({item.code})</span></span>
                      <Badge variant="outline" className="text-yellow-600">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'No expiry'}
                      </Badge>
                    </div>
                  ))}
                  {expiringItems.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{expiringItems.length - 3} more items
                      <button
                        className="ml-2 text-blue-600 underline hover:text-blue-800"
                        onClick={() => setShowExpiringModal(true)}
                      >
                        Show All
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by item name, supplier, or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Grouped Filter Dropdown */}
              <Select value={filterType} onValueChange={v => setFilterType(v as FilterType)}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {filterType === 'all' && 'Show All'}
                    {filterType === 'lowStock' && 'Low Stock'}
                    {filterType === 'expiringSoon' && 'Expiring Soon'}
                    {filterType === 'lastRestocked' && 'Restock Date'}
                    {filterType === 'createdAt' && 'Created Date'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs text-gray-500">By Status</div>
                  <SelectItem value="all">Show All</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                  <SelectItem value="expiringSoon">Expiring Soon</SelectItem>
                  <div className="px-2 py-1 text-xs text-gray-500">By Date</div>
                  <SelectItem value="lastRestocked">Restock Date</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                </SelectContent>
              </Select>
              {/* Show date input only for date filters */}
              {(filterType === 'lastRestocked' || filterType === 'createdAt') && (
                <>
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
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && inventory.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-pulse">Loading inventory...</div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-12 text-center text-red-500">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      {!error && !loading && (
        <div className="space-y-4">
          {currentInventory.map((item) => {
            const stockStatus = getStockStatus(item.currentStock, item.minStock, item.maxStock);
            const stockPercentage = (item.currentStock / item.maxStock) * 100;
            // Expiring soon logic
            let isExpiringSoon = false;
            if (item.expiryDate) {
              const expiryDate = new Date(item.expiryDate);
              const thirtyDaysFromNow = new Date();
              thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
              isExpiringSoon = expiryDate <= thirtyDaysFromNow;
            }
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-medical-50 rounded-lg">
                        <Package className="h-5 w-5 text-medical-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{/* Code:  */}{item.code}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{item.supplier}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end mt-1">
                        {item.currentStock <= item.minStock && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">Low Stock</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Stock Level</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            stockPercentage <= (item.minStock / item.maxStock) * 100 
                              ? 'bg-red-500' 
                              : stockPercentage >= 90 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {item.minStock} | Max: {item.maxStock}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Unit Price</div>
                      <div className="font-medium">₹{item.pricePerUnit}</div>
                      <div className="text-sm text-gray-500">
                        Total: ₹{(item.currentStock * item.pricePerUnit).toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Batch & Expiry</div>
                      <div className="font-medium">{item.batchNumber || 'N/A'}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        {item.expiryDate ? (
                          <>
                            Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            {isExpiringSoon && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-2 py-0.5 text-xs font-semibold">Exp Soon</Badge>
                            )}
                          </>
                        ) : 'No expiry'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Last Restocked</div>
                      <div className="font-medium">
                        {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.lastRestocked ? 
                          `${Math.floor((new Date().getTime() - new Date(item.lastRestocked).getTime()) / (1000 * 60 * 60 * 24))} days ago` 
                          : 'Never'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <RestockDialog 
                      item={item} 
                      onSuccess={fetchInventory}
                    />
                    <StockUpdateDialog 
                      item={item} 
                      onSuccess={fetchInventory}
                      trigger={
                        <Button variant="outline" size="sm">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Update Stock
                        </Button>
                      }
                    />
                  {/*   <Button variant="outline" size="sm">
                      <Truck className="h-4 w-4 mr-1" />
                      Order History
                    </Button> */}
                    <InventoryBatchHistoryDialog itemId={item.id} />
                    <InventoryFormDialog
                      item={item}
                      onSuccess={fetchInventory}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Details
                        </Button>
                      }
                    />
                    <DeleteConfirmDialog
                      itemId={item.id}
                      itemName={item.name}
                      onSuccess={fetchInventory}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!error && !loading && filteredInventory.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria, or add your first inventory item.</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!error && !loading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav role="navigation" aria-label="pagination" className="mx-auto flex w-full justify-center">
            <ul className="flex flex-row items-center gap-1">
              <li>
                <a
                  href="#"
                  aria-label="Go to previous page"
                  className={`gap-1 pl-2.5 px-3 py-2 rounded ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`}
                  onClick={e => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                >
                  &lt; Previous
                </a>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i + 1}>
                  <a
                    href="#"
                    aria-current={currentPage === i + 1 ? "page" : undefined}
                    className={`px-3 py-2 rounded ${currentPage === i + 1 ? 'bg-white' : 'hover:bg-gray-100'}`}
                    onClick={e => { e.preventDefault(); handlePageChange(i + 1); }}
                  >
                    {i + 1}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#"
                  aria-label="Go to next page"
                  className={`gap-1 pr-2.5 px-3 py-2 rounded ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-100'}`}
                  onClick={e => { e.preventDefault(); if (currentPage < totalPages) handlePageChange(currentPage + 1); }}
                >
                  Next &gt;
                </a>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Low Stock Modal */}
      <Dialog open={showLowStockModal} onOpenChange={setShowLowStockModal}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Low Stock Items</DialogTitle>
          </DialogHeader>
          <div className="divide-y">
            {lowStockItems.map(item => (
              <div key={item.id} className="py-2 flex justify-between items-center text-sm">
                <span>{item.name} <span className="text-xs text-gray-400">({item.code})</span></span>
                <span className="text-xs text-red-600 font-mono">Stock: {item.currentStock}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expiring Soon Modal */}
      <Dialog open={showExpiringModal} onOpenChange={setShowExpiringModal}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Expiring Soon Items</DialogTitle>
          </DialogHeader>
          <div className="divide-y">
            {expiringItems.map(item => (
              <div key={item.id} className="py-2 flex justify-between items-center text-sm">
                <span>{item.name} <span className="text-xs text-gray-400">({item.code})</span></span>
                <span className="text-xs text-yellow-600 font-mono">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'No expiry'}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
