const express = require("express")
const router = express.Router()
const {
  createBillFromPrescription,
  addMedicineItem,
  addServiceItem,
  getBill,
  getAllBills,
  updatePaymentStatus,
  toggleGST,
  deleteBillItem,
  getBillingAnalytics,
  getAvailableMedicines,
  getConsultationFee,
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

// Toggle GST for bill
router.put("/:id/gst", toggleGST)

// Delete bill item
router.delete("/:billId/items/:itemId", deleteBillItem)

// Get available medicines from inventory
router.get("/medicines/available", getAvailableMedicines)

// Get doctor's consultation fee
router.get("/consultation-fee/:doctorName", getConsultationFee)

module.exports = router
