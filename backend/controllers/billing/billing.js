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

// Helper function to format timing display with full descriptions
const formatTimingForBill = (timing) => {
  if (!timing || timing === 'No meal restriction') {
    return 'No meal restriction'
  }
  
  const timingMap = {
    'AC': 'Before meals (AC)',
    'PC': 'After meals (PC)', 
    'HS': 'At bedtime (HS)',
    'Empty stomach': 'Empty stomach',
    'With food': 'With food',
    'Before meals': 'Before meals',
    'After meals': 'After meals',
    'At bedtime': 'At bedtime'
  }
  
  return timingMap[timing] || timing
}

// Helper function to create inventory audit log
const createInventoryAudit = async (inventoryItemId, action, quantityBefore, quantityAfter, reason, reference = null, referenceId = null, performedBy = null, notes = null) => {
  try {
    const quantityChanged = quantityAfter - quantityBefore
    
    await prisma.inventoryAudit.create({
      data: {
        inventoryItemId,
        action,
        quantityBefore,
        quantityAfter,
        quantityChanged,
        reason,
        reference,
        referenceId,
        performedBy,
        notes,
      }
    })
  } catch (error) {
    console.error('Error creating inventory audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Helper function to calculate medicine quantity from frequency and duration
const calculateMedicineQuantity = (frequency, duration) => {
  try {
    let timesPerDay = 1
    const freqLower = frequency.toLowerCase().trim()
    
    // Handle special cases for "As directed", "As needed", "As prescribed", "PRN", "SOS"
    if (freqLower.includes('as directed') || freqLower.includes('as needed') || 
        freqLower.includes('as prescribed') || freqLower.includes('prn') || 
        freqLower.includes('sos') || freqLower.includes('if required')) {
      // For "As directed" cases, DO NOT set a default quantity
      // This is medically inappropriate and can lead to over/under-prescribing
      // Return 0 to indicate manual quantity entry is required
      return 0
    }
    
    // Handle dosage format like "1-0-1", "1-1-1", "0-0-1", etc.
    const dosageMatch = freqLower.match(/(\d+)-(\d+)-(\d+)/)
    if (dosageMatch) {
      const morning = parseInt(dosageMatch[1])
      const afternoon = parseInt(dosageMatch[2])
      const evening = parseInt(dosageMatch[3])
      timesPerDay = morning + afternoon + evening
    }
    // Handle standard frequency descriptions
    else if (freqLower.includes('bid') || freqLower.includes('twice') || freqLower.includes('2 times') || freqLower.includes('2x')) {
      timesPerDay = 2
    } else if (freqLower.includes('tid') || freqLower.includes('thrice') || freqLower.includes('3 times') || freqLower.includes('3x')) {
      timesPerDay = 3
    } else if (freqLower.includes('qid') || freqLower.includes('4 times') || freqLower.includes('4x')) {
      timesPerDay = 4
    } else if (freqLower.includes('once') || freqLower.includes('1 time') || freqLower.includes('1x') || freqLower.includes('od')) {
      timesPerDay = 1
    } else {
      // Try to extract number from frequency
      const match = freqLower.match(/(\d+)/)
      if (match) {
        timesPerDay = parseInt(match[1])
      }
    }

    // Parse duration (e.g., "7 days", "2 weeks", "1 month")
    let totalDays = 7 // default
    const durLower = duration.toLowerCase()
    
    if (durLower.includes('day')) {
      const match = durLower.match(/(\d+)\s*days?/)
      if (match) totalDays = parseInt(match[1])
    } else if (durLower.includes('week')) {
      const match = durLower.match(/(\d+)\s*weeks?/)
      if (match) totalDays = parseInt(match[1]) * 7
    } else if (durLower.includes('month')) {
      const match = durLower.match(/(\d+)\s*months?/)
      if (match) totalDays = parseInt(match[1]) * 30
    } else {
      // Try to extract number and assume days
      const match = durLower.match(/(\d+)/)
      if (match) totalDays = parseInt(match[1])
    }

    return Math.max(1, timesPerDay * totalDays) // Minimum 1 unit
  } catch (error) {
    console.error("Error calculating medicine quantity:", error)
    return 1 // Default to 1 if calculation fails
  }
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

    // Create bill initially
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
      },
    })

    // Auto-add consultation fee if doctor has consultation fee set
    let consultationFeeAdded = false
    if (prescription.doctorName) {
      const doctor = await prisma.staff.findFirst({
        where: { name: prescription.doctorName },
        select: { consultationFee: true, name: true },
      })

      if (doctor && doctor.consultationFee && parseFloat(doctor.consultationFee) > 0) {
        await prisma.billItem.create({
          data: {
            billId: bill.id,
            itemType: "service",
            itemName: `${prescription.appointment?.type || "Consultation"} - Dr. ${prescription.doctorName}`,
            description: `${prescription.appointment?.type || "Consultation"} fee`,
            quantity: 1,
            unitPrice: parseFloat(doctor.consultationFee),
            totalPrice: parseFloat(doctor.consultationFee),
            gstAmount: 0,
          },
        })
        consultationFeeAdded = true
      }
    }

    // Auto-add medicines from prescription with inventory prices and calculated quantities
    let medicinesAdded = 0
    if (prescription.medications && prescription.medications.length > 0) {
      for (const medication of prescription.medications) {
        // Try to find this medicine in inventory
        const inventoryMedicine = await prisma.inventoryItem.findFirst({
          where: {
            name: { contains: medication.medicineName, mode: "insensitive" },
            currentStock: { gt: 0 },
          },
          include: {
            batches: {
              orderBy: { restockedAt: "desc" },
              take: 1,
            },
          },
        })

        if (inventoryMedicine) {
          // Check if medicine is expired
          let isExpired = false
          if (inventoryMedicine.expiryDate) {
            const expiryDate = new Date(inventoryMedicine.expiryDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            expiryDate.setHours(0, 0, 0, 0)
            isExpired = expiryDate < today
          }
          
          // Skip expired medicines - don't add to bill
          if (isExpired) {
            console.warn(`Skipping expired medicine: ${medication.medicineName} (Expired: ${inventoryMedicine.expiryDate})`)
            continue
          }
          
          // Calculate quantity based on frequency and duration
          const calculatedQuantity = calculateMedicineQuantity(medication.frequency, medication.duration)
          
          // Get the latest batch for batch information
          const latestBatch = inventoryMedicine.batches[0]
          const batchInfo = latestBatch ? ` (Batch: ${latestBatch.batchNumber})` : ""
          
          await prisma.billItem.create({
            data: {
              billId: bill.id,
              itemType: "medicine",
              itemName: medication.medicineName,
              description: `${medication.medicineName} - ${medication.dosage} - ${medication.frequency} • ${formatTimingForBill(medication.timing)} • ${medication.duration}${batchInfo}`,
              quantity: calculatedQuantity,
              unitPrice: inventoryMedicine.pricePerUnit,
              totalPrice: calculatedQuantity * inventoryMedicine.pricePerUnit,
              inventoryItemId: inventoryMedicine.id,
              gstAmount: 0,
            },
          })
          medicinesAdded++
        } else {
          // Add medicine without inventory link (manual pricing required)
          const calculatedQuantity = calculateMedicineQuantity(medication.frequency, medication.duration)
          
          await prisma.billItem.create({
            data: {
              billId: bill.id,
              itemType: "medicine",
              itemName: medication.medicineName,
              description: `${medication.medicineName} - ${medication.dosage} - ${medication.frequency} • ${formatTimingForBill(medication.timing)} • ${medication.duration} (Not in inventory)`,
              quantity: calculatedQuantity,
              unitPrice: 0, // Will need manual pricing
              totalPrice: 0,
              gstAmount: 0,
            },
          })
          medicinesAdded++
        }
      }
    }

    // Recalculate bill totals
    await recalculateBillTotals(bill.id)

    // Fetch the complete bill with all items
    const completeBill = await prisma.bill.findUnique({
      where: { id: bill.id },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: { name: true, code: true, unit: true, pricePerUnit: true, currentStock: true },
            },
            gstRate: {
              select: { name: true, rate: true },
            },
          },
        },
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
            investigations: true,
            medications: {
              select: {
                id: true,
                medicineName: true,
                dosage: true,
                frequency: true,
                timing: true,
                duration: true,
              },
            },
          },
        },
      },
    })

    res.status(201).json({
      ...completeBill,
      autoAddedItems: {
        consultationFee: consultationFeeAdded,
        medicines: medicinesAdded,
      },
    })
  } catch (error) {
    console.error("Error creating bill from prescription:", error)
    res.status(500).json({ error: "Failed to create bill" })
  }
}

// Add medicine item to bill
const addMedicineItem = async (req, res) => {
  try {
    const { billId } = req.params
    const { medicineName, quantity, unitPrice, inventoryItemId, gstRateId } = req.body

    if (!medicineName || !quantity || !unitPrice) {
      return res.status(400).json({ error: "Medicine name, quantity, and unit price are required" })
    }

    // Validate unit price is not zero
    if (Number.parseFloat(unitPrice) <= 0) {
      return res.status(400).json({ error: "Unit price must be greater than zero for billing" })
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

    // Check if inventory item is expired
    if (inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: Number.parseInt(inventoryItemId) }
      })
      
      if (inventoryItem && inventoryItem.expiryDate) {
        const expiryDate = new Date(inventoryItem.expiryDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        expiryDate.setHours(0, 0, 0, 0)
        
        if (expiryDate < today) {
          return res.status(400).json({ 
            error: `Cannot add expired medicine to bill. ${medicineName} expired on ${expiryDate.toLocaleDateString()}` 
          })
        }
      }
    }

    const totalPrice = Number.parseFloat(quantity) * Number.parseFloat(unitPrice)
    let gstAmount = 0

    // Calculate GST amount if GST rate is selected
    if (gstRateId) {
      const gstRate = await prisma.gstRate.findUnique({
        where: { id: Number.parseInt(gstRateId) }
      })
      if (gstRate && gstRate.isActive) {
        gstAmount = (totalPrice * gstRate.rate) / 100
      }
    }

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
        gstRateId: gstRateId ? Number.parseInt(gstRateId) : null,
        gstAmount,
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
    const { serviceName, quantity = 1, unitPrice, description, gstRateId } = req.body

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
    let gstAmount = 0

    // Calculate GST amount if GST rate is selected
    if (gstRateId) {
      const gstRate = await prisma.gstRate.findUnique({
        where: { id: Number.parseInt(gstRateId) }
      })
      if (gstRate && gstRate.isActive) {
        gstAmount = (totalPrice * gstRate.rate) / 100
      }
    }

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
        gstRateId: gstRateId ? Number.parseInt(gstRateId) : null,
        gstAmount,
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

  let subtotal = 0
  let gstAmount = 0

  billItems.forEach((item) => {
    subtotal += item.totalPrice
    gstAmount += item.gstAmount // GST is now calculated per item
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
              select: { 
                name: true, 
                code: true, 
                unit: true, 
                pricePerUnit: true, 
                currentStock: true,
                batches: {
                  orderBy: { restockedAt: "desc" },
                  take: 1,
                  select: {
                    batchNumber: true,
                    expiryDate: true,
                    supplier: true,
                  },
                },
              },
            },
            gstRate: {
              select: { name: true, rate: true },
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
            investigations: true,
            medications: {
              select: {
                id: true,
                medicineName: true,
                dosage: true,
                frequency: true,
                timing: true,
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
    const { status, patientId, prescriptionId, prescriptionIds, search, limit = 50, offset = 0, startDate, endDate } = req.query

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

    // Support multiple prescription IDs for bulk checking
    if (prescriptionIds) {
      const ids = prescriptionIds.split(',').map(id => Number.parseInt(id.trim())).filter(id => !isNaN(id))
      if (ids.length > 0) {
        where.prescriptionId = { in: ids }
      }
    }

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: "insensitive" } },
        { patient: { name: { contains: search, mode: "insensitive" } } },
        { patient: { visibleId: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Date filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Add one day to include the end date
        const endDateTime = new Date(endDate)
        endDateTime.setDate(endDateTime.getDate() + 1)
        where.createdAt.lt = endDateTime
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.bill.count({ where })

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

    res.json({
      bills,
      total: totalCount,
      page: Math.floor(Number.parseInt(offset) / Number.parseInt(limit)) + 1,
      totalPages: Math.ceil(totalCount / Number.parseInt(limit))
    })
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

    // Check if bill is being marked as paid for the first time
    const currentBill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        items: {
          include: {
            inventoryItem: true
          }
        }
      }
    })

    // Validate zero-cost and zero-quantity items before marking as paid
    if (status === "Paid") {
      const zeroCostItems = currentBill.items.filter(item => item.unitPrice <= 0)
      const zeroQuantityItems = currentBill.items.filter(item => item.quantity <= 0)
      
      if (zeroCostItems.length > 0) {
        const itemNames = zeroCostItems.map(item => item.itemName).join(', ')
        return res.status(400).json({ 
          error: `Cannot mark bill as paid. The following items have zero or invalid pricing: ${itemNames}. Please update prices before payment.` 
        })
      }
      
      if (zeroQuantityItems.length > 0) {
        const itemNames = zeroQuantityItems.map(item => item.itemName).join(', ')
        return res.status(400).json({ 
          error: `Cannot mark bill as paid. The following items have zero quantity: ${itemNames}. Please update quantities before payment. Note: "As directed", "As needed", and "As prescribed" medicines require manual quantity entry.` 
        })
      }
      
      // Also check if total amount is zero
      if (currentBill.totalAmount <= 0) {
        return res.status(400).json({ 
          error: "Cannot mark bill as paid with zero total amount. Please add items or update pricing." 
        })
      }
    }

    if (status === "Paid" && currentBill.status !== "Paid") {
      updateData.paymentDate = new Date()
      if (paymentMethod) {
        updateData.paymentMethod = paymentMethod
      }

      // Reduce inventory for medicine items with audit logging
      for (const item of currentBill.items) {
        if (item.itemType === "medicine" && item.inventoryItemId) {
          // Get current stock before update
          const inventoryItem = await prisma.inventoryItem.findUnique({
            where: { id: item.inventoryItemId }
          })
          
          if (inventoryItem) {
            const quantityBefore = inventoryItem.currentStock
            const quantityAfter = quantityBefore - item.quantity
            
            // Update inventory
            await prisma.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: {
                currentStock: {
                  decrement: item.quantity
                }
              }
            })
            
            // Create audit log
            await createInventoryAudit(
              item.inventoryItemId,
              'BILLING',
              quantityBefore,
              quantityAfter,
              `Stock reduced due to billing - Bill #${currentBill.billNumber}`,
              'BILL',
              currentBill.id,
              'System', // Could be replaced with actual user info if available
              `Medicine: ${item.itemName}, Quantity: ${item.quantity}, Patient: ${currentBill.patient?.name || 'Unknown'}`
            )
          }
        }
      }
    } else if (status === "Paid") {
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

// Update bill item GST
const updateBillItemGst = async (req, res) => {
  try {
    const { billId, itemId } = req.params
    const { gstRateId } = req.body

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ error: "Cannot modify paid bill" })
    }

    const billItem = await prisma.billItem.findUnique({
      where: { id: Number.parseInt(itemId) },
    })

    if (!billItem) {
      return res.status(404).json({ error: "Bill item not found" })
    }

    let gstAmount = 0

    // Calculate new GST amount if GST rate is selected
    if (gstRateId) {
      const gstRate = await prisma.gstRate.findUnique({
        where: { id: Number.parseInt(gstRateId) }
      })
      if (gstRate && gstRate.isActive) {
        gstAmount = (billItem.totalPrice * gstRate.rate) / 100
      }
    }

    // Update bill item
    const updatedBillItem = await prisma.billItem.update({
      where: { id: Number.parseInt(itemId) },
      data: {
        gstRateId: gstRateId ? Number.parseInt(gstRateId) : null,
        gstAmount,
      },
      include: {
        gstRate: {
          select: { name: true, rate: true },
        },
      },
    })

    // Recalculate bill totals
    await recalculateBillTotals(Number.parseInt(billId))

    res.json(updatedBillItem)
  } catch (error) {
    console.error("Error updating bill item GST:", error)
    res.status(500).json({ error: "Failed to update bill item GST" })
  }
}

// Update bill item (for editing consultation fee and medicines)
const updateBillItem = async (req, res) => {
  try {
    const { billId, itemId } = req.params
    const { itemName, description, quantity, unitPrice, gstRateId, inventoryItemId } = req.body

    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(billId) },
    })

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" })
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ error: "Cannot modify paid bill" })
    }

    const billItem = await prisma.billItem.findUnique({
      where: { id: Number.parseInt(itemId) },
    })

    if (!billItem) {
      return res.status(404).json({ error: "Bill item not found" })
    }

    // Validate required fields
    if (!itemName || !quantity || !unitPrice) {
      return res.status(400).json({ error: "Item name, quantity, and unit price are required" })
    }

    const newQuantity = Number.parseFloat(quantity)
    const newUnitPrice = Number.parseFloat(unitPrice)
    const newTotalPrice = newQuantity * newUnitPrice

    let gstAmount = 0

    // Calculate GST amount if GST rate is selected
    if (gstRateId) {
      const gstRate = await prisma.gstRate.findUnique({
        where: { id: Number.parseInt(gstRateId) }
      })
      if (gstRate && gstRate.isActive) {
        gstAmount = (newTotalPrice * gstRate.rate) / 100
      }
    }

    // Update bill item - preserve existing inventoryItemId if not explicitly provided
    const updatedBillItem = await prisma.billItem.update({
      where: { id: Number.parseInt(itemId) },
      data: {
        itemName,
        description: description || billItem.description,
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        totalPrice: newTotalPrice,
        gstRateId: gstRateId ? Number.parseInt(gstRateId) : null,
        gstAmount,
        inventoryItemId: inventoryItemId !== undefined ? (inventoryItemId ? Number.parseInt(inventoryItemId) : null) : billItem.inventoryItemId,
      },
      include: {
        inventoryItem: {
          select: { 
            name: true, 
            code: true, 
            unit: true, 
            pricePerUnit: true, 
            currentStock: true,
            batches: {
              orderBy: { restockedAt: "desc" },
              take: 1,
              select: {
                batchNumber: true,
                expiryDate: true,
                supplier: true,
              },
            },
          },
        },
        gstRate: {
          select: { name: true, rate: true },
        },
      },
    })

    // Recalculate bill totals
    await recalculateBillTotals(Number.parseInt(billId))

    res.json(updatedBillItem)
  } catch (error) {
    console.error("Error updating bill item:", error)
    res.status(500).json({ error: "Failed to update bill item" })
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

// Get bill invoice data with hospital information
const getBillInvoice = async (req, res) => {
  try {
    const { id } = req.params

    // Get bill details
    const bill = await prisma.bill.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: { name: true, code: true, unit: true, pricePerUnit: true, currentStock: true },
            },
            gstRate: {
              select: { name: true, rate: true },
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
            investigations: true,
            medications: {
              select: {
                id: true,
                medicineName: true,
                dosage: true,
                frequency: true,
                timing: true,
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

    // Get hospital information
    const hospitalInfo = await prisma.hospitalSettings.findFirst({
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        license: true,
      },
    })

    res.json({
      bill,
      hospitalInfo: hospitalInfo || {
        name: "Medical Clinic",
        address: "",
        phone: "",
        email: "",
        license: "",
      },
    })
  } catch (error) {
    console.error("Error fetching bill invoice:", error)
    res.status(500).json({ error: "Failed to fetch bill invoice" })
  }
}

module.exports = {
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
}
