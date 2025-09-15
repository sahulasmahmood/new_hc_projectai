"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { CreditCard, Plus, Search, Filter, IndianRupee, Eye, Receipt, Calendar, User, Trash2 } from "lucide-react"
import api from "@/lib/api"

interface BillItem {
  id: number
  itemType: string
  itemName: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  gstApplicable: boolean
}

interface Bill {
  id: number
  billNumber: string
  patientId: number
  subtotal: number
  gstAmount: number
  totalAmount: number
  status: string
  paymentMethod?: string
  paymentDate?: string
  gstEnabled: boolean
  gstRate: number
  createdAt: string
  items: BillItem[]
  patient: {
    name: string
    visibleId: string
    phone: string
  }
  appointment?: {
    date: string
    time: string
    type: string
  }
  prescription?: {
    doctorName: string
    medications: Array<{
      id: number
      medicineName: string
      dosage: string
      frequency: string
      duration: string
    }>
  }
}

interface BillingAnalytics {
  totalRevenue: number
  pendingAmount: number
  totalBills: number
  totalGST: number
}

const Billing = () => {
  const [bills, setBills] = useState<Bill[]>([])
  const [analytics, setAnalytics] = useState<BillingAnalytics>({
    totalRevenue: 0,
    pendingAmount: 0,
    totalBills: 0,
    totalGST: 0,
  })
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isViewBillOpen, setIsViewBillOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddConsultationOpen, setIsAddConsultationOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableMedicines, setAvailableMedicines] = useState([])
  const [medicineSearch, setMedicineSearch] = useState("")
  const [consultationFee, setConsultationFee] = useState(0)

  // Add item form state
  const [itemForm, setItemForm] = useState({
    type: "medicine",
    name: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    inventoryItemId: null,
  })

  useEffect(() => {
    fetchBills()
    fetchAnalytics()
  }, [selectedStatus, searchQuery])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (searchQuery) params.append("search", searchQuery)

      const response = await api.get(`/billing?${params.toString()}`)
      setBills(response.data)
    } catch (error) {
      console.error("Error fetching bills:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/billing/analytics")
      setAnalytics(response.data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const fetchBillDetails = async (billId: number) => {
    try {
      const response = await api.get(`/billing/${billId}`)
      setSelectedBill(response.data)
      
      // Fetch consultation fee for the doctor
      if (response.data.prescription?.doctorName) {
        fetchConsultationFee(response.data.prescription.doctorName)
      }
    } catch (error) {
      console.error("Error fetching bill details:", error)
    }
  }

  const fetchAvailableMedicines = async (search = "") => {
    try {
      const response = await api.get(`/billing/medicines/available?search=${search}`)
      setAvailableMedicines(response.data)
    } catch (error) {
      console.error("Error fetching available medicines:", error)
    }
  }

  const fetchConsultationFee = async (doctorName: string) => {
    try {
      const response = await api.get(`/billing/consultation-fee/${encodeURIComponent(doctorName)}`)
      setConsultationFee(response.data.consultationFee)
    } catch (error) {
      console.error("Error fetching consultation fee:", error)
    }
  }

  const updatePaymentStatus = async (billId: number, status: string, paymentMethod?: string) => {
    try {
      await api.put(`/billing/${billId}/payment`, { status, paymentMethod })
      fetchBills()
      fetchAnalytics()
      if (selectedBill && selectedBill.id === billId) {
        fetchBillDetails(billId)
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
    }
  }

  const toggleGST = async (billId: number, gstEnabled: boolean) => {
    try {
      await api.put(`/billing/${billId}/gst`, { gstEnabled })
      fetchBills()
      if (selectedBill && selectedBill.id === billId) {
        fetchBillDetails(billId)
      }
    } catch (error) {
      console.error("Error toggling GST:", error)
    }
  }

  const addItemToBill = async () => {
    if (!selectedBill) return

    try {
      const endpoint = itemForm.type === "medicine" ? "medicines" : "services"
      const payload = {
        [`${itemForm.type}Name`]: itemForm.name,
        quantity: itemForm.quantity,
        unitPrice: itemForm.unitPrice,
        description: itemForm.description,
        gstApplicable: itemForm.type === "medicine",
        ...(itemForm.inventoryItemId && { inventoryItemId: itemForm.inventoryItemId }),
      }

      await api.post(`/billing/${selectedBill.id}/${endpoint}`, payload)
      fetchBillDetails(selectedBill.id)
      fetchBills()
      setIsAddItemOpen(false)
      setItemForm({ type: "medicine", name: "", quantity: 1, unitPrice: 0, description: "", inventoryItemId: null })
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const addConsultationFee = async () => {
    if (!selectedBill || !consultationFee) return

    try {
      const payload = {
        serviceName: `${selectedBill.appointment?.type || "Consultation"} - Dr. ${selectedBill.prescription?.doctorName}`,
        quantity: 1,
        unitPrice: consultationFee,
        description: `${selectedBill.appointment?.type || "Consultation"} fee`,
      }

      await api.post(`/billing/${selectedBill.id}/services`, payload)
      fetchBillDetails(selectedBill.id)
      fetchBills()
      setIsAddConsultationOpen(false)
    } catch (error) {
      console.error("Error adding consultation fee:", error)
    }
  }

  const selectMedicine = (medicine: any) => {
    setItemForm({
      ...itemForm,
      name: medicine.name,
      unitPrice: medicine.pricePerUnit,
      description: `${medicine.name} - ${medicine.unit}`,
      inventoryItemId: medicine.id,
    })
  }

  const selectPrescribedMedicine = (medication: any) => {
    setItemForm({
      ...itemForm,
      type: "medicine",
      name: medication.medicineName,
      description: `${medication.medicineName} - ${medication.dosage} - ${medication.frequency} for ${medication.duration}`,
    })
    
    // Try to find this medicine in inventory
    const inventoryMedicine = availableMedicines.find((med: any) => 
      med.name.toLowerCase().includes(medication.medicineName.toLowerCase())
    )
    
    if (inventoryMedicine) {
      setItemForm(prev => ({
        ...prev,
        unitPrice: inventoryMedicine.pricePerUnit,
        inventoryItemId: inventoryMedicine.id,
      }))
    }
  }

  const deleteItem = async (itemId: number) => {
    if (!selectedBill) return

    try {
      await api.delete(`/billing/${selectedBill.id}/items/${itemId}`)
      fetchBillDetails(selectedBill.id)
      fetchBills()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      case "Cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const filteredBills = bills.filter((bill) => {
    const matchesStatus = selectedStatus === "all" || bill.status === selectedStatus
    const matchesSearch =
      bill.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.patient.visibleId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{analytics.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">₹{analytics.pendingAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalBills}</div>
            <div className="text-sm text-gray-600">Total Bills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">₹{analytics.totalGST.toLocaleString()}</div>
            <div className="text-sm text-gray-600">GST Collected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by patient name, bill number, or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-600">Loading bills...</div>
            </CardContent>
          </Card>
        ) : filteredBills.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-medical-50 rounded-lg">
                      <Receipt className="h-5 w-5 text-medical-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{bill.billNumber}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {bill.patient.name} ({bill.patient.visibleId})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">₹{bill.totalAmount.toLocaleString()}</div>
                    <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Doctor</div>
                    <div className="font-medium">{bill.prescription?.doctorName || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Items</div>
                    <div className="font-medium">{bill.items?.length || 0} items</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Details</div>
                    {bill.paymentMethod ? (
                      <div className="font-medium text-green-600">{bill.paymentMethod}</div>
                    ) : (
                      <div className="font-medium text-yellow-600">Payment Pending</div>
                    )}
                    {bill.gstEnabled && (
                      <div className="text-sm text-gray-600">GST: ₹{bill.gstAmount.toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchBillDetails(bill.id)
                      setIsViewBillOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {bill.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-medical-500 hover:bg-medical-600"
                        onClick={() => updatePaymentStatus(bill.id, "Paid", "Cash")}
                      >
                        <IndianRupee className="h-4 w-4 mr-1" />
                        Mark Paid
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bill Details Dialog */}
      <Dialog open={isViewBillOpen} onOpenChange={setIsViewBillOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBill?.billNumber}</DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <div className="text-lg">{selectedBill.patient.name}</div>
                  <div className="text-sm text-gray-600">{selectedBill.patient.visibleId}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Doctor</Label>
                  <div className="text-lg">{selectedBill.prescription?.doctorName || "N/A"}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Appointment Type</Label>
                  <div className="text-lg">{selectedBill.appointment?.type || "N/A"}</div>
                  <div className="text-sm text-gray-600">
                    {selectedBill.appointment?.date && new Date(selectedBill.appointment.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* GST Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">GST Application</Label>
                  <div className="text-sm text-gray-600">Apply GST to medicines only</div>
                </div>
                <Switch
                  checked={selectedBill.gstEnabled}
                  onCheckedChange={(checked) => toggleGST(selectedBill.id, checked)}
                />
              </div>

              {/* Prescribed Medicines */}
              {selectedBill.prescription?.medications && selectedBill.prescription.medications.length > 0 && (
                <div>
                  <Label className="text-lg font-medium mb-3 block">Prescribed Medicines</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {selectedBill.prescription.medications.map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-2 border rounded-lg bg-blue-50">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{medication.medicineName}</div>
                          <div className="text-xs text-gray-600">
                            {medication.dosage} • {medication.frequency} • {medication.duration}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            selectPrescribedMedicine(medication)
                            setIsAddItemOpen(true)
                          }}
                          disabled={selectedBill.status === "Paid"}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-medium">Bill Items</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsAddConsultationOpen(true)} 
                      disabled={selectedBill.status === "Paid"}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Consultation
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        fetchAvailableMedicines()
                        setIsAddItemOpen(true)
                      }} 
                      disabled={selectedBill.status === "Paid"}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedBill.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} × ₹{item.unitPrice} = ₹{item.totalPrice}
                          {item.gstApplicable && selectedBill.gstEnabled && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              GST Applied
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedBill.status !== "Paid" && (
                        <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedBill.subtotal.toLocaleString()}</span>
                </div>
                {selectedBill.gstEnabled && (
                  <div className="flex justify-between">
                    <span>GST ({selectedBill.gstRate}%):</span>
                    <span>₹{selectedBill.gstAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{selectedBill.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Actions */}
              {selectedBill.status === "Pending" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => updatePaymentStatus(selectedBill.id, "Paid", "Cash")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Paid (Cash)
                  </Button>
                  <Button
                    onClick={() => updatePaymentStatus(selectedBill.id, "Paid", "UPI")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Mark as Paid (UPI)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Consultation Fee Dialog */}
      <Dialog open={isAddConsultationOpen} onOpenChange={setIsAddConsultationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Consultation Fee</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Appointment Type</div>
              <div className="font-medium">{selectedBill?.appointment?.type || "Consultation"}</div>
              <div className="text-sm text-gray-600 mt-1">Dr. {selectedBill?.prescription?.doctorName}</div>
            </div>

            <div>
              <Label>Consultation Fee (₹)</Label>
              <Input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                min="0"
                step="0.01"
                placeholder="Enter consultation fee"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsAddConsultationOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={addConsultationFee} className="bg-medical-500 hover:bg-medical-600">
                Add Consultation Fee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Item to Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Item Type</Label>
              <Select value={itemForm.type} onValueChange={(value) => setItemForm({ ...itemForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {itemForm.type === "medicine" && (
              <div>
                <Label>Search Available Medicines</Label>
                <Input
                  value={medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value)
                    fetchAvailableMedicines(e.target.value)
                  }}
                  placeholder="Search medicines in inventory..."
                />
                {availableMedicines.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                    {availableMedicines.map((medicine: any) => (
                      <div 
                        key={medicine.id} 
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectMedicine(medicine)}
                      >
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-sm text-gray-600">
                          Stock: {medicine.currentStock} {medicine.unit} • ₹{medicine.pricePerUnit}/{medicine.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Item Name</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder={`Enter ${itemForm.type} name`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div>
                <Label>Unit Price (₹)</Label>
                <Input
                  type="number"
                  value={itemForm.unitPrice}
                  onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Additional details about the item"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsAddItemOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={addItemToBill} className="bg-medical-500 hover:bg-medical-600">
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Billing
