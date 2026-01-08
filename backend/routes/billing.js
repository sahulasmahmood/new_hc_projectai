const express = require("express")
const router = express.Router()
const {
  createBillFromPrescription,
  addMedicineItem,
  addServiceItem,
  getBill,
  getAllBills,
  updatePaymentStatus,
  updateBillItemGst,
  updateBillItem,
  deleteBillItem,
  getBillingAnalytics,
  getAvailableMedicines,
  getConsultationFee,
  getBillInvoice,
} = require("../controllers/billing/billing")

// Create bill from prescription
router.post("/create-from-prescription", createBillFromPrescription)

// Get all bills with filters
router.get("/", getAllBills)

// Get billing analytics
router.get("/analytics", getBillingAnalytics)

// Get single bill
router.get("/:id", getBill)

// Add medicine item to bill
router.post("/:billId/medicines", addMedicineItem)

// Add service item to bill
router.post("/:billId/services", addServiceItem)

// Update payment status
router.put("/:id/payment", updatePaymentStatus)

// Update bill item GST
router.put("/:billId/items/:itemId/gst", updateBillItemGst)

// Update bill item (for editing consultation fee and medicines)
router.put("/:billId/items/:itemId", updateBillItem)

// Delete bill item
router.delete("/:billId/items/:itemId", deleteBillItem)

// Get available medicines from inventory
router.get("/medicines/available", getAvailableMedicines)

// Get doctor's consultation fee
router.get("/consultation-fee/:doctorName", getConsultationFee)

// Get invoice data (bill with hospital info)
router.get("/:id/invoice", getBillInvoice)

module.exports = router
