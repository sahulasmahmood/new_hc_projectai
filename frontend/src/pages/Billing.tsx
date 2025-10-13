"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { CreditCard, Plus, Search, Filter, IndianRupee, Eye, Receipt, Calendar, User, Trash2, Settings, ChevronLeft, ChevronRight, Edit, FileText } from "lucide-react"
import api from "@/lib/api"
import GstSelector from "@/components/gst/GstSelector"
import InvoiceViewModal from "@/components/invoice/InvoiceViewModal"
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal"
import { useToast } from "@/hooks/use-toast"
import GstCategorySelector from "@/components/gst/gst-category-selector"

interface GstRate {
  id: number
  name: string
  rate: number
  description?: string
  category?: {
    id: number
    name: string
    description?: string
  }
  isActive: boolean
}

interface BillItem {
  id: number
  itemType: string
  itemName: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  gstAmount: number
  gstRate?: {
    id: number
    name: string
    rate: number
  }
  inventoryItem?: {
    id: number
    name: string
    code: string
    unit: string
    pricePerUnit: number
    currentStock: number
    batches?: Array<{
      batchNumber: string
      expiryDate?: string
      supplier?: string
    }>
  }
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
  createdAt: string
  items?: BillItem[]
  _count?: {
    items: number
  }
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
    investigations?: string
    medications: Array<{
      id: number
      medicineName: string
      dosage: string
      frequency: string
      timing?: string
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

// Helper function to format timing display
const formatTiming = (timing?: string) => {
  if (!timing || timing === 'No meal restriction') return 'No meal restriction';
  
  const timingMap: Record<string, string> = {
    'AC': 'Before meals (AC)',
    'PC': 'After meals (PC)', 
    'HS': 'At bedtime (HS)',
    'Empty stomach': 'Empty stomach',
    'With food': 'With food',
    'Before meals': 'Before meals',
    'After meals': 'After meals',
    'At bedtime': 'At bedtime'
  };
  
  return timingMap[timing] || timing;
};

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
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isAddConsultationOpen, setIsAddConsultationOpen] = useState(false)
  const [isGstManagementOpen, setIsGstManagementOpen] = useState(false)
  const [isInvoiceViewOpen, setIsInvoiceViewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BillItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableMedicines, setAvailableMedicines] = useState([])
  const [medicineSearch, setMedicineSearch] = useState("")
  const [consultationFee, setConsultationFee] = useState(0)
  const [gstRates, setGstRates] = useState<GstRate[]>([])
  const [selectedGst, setSelectedGst] = useState<GstRate | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash")
  const [showAllMedicines, setShowAllMedicines] = useState(false)
  const { toast } = useToast()
  const location = useLocation()

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Initialize date range to today by default
  const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const [dateRange, setDateRange] = useState({
    startDate: getToday(),
    endDate: getToday()
  })
  const [isCustomRangeSelected, setIsCustomRangeSelected] = useState(false)
  const itemsPerPage = 10

  // Quick date selector functions
  const setDateRangeQuick = (type: string) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    switch (type) {
      case 'today':
        setDateRange({
          startDate: formatDate(today),
          endDate: formatDate(today)
        })
        break
      case 'yesterday':
        setDateRange({
          startDate: formatDate(yesterday),
          endDate: formatDate(yesterday)
        })
        break
      case 'last7days':
        setDateRange({
          startDate: formatDate(last7Days),
          endDate: formatDate(today)
        })
        break
      case 'thismonth':
        setDateRange({
          startDate: formatDate(thisMonthStart),
          endDate: formatDate(today)
        })
        break
      case 'clear':
        setDateRange({
          startDate: "",
          endDate: ""
        })
        setIsCustomRangeSelected(false)
        break
      case 'custom':
        // For custom, set flag to show custom inputs
        setIsCustomRangeSelected(true)
        break
    }
    
    // Reset custom flag for non-custom selections
    if (type !== 'custom') {
      setIsCustomRangeSelected(false)
    }
    
    setCurrentPage(1)
  }

  // Get user-friendly date range description
  const getDateRangeDescription = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return "All Time"
    }
    
    const today = getToday()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (dateRange.startDate === today && dateRange.endDate === today) {
      return "Today"
    }
    
    if (dateRange.startDate === yesterdayStr && dateRange.endDate === yesterdayStr) {
      return "Yesterday"
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).toLocaleDateString()
      const end = new Date(dateRange.endDate).toLocaleDateString()
      if (start === end) {
        return start
      }
      return `${start} - ${end}`
    }
    
    return "Custom Range"
  }

  // Get current date range type for dropdown selection
  const getCurrentDateRangeType = () => {
    // If custom is explicitly selected, return custom
    if (isCustomRangeSelected) {
      return "custom"
    }
    
    if (!dateRange.startDate && !dateRange.endDate) {
      return "clear"
    }
    
    const today = getToday()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)
    const last7DaysStr = last7Days.toISOString().split('T')[0]
    
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const thisMonthStartStr = thisMonthStart.toISOString().split('T')[0]
    
    if (dateRange.startDate === today && dateRange.endDate === today) {
      return "today"
    }
    
    if (dateRange.startDate === yesterdayStr && dateRange.endDate === yesterdayStr) {
      return "yesterday"
    }
    
    if (dateRange.startDate === last7DaysStr && dateRange.endDate === today) {
      return "last7days"
    }
    
    if (dateRange.startDate === thisMonthStartStr && dateRange.endDate === today) {
      return "thismonth"
    }
    
    return "custom"
  }

  // Add item form state
  const [itemForm, setItemForm] = useState({
    type: "medicine",
    name: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    inventoryItemId: null,
  })

  // Edit item form state
  const [editItemForm, setEditItemForm] = useState({
    name: "",
    quantity: 1,
    unitPrice: 0,
    description: "",
    gstRateId: null,
    inventoryItemId: null,
  })

  // GST management form state
  const [gstForm, setGstForm] = useState({
    name: "",
    rate: "",
    description: "",
    categoryId: ""
  })
  const [editingGst, setEditingGst] = useState<GstRate | null>(null)

  useEffect(() => {
    fetchBills()
    fetchAnalytics()
    fetchGstRates()
  }, [selectedStatus, searchQuery, currentPage, dateRange])

  // Handle navigation from Reports page
  useEffect(() => {
    if (location.state?.selectedBillId && bills.length > 0) {
      const billToSelect = bills.find(bill => bill.id === location.state.selectedBillId)
      if (billToSelect) {
        // Just fetch the bill details but don't auto-open the invoice modal
        fetchBillDetails(location.state.selectedBillId, false)
        // Clear the navigation state to prevent re-triggering
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, bills])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (searchQuery) params.append("search", searchQuery)
      if (dateRange.startDate) params.append("startDate", dateRange.startDate)
      if (dateRange.endDate) params.append("endDate", dateRange.endDate)
      
      // Pagination
      params.append("limit", itemsPerPage.toString())
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString())

      const response = await api.get(`/billing?${params.toString()}`)
      setBills(response.data.bills || response.data)
      
      // Calculate total pages if backend provides total count
      if (response.data.total) {
        setTotalPages(Math.ceil(response.data.total / itemsPerPage))
      }
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

  const fetchBillDetails = async (billId: number, autoOpenInvoice = false) => {
    try {
      const response = await api.get(`/billing/${billId}`)
      setSelectedBill(response.data)
      
      // Only auto-open invoice if explicitly requested
      if (autoOpenInvoice) {
        setIsInvoiceViewOpen(true)
      }
      
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

  const fetchGstRates = async () => {
    try {
      const response = await api.get("/gst")
      setGstRates(response.data)
    } catch (error) {
      console.error("Error fetching GST rates:", error)
    }
  }

  const createGstRate = async () => {
    try {
      await api.post("/gst", {
        name: gstForm.name,
        rate: parseFloat(gstForm.rate),
        description: gstForm.description || null,
        categoryId: gstForm.categoryId && gstForm.categoryId !== "none" ? parseInt(gstForm.categoryId) : null
      })
      fetchGstRates()
      resetGstForm()
      toast({
        title: "Success",
        description: "GST rate created successfully",
      })
    } catch (error: any) {
      let errorMessage = "Failed to create GST rate. Please try again.";
      
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes("already exists") || backendError.includes("duplicate")) {
          errorMessage = "A GST rate with this name already exists. Please use a different name.";
        } else if (backendError.includes("validation")) {
          errorMessage = "Please check your input values. Rate must be between 0 and 100.";
        } else {
          errorMessage = backendError;
        }
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  const updateGstRate = async () => {
    if (!editingGst) return
    try {
      await api.put(`/gst/${editingGst.id}`, {
        name: gstForm.name,
        rate: parseFloat(gstForm.rate),
        description: gstForm.description || null,
        categoryId: gstForm.categoryId && gstForm.categoryId !== "none" ? parseInt(gstForm.categoryId) : null
      })
      fetchGstRates()
      resetGstForm()
      toast({
        title: "Success",
        description: "GST rate updated successfully",
      })
    } catch (error: any) {
      let errorMessage = "Failed to update GST rate. Please try again.";
      
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes("already exists") || backendError.includes("duplicate")) {
          errorMessage = "A GST rate with this name already exists. Please use a different name.";
        } else if (backendError.includes("validation")) {
          errorMessage = "Please check your input values. Rate must be between 0 and 100.";
        } else if (backendError.includes("not found")) {
          errorMessage = "GST rate not found. It may have been deleted by another user.";
        } else {
          errorMessage = backendError;
        }
      }
      
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  const deleteGstRate = async (id: number) => {
    try {
      await api.delete(`/gst/${id}`)
      fetchGstRates()
      toast({
        title: "Success",
        description: "GST rate deleted successfully",
      })
    } catch (error: any) {
      let errorMessage = "Failed to delete GST rate. Please try again.";
      
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes("foreign key constraint") || backendError.includes("referenced")) {
          errorMessage = "Cannot delete this GST rate as it is being used in existing bills or items. Please deactivate it instead.";
        } else if (backendError.includes("not found")) {
          errorMessage = "GST rate not found. It may have already been deleted.";
        } else {
          errorMessage = backendError;
        }
      }
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  const cancelBill = async (billId: number) => {
    await updatePaymentStatus(billId, "Cancelled")
    toast({
      title: "Success",
      description: "Bill cancelled successfully",
    })
  }

  const toggleGstStatus = async (id: number) => {
    try {
      await api.patch(`/gst/${id}/toggle-status`)
      fetchGstRates()
      toast({
        title: "Success",
        description: "GST rate status updated successfully",
      })
    } catch (error: any) {
      let errorMessage = "Failed to update GST rate status. Please try again.";
      
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes("not found")) {
          errorMessage = "GST rate not found. It may have been deleted by another user.";
        } else {
          errorMessage = backendError;
        }
      }
      
      toast({
        title: "Status Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }

  const resetGstForm = () => {
    setGstForm({ name: "", rate: "", description: "", categoryId: "none" })
    setEditingGst(null)
  }

  const editGst = (gst: GstRate) => {
    setEditingGst(gst)
    setGstForm({
      name: gst.name,
      rate: gst.rate.toString(),
      description: gst.description || "",
      categoryId: gst.category?.id?.toString() || "none"
    })
  }

  const updatePaymentStatus = async (billId: number, status: string, paymentMethod?: string) => {
    try {
      await api.put(`/billing/${billId}/payment`, { status, paymentMethod })
      fetchBills()
      fetchAnalytics()
      if (selectedBill && selectedBill.id === billId) {
        fetchBillDetails(billId, false)
      }
      toast({
        title: "Success",
        description: `Bill status updated to ${status}`,
      })
    } catch (error: any) {
      console.error("Error updating payment status:", error)
      const errorMessage = error.response?.data?.error || error.message || "Failed to update payment status"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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
        gstRateId: selectedGst?.id || null,
        ...(itemForm.inventoryItemId && { inventoryItemId: itemForm.inventoryItemId }),
      }

      await api.post(`/billing/${selectedBill.id}/${endpoint}`, payload)
      fetchBillDetails(selectedBill.id, false) // Don't auto-open invoice after adding medicine
      fetchBills()
      setIsAddItemOpen(false)
      setItemForm({ type: "medicine", name: "", quantity: 1, unitPrice: 0, description: "", inventoryItemId: null })
      setSelectedGst(null)
      setMedicineSearch("")
      toast({
        title: "Success",
        description: `${itemForm.type === "medicine" ? "Medicine" : "Service"} added successfully`,
      })
    } catch (error: any) {
      console.error("Error adding item:", error)
      const errorMessage = error.response?.data?.error || error.message || `Failed to add ${itemForm.type}`
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
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
      fetchBillDetails(selectedBill.id, false) // Don't auto-open invoice after adding consultation
      fetchBills()
      setIsAddConsultationOpen(false)
      toast({
        title: "Success",
        description: "Consultation fee added successfully",
      })
    } catch (error) {
      console.error("Error adding consultation fee:", error)
      toast({
        title: "Error",
        description: "Failed to add consultation fee",
        variant: "destructive",
      })
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
    // Clear search to close dropdown
    setMedicineSearch("")
  }

  const selectPrescribedMedicine = (medication: any) => {
    const timingDisplay = formatTiming(medication.timing)
    
    setItemForm({
      ...itemForm,
      type: "medicine",
      name: medication.medicineName,
      description: `${medication.medicineName} - ${medication.dosage} - ${medication.frequency} • ${timingDisplay} • ${medication.duration}`,
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

  const selectPrescribedInvestigation = (investigation: string) => {
    setItemForm({
      ...itemForm,
      type: "service",
      name: investigation.trim(),
      quantity: 1,
      unitPrice: 0,
      description: `Lab Test: ${investigation.trim()}`,
      inventoryItemId: null,
    })
  }

  const deleteItem = async (itemId: number) => {
    if (!selectedBill) return

    try {
      await api.delete(`/billing/${selectedBill.id}/items/${itemId}`)
      fetchBillDetails(selectedBill.id, false) // Don't auto-open invoice after deleting item
      fetchBills()
      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const editItem = (item: BillItem) => {
    setEditingItem(item)
    setEditItemForm({
      name: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      description: item.description || "",
      gstRateId: item.gstRate?.id || null,
      inventoryItemId: item.inventoryItem?.id || null,
    })
    setSelectedGst(item.gstRate ? { ...item.gstRate, isActive: true } : null)
    setIsEditItemOpen(true)
  }

  const updateItem = async () => {
    if (!selectedBill || !editingItem) return

    try {
      const updateData: any = {
        itemName: editItemForm.name,
        quantity: editItemForm.quantity,
        unitPrice: editItemForm.unitPrice,
        description: editItemForm.description,
        gstRateId: selectedGst?.id || null,
      }

      // Only include inventoryItemId if it's different from the original
      if (editItemForm.inventoryItemId !== (editingItem.inventoryItem?.id || null)) {
        updateData.inventoryItemId = editItemForm.inventoryItemId
      }

      await api.put(`/billing/${selectedBill.id}/items/${editingItem.id}`, updateData)
      
      fetchBillDetails(selectedBill.id, false)
      fetchBills()
      setIsEditItemOpen(false)
      setEditingItem(null)
      setSelectedGst(null)
      toast({
        title: "Success",
        description: "Item updated successfully",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
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



  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-medical-500" />
          <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
        </div>
        <Button
          onClick={() => setIsGstManagementOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage GST Rates
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            📊 {getDateRangeDescription()}
          </div>
        </div>
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
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
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Compact Date Range Filter */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Label className="text-sm font-medium">Date Range:</Label>
                <Select 
                  value={getCurrentDateRangeType()} 
                  onValueChange={(value) => setDateRangeQuick(value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">📅 Today</SelectItem>
                    <SelectItem value="yesterday">📅 Yesterday</SelectItem>
                    <SelectItem value="last7days">📅 Last 7 Days</SelectItem>
                    <SelectItem value="thismonth">📅 This Month</SelectItem>
                    <SelectItem value="clear">📅 All Time</SelectItem>
                    <SelectItem value="custom">📅 Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom Date Range Inputs - Show inline when custom is selected */}
                {isCustomRangeSelected && (
                  <div className="flex items-center gap-2 ml-4">
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-36"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-36"
                    />
                  </div>
                )}
              </div>
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
        ) : bills.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          (bills || []).map((bill) => (
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
                    <div className="font-medium">{bill._count?.items || 0} items</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Payment Details</div>
                    {bill.paymentMethod ? (
                      <div className="font-medium text-green-600">{bill.paymentMethod}</div>
                    ) : (
                      <div className="font-medium text-yellow-600">Payment Pending</div>
                    )}
                    {bill.gstAmount > 0 && (
                      <div className="text-sm text-gray-600">GST: ₹{bill.gstAmount.toLocaleString()}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchBillDetails(bill.id, false) // Don't auto-open invoice
                      setIsViewBillOpen(true)
                    }}
                  >
                    {(bill.status === "Paid" || bill.status === "Cancelled") ? (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Details
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchBillDetails(bill.id, true) // Auto-open invoice when explicitly requested
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {bills.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bill Details Dialog */}
      <Dialog open={isViewBillOpen} onOpenChange={(open) => {
        setIsViewBillOpen(open)
        if (!open) {
          setShowAllMedicines(false)
        }
      }}>
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
                  <div className="text-lg">{selectedBill.patient?.name || "N/A"}</div>
                  <div className="text-sm text-gray-600">{selectedBill.patient?.visibleId || "N/A"}</div>
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

              {/* Prescribed Investigations / Lab Tests - Moved to top */}
              {selectedBill.prescription?.investigations && selectedBill.prescription.investigations.trim() && (
                <div className="p-3 border rounded-lg bg-green-50">
                  <Label className="text-sm font-medium text-green-800 mb-2 block">Prescribed Investigations / Lab Tests</Label>
                  <div className="text-sm text-green-700 whitespace-pre-wrap">
                    {selectedBill.prescription.investigations}
                  </div>
                </div>
              )}



              {/* Prescribed Medicines */}
              {selectedBill.prescription?.medications && selectedBill.prescription.medications.length > 0 && (
                <div>
                  <Label className="text-lg font-medium mb-3 block">
                    Prescribed Medicines ({selectedBill.prescription.medications.length})
                  </Label>
                  <div className="border rounded-lg bg-blue-50 p-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(selectedBill.prescription?.medications || [])
                        .slice(0, showAllMedicines ? undefined : 6)
                        .map((medication) => (
                        <div key={medication.id} className="flex items-center justify-between p-2 border rounded-lg bg-white shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{medication.medicineName}</div>
                            <div className="text-xs text-gray-600 truncate">
                              {medication.dosage} • {medication.frequency} • {formatTiming(medication.timing)} • {medication.duration}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              selectPrescribedMedicine(medication)
                              setIsAddItemOpen(true)
                            }}
                            disabled={selectedBill.status === "Paid" || selectedBill.status === "Cancelled"}
                            className="ml-2 flex-shrink-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Show More/Less Button */}
                    {selectedBill.prescription.medications.length > 6 && (
                      <div className="mt-3 text-center">
                        {!showAllMedicines ? (
                          <div className="text-sm text-blue-700">
                            +{selectedBill.prescription.medications.length - 6} more medicines
                            <button
                              className="ml-2 text-blue-800 underline hover:text-blue-900 font-medium"
                              onClick={() => setShowAllMedicines(true)}
                            >
                              Show All
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-sm text-blue-800 underline hover:text-blue-900 font-medium"
                            onClick={() => setShowAllMedicines(false)}
                          >
                            Show Less
                          </button>
                        )}
                      </div>
                    )}
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
                      disabled={selectedBill.status === "Paid" || selectedBill.status === "Cancelled"}
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
                      disabled={selectedBill.status === "Paid" || selectedBill.status === "Cancelled"}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(selectedBill.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantity} × ₹{item.unitPrice} = ₹{item.totalPrice}
                          {item.gstAmount > 0 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              GST: ₹{item.gstAmount.toFixed(2)} ({item.gstRate?.rate}%)
                            </span>
                          )}
                          {item.inventoryItem && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              From Inventory
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        )}
                        {item.inventoryItem?.batches?.[0] && (
                          <div className="text-xs text-blue-600 mt-1">
                            Batch: {item.inventoryItem.batches[0].batchNumber}
                            {item.inventoryItem.batches[0].expiryDate && (
                              <span className="ml-2">
                                Exp: {new Date(item.inventoryItem.batches[0].expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedBill.status !== "Paid" && selectedBill.status !== "Cancelled" && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => editItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{(selectedBill.subtotal || 0).toLocaleString()}</span>
                </div>
                {(selectedBill.gstAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Total GST:</span>
                    <span>₹{(selectedBill.gstAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{(selectedBill.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Invoice Actions */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewBillOpen(false)
                    setIsInvoiceViewOpen(true)
                  }}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice
                </Button>
              </div>

              {/* Payment Actions */}
              {(selectedBill.status === "Pending" || selectedBill.status === "Overdue") && (
                <div className="space-y-4">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
                      <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="Card">Card</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col">
                      <div className="h-6"></div> {/* Spacer to align with dropdown */}
                      <Button
                        onClick={() => updatePaymentStatus(selectedBill.id, "Paid", selectedPaymentMethod)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <IndianRupee className="h-4 w-4 mr-1" />
                        Mark as Paid
                      </Button>
                    </div>
                  </div>
                  
                  {/* Additional Actions - Only show for Pending bills */}
                  {selectedBill.status === "Pending" && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        onClick={() => updatePaymentStatus(selectedBill.id, "Overdue")}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Mark as Overdue
                      </Button>
                      <DeleteConfirmModal
                        title="Cancel Bill"
                        itemName="Bill"
                        description={`Bill #${selectedBill.billNumber} will be cancelled and cannot be recovered. This action cannot be undone.`}
                        onConfirm={() => cancelBill(selectedBill.id)}
                        icon="warning"
                        confirmText="Cancel"
                        confirmVariant="destructive"
                        trigger={
                          <Button
                            variant="outline"
                            className="text-gray-600 border-gray-200 hover:bg-gray-50"
                          >
                            Cancel Bill
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Show status for non-pending bills */}
              {selectedBill.status !== "Pending" && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bill Status:</span>
                    <Badge className={getStatusColor(selectedBill.status)}>{selectedBill.status}</Badge>
                  </div>
                  {selectedBill.paymentMethod && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Payment Method:</span>
                      <span className="text-sm font-medium">{selectedBill.paymentMethod}</span>
                    </div>
                  )}
                  {selectedBill.paymentDate && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Payment Date:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedBill.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
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
      <Dialog open={isAddItemOpen} onOpenChange={(open) => {
        setIsAddItemOpen(open)
        if (!open) {
          // Reset form when closing
          setItemForm({ type: "medicine", name: "", quantity: 1, unitPrice: 0, description: "", inventoryItemId: null })
          setSelectedGst(null)
          setMedicineSearch("")
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Item to Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
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
                {medicineSearch && availableMedicines.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg bg-white shadow-lg">
                    {(availableMedicines || []).map((medicine: any) => (
                      <div 
                        key={medicine.id} 
                        className={`p-3 hover:bg-medical-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                          itemForm.inventoryItemId === medicine.id ? 'bg-medical-100 border-medical-300' : ''
                        }`}
                        onClick={() => {
                          selectMedicine(medicine)
                          setMedicineSearch("")
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{medicine.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="inline-flex items-center gap-2">
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                                  Stock: {medicine.currentStock} {medicine.unit}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                  ₹{medicine.pricePerUnit}/{medicine.unit}
                                </span>
                              </span>
                            </div>
                          </div>
                          {itemForm.inventoryItemId === medicine.id && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-medical-500 rounded-full"></div>
                            </div>
                          )}
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
                disabled={itemForm.inventoryItemId !== null}
                className={itemForm.inventoryItemId !== null ? "bg-gray-100 cursor-not-allowed" : ""}
                title={itemForm.inventoryItemId !== null ? "Item name is locked for inventory items" : ""}
              />
              {itemForm.inventoryItemId !== null && (
                <div className="text-xs text-gray-600 mt-1">
                  💡 Name is automatically set from inventory
                </div>
              )}
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
                  disabled={itemForm.inventoryItemId !== null}
                  className={itemForm.inventoryItemId !== null ? "bg-gray-100 cursor-not-allowed" : ""}
                  title={itemForm.inventoryItemId !== null ? "Unit price is locked for inventory items" : ""}
                />
                {itemForm.inventoryItemId !== null && (
                  <div className="text-xs text-gray-600 mt-1">
                    💡 Price is automatically set from inventory
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>GST Rate (Optional)</Label>
              <GstSelector
                selectedGstId={selectedGst?.id}
                onGstChange={setSelectedGst}
                category={itemForm.type}
                placeholder="Select GST rate (optional)"
              />
            </div>

            {/* Show inventory info if selected */}
            {itemForm.inventoryItemId && (
              <div className="p-3 bg-medical-50 rounded-lg border border-medical-200">
                <div className="text-sm font-medium text-medical-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-medical-500 rounded-full"></div>
                  Inventory Information
                </div>
                {(() => {
                  const selectedMedicine = availableMedicines.find((med: any) => med.id === itemForm.inventoryItemId)
                  return selectedMedicine ? (
                    <div className="text-sm text-medical-700 space-y-1">
                      <div>Code: {selectedMedicine.code || 'N/A'}</div>
                      <div>Current Stock: {selectedMedicine.currentStock} {selectedMedicine.unit}</div>
                      <div>Price per Unit: ₹{selectedMedicine.pricePerUnit}</div>
                      {selectedMedicine.batches?.[0] && (
                        <div className="mt-2 pt-2 border-t border-medical-200">
                          <div>Latest Batch: {selectedMedicine.batches[0].batchNumber}</div>
                          {selectedMedicine.batches[0].expiryDate && (
                            <div>Expiry: {new Date(selectedMedicine.batches[0].expiryDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null
                })()}
              </div>
            )}

            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Additional details about the item"
              />
            </div>

            {/* Price Calculation Preview */}
            {itemForm.quantity > 0 && itemForm.unitPrice > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(itemForm.quantity * itemForm.unitPrice).toFixed(2)}</span>
                  </div>
                  {selectedGst && (
                    <div className="flex justify-between text-blue-600">
                      <span>GST ({selectedGst.rate}%):</span>
                      <span>₹{((itemForm.quantity * itemForm.unitPrice * selectedGst.rate) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>₹{(itemForm.quantity * itemForm.unitPrice + (selectedGst ? (itemForm.quantity * itemForm.unitPrice * selectedGst.rate) / 100 : 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

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

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Item Type</div>
                <div className="font-medium capitalize">{editingItem.itemType}</div>
              </div>

              <div>
                <Label>Item Name</Label>
                <Input
                  value={editItemForm.name}
                  onChange={(e) => setEditItemForm({ ...editItemForm, name: e.target.value })}
                  placeholder="Enter item name"
                  disabled={editingItem?.inventoryItem !== null && editingItem?.inventoryItem !== undefined}
                  className={editingItem?.inventoryItem ? "bg-gray-100 cursor-not-allowed" : ""}
                  title={editingItem?.inventoryItem ? "Item name is locked for inventory items" : ""}
                />
                {editingItem?.inventoryItem && (
                  <div className="text-xs text-gray-600 mt-1">
                    💡 Name is automatically set from inventory
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={editItemForm.quantity}
                    onChange={(e) => setEditItemForm({ ...editItemForm, quantity: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Unit Price (₹)</Label>
                  <Input
                    type="number"
                    value={editItemForm.unitPrice}
                    onChange={(e) => setEditItemForm({ ...editItemForm, unitPrice: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    disabled={editingItem?.inventoryItem !== null && editingItem?.inventoryItem !== undefined}
                    title={editingItem?.inventoryItem ? "Unit price is locked for inventory items" : ""}
                  />
                </div>
              </div>

              <div>
                <Label>GST Rate (Optional)</Label>
                <GstSelector
                  selectedGstId={selectedGst?.id}
                  onGstChange={setSelectedGst}
                  category={editingItem.itemType}
                  placeholder="Select GST rate (optional)"
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={editItemForm.description}
                  onChange={(e) => setEditItemForm({ ...editItemForm, description: e.target.value })}
                  placeholder="Additional details about the item"
                />
              </div>

              {/* Show inventory info if linked */}
              {editingItem.inventoryItem && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">Inventory Information</div>
                  <div className="text-sm text-blue-700">
                    <div>Code: {editingItem.inventoryItem.code}</div>
                    <div>Current Stock: {editingItem.inventoryItem.currentStock} {editingItem.inventoryItem.unit}</div>
                    <div>Price per Unit: ₹{editingItem.inventoryItem.pricePerUnit}</div>
                    {editingItem.inventoryItem.batches?.[0] && (
                      <div className="mt-1 pt-1 border-t border-blue-200">
                        <div>Latest Batch: {editingItem.inventoryItem.batches[0].batchNumber}</div>
                        {editingItem.inventoryItem.batches[0].expiryDate && (
                          <div>Expiry: {new Date(editingItem.inventoryItem.batches[0].expiryDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Price Calculation Preview */}
              {editItemForm.quantity > 0 && editItemForm.unitPrice > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{(editItemForm.quantity * editItemForm.unitPrice).toFixed(2)}</span>
                    </div>
                    {selectedGst && (
                      <div className="flex justify-between text-blue-600">
                        <span>GST ({selectedGst.rate}%):</span>
                        <span>₹{((editItemForm.quantity * editItemForm.unitPrice * selectedGst.rate) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total:</span>
                      <span>₹{(editItemForm.quantity * editItemForm.unitPrice + (selectedGst ? (editItemForm.quantity * editItemForm.unitPrice * selectedGst.rate) / 100 : 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setIsEditItemOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={updateItem} className="bg-medical-500 hover:bg-medical-600">
                  Update Item
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* GST Management Dialog */}
      <Dialog open={isGstManagementOpen} onOpenChange={setIsGstManagementOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GST Rate Management</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add/Edit GST Form */}
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">{editingGst ? "Edit GST Rate" : "Add New GST Rate"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={gstForm.name}
                    onChange={(e) => setGstForm({ ...gstForm, name: e.target.value })}
                    placeholder="e.g., Medicine GST"
                  />
                </div>
                <div>
                  <Label>Rate (%) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={gstForm.rate}
                    onChange={(e) => setGstForm({ ...gstForm, rate: e.target.value })}
                    placeholder="e.g., 18"
                  />
                </div>
                <div>
                  <Label>GST Category</Label>
                  <GstCategorySelector
                    value={gstForm.categoryId}
                    onValueChange={(value) => setGstForm({ ...gstForm, categoryId: value })}
                    placeholder="Select GST category"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={gstForm.description}
                    onChange={(e) => setGstForm({ ...gstForm, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={editingGst ? updateGstRate : createGstRate}
                  disabled={!gstForm.name || !gstForm.rate}
                  className="bg-medical-500 hover:bg-medical-600"
                >
                  {editingGst ? "Update" : "Create"} GST Rate
                </Button>
                {editingGst && (
                  <Button onClick={resetGstForm} variant="outline">
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>

            {/* GST Rates List */}
            <div>
              <h3 className="font-medium mb-4">Existing GST Rates</h3>
              <div className="space-y-2">
                {(gstRates || []).map((gst) => (
                  <div key={gst.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{gst.name}</div>
                      <div className="text-sm text-gray-600">
                        Rate: {gst.rate}%
                        {gst.category && ` • Category: ${gst.category.name}`}
                        {gst.description && ` • ${gst.description}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={gst.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {gst.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editGst(gst)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleGstStatus(gst.id)}
                      >
                        {gst.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <DeleteConfirmModal
                        title="Delete GST Rate"
                        itemName="GST Rate"
                        description={`"${gst.name}" (${gst.rate}%) will be permanently removed. This action cannot be undone.`}
                        onConfirm={() => deleteGstRate(gst.id)}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice View Modal */}
      <InvoiceViewModal
        isOpen={isInvoiceViewOpen}
        onClose={() => setIsInvoiceViewOpen(false)}
        bill={selectedBill && selectedBill.items ? selectedBill as any : null}
      />
    </div>
  )
}

export default Billing
