const { PrismaClient } = require("../../generated/prisma")
const prisma = new PrismaClient()

// Generate unique bill number
const generateBillNumber = async () => {
  const currentYear = new Date().getFullYear()
  const prefix = `BILL-${currentYear}-`

  const lastBill = await prisma.bill.findFirst({
    where: {
      billNumber: { startsWith: prefix },
    },
    orderBy: { billNumber: "desc" },
  })

  let nextNumber = 1
  if (lastBill && lastBill.billNumber) {
    const match = lastBill.billNumber.match(/BILL-\d{4}-(\d{4})$/)
    if (match) {
      nextNumber = Number.parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`
}

// Create bill from prescription
const createBillFromPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.body

    if (!prescriptionId) {
      return res.status(400).json({ error: "Prescription ID is required" })
    }

    // Get prescription with patient and appointment details
    const prescription = await prisma.prescription.findUnique({
      where: { id: Number.parseInt(prescriptionId) },
      include: {
        patient: true,
        appointment: true,
        medications: true,
      },
    })

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" })
    }

    // Check if bill already exists for this prescription
    const existingBill = await prisma.bill.findFirst({
      where: { prescriptionId: Number.parseInt(prescriptionId) },
    })

    if (existingBill) {
      return res.status(400).json({ error: "Bill already exists for this prescription" })
    }

    // Generate bill number
    const billNumber = await generateBillNumber()

    // Create bill without any items initially - let user add consultation fee manually
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        patientId: prescription.patientId,
        appointmentId: prescription.appointmentId,
        prescriptionId: Number.parseInt(prescriptionId),
        subtotal: 0,
        gstAmount: 0,
        totalAmount: 0,
        status: "Pending",
        gstEnabled: false,
      },
      include: {
        items: true,
        patient: {
          select: {
            name: true,
            visibleId: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            type: true,
            date: true,
            time: true,
          },
        },
        prescription: {
          select: {
            doctorName: true,
            medications: {
              select: {
                id: true,
                medicineName: true,
                dosage: true,
                frequency: true,
                duration: true,
              },
            },
          },
        },
      },
    })

    res.status(201).json(bill)
  } catch (error) {
    console.error("Error creating bill from prescription:", error)
    res.status(500).json({ error: "Failed to create bill" })
  }
}

// Add medicine item to bill
const addMedicineItem = async (req, res) => {
  try {
    const { billId } = req.params
    const { medicineName, quantity, unitPrice, inventoryItemId, gstApplicable = true } = req.body

    if (!medicineName || !quantity || !unitPrice) {
      return res.status(400).json({ error: "Medicine name, quantity, and unit price are required" })
    }

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(billId) },
      include: { items: true },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ error: "Cannot modify paid bill" })
    }

    const totalPrice = Number.parseFloat(quantity) * Number.parseFloat(unitPrice)

    // Add medicine item
    const billItem = await prisma.billItem.create({
      data: {
        billId: Number.parseInt(billId),
        itemType: "medicine",
        itemName: medicineName,
        description: `Medicine - ${medicineName}`,
        quantity: Number.parseFloat(quantity),
        unitPrice: Number.parseFloat(unitPrice),
        totalPrice,
        inventoryItemId: inventoryItemId ? Number.parseInt(inventoryItemId) : null,
        gstApplicable: Boolean(gstApplicable),
      },
    })

    // Recalculate bill totals
    await recalculateBillTotals(Number.parseInt(billId))

    res.status(201).json(billItem)
  } catch (error) {
    console.error("Error adding medicine item:", error)
    res.status(500).json({ error: "Failed to add medicine item" })
  }
}

// Add service item to bill
const addServiceItem = async (req, res) => {
  try {
    const { billId } = req.params
    const { serviceName, quantity = 1, unitPrice, description } = req.body

    if (!serviceName || !unitPrice) {
      return res.status(400).json({ error: "Service name and unit price are required" })
    }

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ error: "Cannot modify paid bill" })
    }

    const totalPrice = Number.parseFloat(quantity) * Number.parseFloat(unitPrice)

    // Add service item
    const billItem = await prisma.billItem.create({
      data: {
        billId: Number.parseInt(billId),
        itemType: "service",
        itemName: serviceName,
        description: description || `Service - ${serviceName}`,
        quantity: Number.parseFloat(quantity),
        unitPrice: Number.parseFloat(unitPrice),
        totalPrice,
        gstApplicable: false, // Services typically don't have GST in medical billing
      },
    })

    // Recalculate bill totals
    await recalculateBillTotals(Number.parseInt(billId))

    res.status(201).json(billItem)
  } catch (error) {
    console.error("Error adding service item:", error)
    res.status(500).json({ error: "Failed to add service item" })
  }
}

// Recalculate bill totals
const recalculateBillTotals = async (billId) => {
  const billItems = await prisma.billItem.findMany({
    where: { billId },
  })

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
  })

  let subtotal = 0
  let gstAmount = 0

  billItems.forEach((item) => {
    subtotal += item.totalPrice

    // Apply GST only to medicines if GST is enabled
    if (bill.gstEnabled && item.gstApplicable && item.itemType === "medicine") {
      gstAmount += (item.totalPrice * bill.gstRate) / 100
    }
  })

  const totalAmount = subtotal + gstAmount

  await prisma.bill.update({
    where: { id: billId },
    data: {
      subtotal,
      gstAmount,
      totalAmount,
    },
  })
}

// Get bill by ID
const getBill = async (req, res) => {
  try {
    const { id } = req.params

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: { name: true, code: true, unit: true, pricePerUnit: true, currentStock: true },
            },
          },
        },
        patient: {
          select: {
            name: true,
            visibleId: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        appointment: {
          select: {
            date: true,
            time: true,
            type: true,
          },
        },
        prescription: {
          select: {
            doctorName: true,
            createdAt: true,
            medications: {
              select: {
                id: true,
                medicineName: true,
                dosage: true,
                frequency: true,
                duration: true,
              },
            },
          },
        },
      },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    res.json(bill)
  } catch (error) {
    console.error("Error fetching bill:", error)
    res.status(500).json({ error: "Failed to fetch bill" })
  }
}

// Get all bills with filters
const getAllBills = async (req, res) => {
  try {
    const { status, patientId, prescriptionId, search, limit = 50, offset = 0 } = req.query

    const where = {}

    if (status && status !== "all") {
      where.status = status
    }

    if (patientId) {
      where.patientId = Number.parseInt(patientId)
    }

    if (prescriptionId) {
      where.prescriptionId = Number.parseInt(prescriptionId)
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: "insensitive" } },
        { patient: { name: { contains: search, mode: "insensitive" } } },
        { patient: { visibleId: { contains: search, mode: "insensitive" } } },
      ]
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        patient: {
          select: {
            name: true,
            visibleId: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            date: true,
            time: true,
          },
        },
        prescription: {
          select: {
            doctorName: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Number.parseInt(limit),
      skip: Number.parseInt(offset),
    })

    res.json(bills)
  } catch (error) {
    console.error("Error fetching bills:", error)
    res.status(500).json({ error: "Failed to fetch bills" })
  }
}

// Update bill payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, paymentMethod } = req.body

    if (!["Paid", "Pending", "Overdue", "Cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" })
    }

    const updateData = { status }

    if (status === "Paid") {
      updateData.paymentDate = new Date()
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod
      }
    }

    const bill = await prisma.bill.update({
      where: { id: Number.parseInt(id) },
      data: updateData,
      include: {
        patient: {
          select: { name: true, visibleId: true },
        },
      },
    })

    res.json(bill)
  } catch (error) {
    console.error("Error updating payment status:", error)
    res.status(500).json({ error: "Failed to update payment status" })
  }
}

// Toggle GST for bill
const toggleGST = async (req, res) => {
  try {
    const { id } = req.params
    const { gstEnabled, gstRate = 18 } = req.body

    const bill = await prisma.bill.update({
      where: { id: Number.parseInt(id) },
      data: {
        gstEnabled: Boolean(gstEnabled),
        gstRate: Number.parseFloat(gstRate),
      },
    })

    // Recalculate totals with new GST settings
    await recalculateBillTotals(Number.parseInt(id))

    // Return updated bill
    const updatedBill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(id) },
      include: { items: true },
    })

    res.json(updatedBill)
  } catch (error) {
    console.error("Error toggling GST:", error)
    res.status(500).json({ error: "Failed to toggle GST" })
  }
}

// Delete bill item
const deleteBillItem = async (req, res) => {
  try {
    const { billId, itemId } = req.params

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ error: "Cannot modify paid bill" })
    }

    await prisma.billItem.delete({
      where: { id: Number.parseInt(itemId) },
    })

    // Recalculate bill totals
    await recalculateBillTotals(Number.parseInt(billId))

    res.status(204).send()
  } catch (error) {
    console.error("Error deleting bill item:", error)
    res.status(500).json({ error: "Failed to delete bill item" })
  }
}

// Get billing analytics
const getBillingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    let dateFilter = {}
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    // Total revenue (paid bills)
    const paidBills = await prisma.bill.findMany({
      where: {
        status: "Paid",
        ...dateFilter,
      },
      select: {
        totalAmount: true,
        gstAmount: true,
      },
    })

    const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0)
    const totalGST = paidBills.reduce((sum, bill) => sum + bill.gstAmount, 0)

    // Pending amount
    const pendingBills = await prisma.bill.findMany({
      where: {
        status: { in: ["Pending", "Overdue"] },
        ...dateFilter,
      },
      select: { totalAmount: true },
    })

    const pendingAmount = pendingBills.reduce((sum, bill) => sum + bill.totalAmount, 0)

    // Total bills count
    const totalBills = await prisma.bill.count({
      where: dateFilter,
    })

    res.json({
      totalRevenue,
      pendingAmount,
      totalBills,
      totalGST,
      paidBillsCount: paidBills.length,
      pendingBillsCount: pendingBills.length,
    })
  } catch (error) {
    console.error("Error fetching billing analytics:", error)
    res.status(500).json({ error: "Failed to fetch billing analytics" })
  }
}

// Get available medicines from inventory
const getAvailableMedicines = async (req, res) => {
  try {
    const { search } = req.query

    const where = {
      currentStock: { gt: 0 }, // Only medicines with stock
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ]
    }

    const medicines = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
        unit: true,
        pricePerUnit: true,
        category: true,
      },
      orderBy: { name: "asc" },
      take: 50, // Limit results
    })

    res.json(medicines)
  } catch (error) {
    console.error("Error fetching available medicines:", error)
    res.status(500).json({ error: "Failed to fetch available medicines" })
  }
}

// Get doctor's consultation fee
const getConsultationFee = async (req, res) => {
  try {
    const { doctorName } = req.params

    const doctor = await prisma.staff.findFirst({
      where: { name: doctorName },
      select: { consultationFee: true, name: true },
    })

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" })
    }

    const consultationFee = doctor.consultationFee ? Number.parseFloat(doctor.consultationFee) : 0

    res.json({ consultationFee, doctorName: doctor.name })
  } catch (error) {
    console.error("Error fetching consultation fee:", error)
    res.status(500).json({ error: "Failed to fetch consultation fee" })
  }
}

module.exports = {
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
}
