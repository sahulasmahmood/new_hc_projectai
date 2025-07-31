import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Plus, Search, Filter, AlertTriangle, CheckCircle, Package, User, Calendar, ShoppingCart, Trash2, Calculator } from "lucide-react";

const Pharmacy = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });

  const medicines = [
    {
      id: 1,
      name: "Paracetamol 500mg",
      genericName: "Acetaminophen",
      category: "Analgesic",
      manufacturer: "Sun Pharma",
      batchNumber: "PCM001",
      expiryDate: "2025-12-31",
      stock: 500,
      minStock: 100,
      unitPrice: "₹2.50",
      location: "Rack A-1"
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      genericName: "Amoxicillin",
      category: "Antibiotic",
      manufacturer: "Cipla",
      batchNumber: "AMX002",
      expiryDate: "2024-06-30",
      stock: 50,
      minStock: 100,
      unitPrice: "₹8.50",
      location: "Rack B-2"
    },
    {
      id: 3,
      name: "Metformin 500mg",
      genericName: "Metformin HCl",
      category: "Antidiabetic",
      manufacturer: "Dr. Reddy's",
      batchNumber: "MET003",
      expiryDate: "2025-09-15",
      stock: 200,
      minStock: 50,
      unitPrice: "₹3.00",
      location: "Rack C-1"
    }
  ];

  const prescriptions = [
    {
      id: 1,
      prescriptionId: "RX001",
      patientName: "Ramesh Kumar",
      patientId: "P001",
      doctorName: "Dr. Rajesh Kumar",
      date: "2024-01-25",
      medicines: [
        { name: "Paracetamol 500mg", quantity: 20, dosage: "1 tablet twice daily" },
        { name: "Amoxicillin 250mg", quantity: 15, dosage: "1 tablet thrice daily" }
      ],
      status: "Pending",
      totalAmount: "₹177.50"
    },
    {
      id: 2,
      prescriptionId: "RX002",
      patientName: "Sunita Devi",
      patientId: "P002",
      doctorName: "Dr. Anjali Patel",
      date: "2024-01-24",
      medicines: [
        { name: "Metformin 500mg", quantity: 30, dosage: "1 tablet after meals" }
      ],
      status: "Dispensed",
      totalAmount: "₹90.00"
    }
  ];

  const categories = ["Analgesic", "Antibiotic", "Antidiabetic", "Cardiovascular", "Respiratory", "Dermatological"];

  const addToCart = (medicine, quantity = 1) => {
    const existingItem = cartItems.find(item => item.id === medicine.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === medicine.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...medicine, quantity }]);
    }
  };

  const removeFromCart = (medicineId) => {
    setCartItems(cartItems.filter(item => item.id !== medicineId));
  };

  const updateCartQuantity = (medicineId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === medicineId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.unitPrice.replace('₹', ''));
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const processSale = () => {
    if (cartItems.length === 0) return;
    
    // Process the sale here
    console.log('Processing sale:', { cartItems, customerInfo, total: calculateTotal() });
    
    // Clear cart after sale
    setCartItems([]);
    setCustomerInfo({ name: "", phone: "", address: "" });
    
    // Show success message
    alert(`Sale processed successfully! Total: ₹${calculateTotal()}`);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum) return { status: "Low Stock", color: "bg-red-100 text-red-800" };
    if (current <= minimum * 1.5) return { status: "Medium Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry <= 30) return { status: "Expires Soon", color: "bg-red-100 text-red-800" };
    if (daysUntilExpiry <= 90) return { status: "Expiring", color: "bg-yellow-100 text-yellow-800" };
    return { status: "Good", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management</h1>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Medicine Name" />
                  <Input placeholder="Generic Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Manufacturer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Batch Number" />
                  <Input placeholder="Expiry Date" type="date" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Stock Quantity" type="number" />
                  <Input placeholder="Min Stock" type="number" />
                  <Input placeholder="Unit Price" />
                </div>
                <Input placeholder="Storage Location" />
                <div className="flex gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-medical-500 hover:bg-medical-600">Add Medicine</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-medical-500 hover:bg-medical-600">
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Process New Prescription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Patient ID" />
                  <Input placeholder="Patient Name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Doctor Name" />
                  <Input placeholder="Prescription Date" type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Prescribed Medicines</label>
                  <Textarea placeholder="Enter medicines with dosage instructions..." />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-medical-500 hover:bg-medical-600">Process Prescription</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{medicines.length}</div>
            <div className="text-sm text-gray-600">Total Medicines</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {medicines.filter(m => m.stock <= m.minStock).length}
            </div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {medicines.filter(m => {
                const daysUntilExpiry = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                return daysUntilExpiry <= 90;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Near Expiry</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {prescriptions.filter(p => p.status === "Pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending Orders</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Medicine Inventory</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="pos">Pharmacy POS</TabsTrigger>
          <TabsTrigger value="sales">Sales & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search medicines by name, batch, or manufacturer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {medicines.map((medicine) => {
              const stockStatus = getStockStatus(medicine.stock, medicine.minStock);
              const expiryStatus = getExpiryStatus(medicine.expiryDate);
              
              return (
                <Card key={medicine.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold text-lg">{medicine.name}</div>
                          <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                          <Badge className={expiryStatus.color}>{expiryStatus.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">Generic: {medicine.genericName}</div>
                        <div className="text-sm text-gray-600">Category: {medicine.category}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-semibold text-lg text-green-600">{medicine.unitPrice}</div>
                        <div className="text-sm text-gray-600">per unit</div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Stock</div>
                        <div className="text-lg">{medicine.stock} units</div>
                        <div className="text-xs text-gray-600">Min: {medicine.minStock}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Batch</div>
                        <div className="text-sm">{medicine.batchNumber}</div>
                        <div className="text-xs text-gray-600">{medicine.manufacturer}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Expiry</div>
                        <div className="text-sm">{medicine.expiryDate}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Location</div>
                        <div className="text-sm">{medicine.location}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        Update Stock
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit Details
                      </Button>
                      {medicine.stock <= medicine.minStock && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reorder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-lg">{prescription.prescriptionId}</div>
                        <Badge className={prescription.status === "Dispensed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{prescription.patientName}</span>
                        <span className="text-sm text-gray-600">({prescription.patientId})</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Prescribed by: {prescription.doctorName}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-semibold text-lg text-green-600">{prescription.totalAmount}</div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-xs text-gray-600">{prescription.date}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Prescribed Medicines:</div>
                    <div className="space-y-2">
                      {prescription.medicines.map((medicine, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{medicine.name}</div>
                              <div className="text-sm text-gray-600">{medicine.dosage}</div>
                            </div>
                            <div className="text-sm font-medium">Qty: {medicine.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {prescription.status === "Pending" ? (
                      <>
                        <Button size="sm" className="bg-medical-500 hover:bg-medical-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Dispense
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit Prescription
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">
                        Print Receipt
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Medicine Selection */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Medicine Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search medicines..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medicines.map((medicine) => {
                      const stockStatus = getStockStatus(medicine.stock, medicine.minStock);
                      
                      return (
                        <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold">{medicine.name}</div>
                                  <div className="text-sm text-gray-600">{medicine.genericName}</div>
                                </div>
                                <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-green-600">{medicine.unitPrice}</div>
                                <div className="text-sm text-gray-600">Stock: {medicine.stock}</div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Input 
                                  type="number" 
                                  placeholder="Qty" 
                                  className="w-20" 
                                  min="1"
                                  max={medicine.stock}
                                  id={`qty-${medicine.id}`}
                                />
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    const qtyInput = document.getElementById(`qty-${medicine.id}`) as HTMLInputElement;
                                    const quantity = parseInt(qtyInput?.value || "1");
                                    addToCart(medicine, quantity);
                                    if (qtyInput) qtyInput.value = "";
                                  }}
                                  className="bg-medical-500 hover:bg-medical-600"
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart & Billing */}
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input 
                    placeholder="Customer Name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  />
                  <Input 
                    placeholder="Phone Number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  />
                  <Input 
                    placeholder="Address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  />
                </CardContent>
              </Card>

              {/* Shopping Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart ({cartItems.length})
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCartItems([])}
                      disabled={cartItems.length === 0}
                    >
                      Clear
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Cart is empty
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-600">{item.unitPrice} each</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                            className="w-16 h-8"
                            min="1"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Bill Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>₹{(parseFloat(item.unitPrice.replace('₹', '')) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{calculateTotal()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-medical-500 hover:bg-medical-600"
                    onClick={processSale}
                    disabled={cartItems.length === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Sale
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sales & Billing</h3>
                <p className="text-gray-600">Sales analytics and billing management coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Pharmacy;
